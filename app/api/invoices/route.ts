import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { token?: string; invoiceId?: string; paymentMethodId?: string };
    const token = body.token?.trim();
    if (!token || token.length !== 64 || !/^[a-f0-9]+$/i.test(token)) {
      return NextResponse.json({ error: "Invalid recovery token" }, { status: 400 });
    }
    const failedInvoice = await db.failedInvoice.findUnique({ where: { recoveryToken: token } });
    if (!failedInvoice || failedInvoice.status !== "PENDING_RECOVERY") {
      return NextResponse.json({ error: "This payment link is no longer active" }, { status: 404 });
    }
    if (body.invoiceId && body.invoiceId !== failedInvoice.id) {
      return NextResponse.json({ error: "Invalid invoice reference" }, { status: 400 });
    }
    if (body.paymentMethodId) {
      if (!/^pm_[A-Za-z0-9]+$/.test(body.paymentMethodId)) {
        return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
      }
      await stripe.paymentMethods.attach(body.paymentMethodId, { customer: failedInvoice.stripeCustomerId });
      await stripe.customers.update(failedInvoice.stripeCustomerId, {
        invoice_settings: { default_payment_method: body.paymentMethodId },
      });
    }
    const invoice = await stripe.invoices.retrieve(failedInvoice.stripeInvoiceId);
    if (invoice.status === "paid") {
      await db.failedInvoice.update({ where: { id: failedInvoice.id }, data: { status: "RECOVERED", recoveredAt: new Date() } });
      return NextResponse.json({ recovered: true });
    }
    const paid = await stripe.invoices.pay(invoice.id);
    if (paid.status !== "paid") return NextResponse.json({ error: "Payment could not be completed" }, { status: 402 });
    await db.failedInvoice.update({ where: { id: failedInvoice.id }, data: { status: "RECOVERED", recoveredAt: new Date() } });
    return NextResponse.json({ recovered: true });
  } catch (error) {
    console.error("Invoice retry failed", error);
    return NextResponse.json({ error: "Unable to retry this invoice" }, { status: 500 });
  }
}
