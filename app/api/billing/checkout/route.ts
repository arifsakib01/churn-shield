import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

const priceIds: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  growth: process.env.STRIPE_PRICE_GROWTH,
  scale: process.env.STRIPE_PRICE_SCALE,
};

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; plan?: string };
    const email = body.email?.trim().toLowerCase();
    const plan = body.plan?.toLowerCase() ?? "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid work email" }, { status: 400 });
    const price = priceIds[plan];
    if (!price) return NextResponse.json({ error: "This plan is not configured yet" }, { status: 503 });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) return NextResponse.json({ error: "Application URL is not configured" }, { status: 500 });
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [{ price, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${appUrl.replace(/\/$/, "")}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl.replace(/\/$/, "")}/pricing`,
      metadata: { plan },
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Billing checkout creation failed", error);
    return NextResponse.json({ error: "Unable to start checkout" }, { status: 500 });
  }
}
