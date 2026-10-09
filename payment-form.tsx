"use client";

import { useState } from "react";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : Promise.resolve(null);

function Form({ token, invoiceId, amount, email }: { token: string; invoiceId: string; amount: number; email: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  if (!publishableKey) {
    return <div className="rounded-2xl bg-white p-8 text-center shadow-soft"><h1 className="text-2xl font-black">Payment portal unavailable</h1><p className="mt-3 text-slate-600">Stripe is not configured. Please contact support.</p></div>;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true); setError("");
    const card = elements.getElement(CardElement);
    if (!card) { setError("Card form is unavailable. Please refresh and try again."); setLoading(false); return; }
    const result = await stripe.createPaymentMethod({ type: "card", card });
    if (result.error || !result.paymentMethod) { setError(result.error?.message ?? "Unable to validate your card."); setLoading(false); return; }
    const response = await fetch("/api/invoices/retry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, invoiceId, paymentMethodId: result.paymentMethod.id }) });
    const data = await response.json() as { error?: string; recovered?: boolean };
    if (!response.ok) setError(data.error ?? "Payment could not be completed.");
    else setComplete(Boolean(data.recovered));
    setLoading(false);
  }

  if (complete) return <div className="rounded-2xl bg-white p-8 text-center shadow-soft"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-mint text-forest">✓</div><h1 className="mt-5 text-2xl font-black">Payment updated</h1><p className="mt-3 text-slate-600">Your payment was successful. You can close this page.</p></div>;
  return <form onSubmit={submit} className="rounded-2xl bg-white p-7 shadow-soft"><p className="text-sm text-slate-500">Payment for {email}</p><p className="mt-2 text-3xl font-black">${(amount / 100).toFixed(2)}</p><label className="mt-7 block text-sm font-bold">Card details</label><div className="mt-2 rounded-lg border border-slate-200 p-4"><CardElement options={{ hidePostalCode: false }} /></div>{error && <p className="mt-3 text-sm text-red-600">{error}</p>}<button disabled={loading || !stripe} className="mt-6 w-full rounded-xl bg-forest px-4 py-3 font-bold text-white disabled:opacity-50">{loading ? "Processing…" : "Update card & retry payment"}</button><p className="mt-4 text-center text-xs text-slate-500">Your card details are securely handled by Stripe.</p></form>;
}

export default function PaymentForm(props: { token: string; invoiceId: string; amount: number; email: string }) {
  return <main className="flex min-h-screen items-center justify-center bg-mint px-6 py-12"><div className="w-full max-w-md"><p className="mb-6 text-center text-sm font-bold uppercase tracking-[0.2em] text-forest">Churn Shield</p><Elements stripe={stripePromise}><Form {...props} /></Elements></div></main>;
}
