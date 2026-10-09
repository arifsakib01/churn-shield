import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { randomBytes } from "node:crypto";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { sendRecoveryEmail } from "@/lib/resend";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return NextResponse.json({ error: "Invalid webhook configuration" }, { status: 400 });

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await db.webhookLog.create({ data: { stripeEventId: event.id, type: event.type } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("Failed to reserve webhook event", error);
    return NextResponse.json({ error: "Unable to process webhook" }, { status: 500 });
  }

  try {
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      const email = invoice.customer_email;
      if (!customerId || !email) throw new Error(`Invoice ${invoice.id} has no customer or email`);

      const user = await db.user.upsert({
        where: { email },
        update: { stripeUserId: customerId },
        create: { email, stripeUserId: customerId },
      });
      const existing = await db.failedInvoice.findUnique({ where: { stripeInvoiceId: invoice.id } });
      const token = existing?.recoveryToken ?? randomBytes(32).toString("hex");
      const failedInvoice = await db.failedInvoice.upsert({
        where: { stripeInvoiceId: invoice.id },
        update: { userId: user.id, stripeCustomerId: customerId, customerEmail: email, amountDue: invoice.amount_due, status: "PENDING_RECOVERY", recoveredAt: null },
        create: { userId: user.id, stripeInvoiceId: invoice.id, stripeCustomerId: customerId, customerEmail: email, amountDue: invoice.amount_due, recoveryToken: token },
      });
      await sendRecoveryEmail({ email, invoiceId: failedInvoice.stripeInvoiceId, amount: failedInvoice.amountDue, token: failedInvoice.recoveryToken });
    } else if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      await db.failedInvoice.updateMany({
        where: { stripeInvoiceId: invoice.id },
        data: { status: "RECOVERED", recoveredAt: new Date() },
      });
    } else if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.subscription && session.customer && session.customer_details?.email) {
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const customerId = typeof session.customer === "string" ? session.customer : session.customer.id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const periodEnd = subscription.items.data[0]?.current_period_end;
        const currentPeriodEnd = periodEnd ? new Date(periodEnd * 1000) : null;
        const user = await db.user.upsert({
          where: { email: session.customer_details.email },
          update: { stripeUserId: customerId },
          create: { email: session.customer_details.email, stripeUserId: customerId },
        });
        await db.subscription.upsert({
          where: { stripeSubscriptionId: subscriptionId },
          update: {
            userId: user.id,
            stripeCustomerId: customerId,
            plan: session.metadata?.plan ?? "growth",
            status: subscription.status,
            currentPeriodEnd,
          },
          create: {
            userId: user.id,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            plan: session.metadata?.plan ?? "growth",
            status: subscription.status,
            currentPeriodEnd,
          },
        });
      }
    } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      await db.subscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: subscription.status,
          currentPeriodEnd: subscription.items.data[0]?.current_period_end
            ? new Date(subscription.items.data[0].current_period_end * 1000)
            : null,
        },
      });
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    await db.webhookLog.delete({ where: { stripeEventId: event.id } }).catch((cleanupError) => {
      console.error("Failed to release webhook reservation", cleanupError);
    });
    console.error("Stripe webhook processing failed", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
