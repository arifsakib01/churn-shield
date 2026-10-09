"use client";

import { useState } from "react";

export default function CheckoutForm({ plan }: { plan: string }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    const response = await fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, plan }) });
    const data = await response.json() as { url?: string; error?: string };
    if (!response.ok || !data.url) { setError(data.error ?? "Unable to start checkout."); setLoading(false); return; }
    window.location.assign(data.url);
  }
  return <form onSubmit={submit} className="mt-8"><label className="text-sm font-bold">Work email</label><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-forest" placeholder="you@company.com" />{error && <p className="mt-3 text-sm text-red-600">{error}</p>}<button disabled={loading} className="mt-5 w-full rounded-xl bg-forest px-4 py-3 font-bold text-white disabled:opacity-50">{loading ? "Opening Stripe…" : "Continue to secure checkout"}</button></form>;
}
