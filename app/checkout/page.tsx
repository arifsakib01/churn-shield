import Link from "next/link";
import CheckoutForm from "./checkout-form";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const plan = (await searchParams).plan?.toLowerCase() ?? "growth";
  const validPlan = ["starter", "growth", "scale"].includes(plan) ? plan : "growth";
  return <main className="flex min-h-screen items-center justify-center bg-mint px-6 py-12"><div className="w-full max-w-md"><Link href="/pricing" className="text-sm font-bold text-forest">← Back to pricing</Link><div className="mt-6 rounded-2xl bg-white p-8 shadow-soft"><p className="text-sm font-bold uppercase tracking-[0.2em] text-forest">Churn Shield {validPlan}</p><h1 className="mt-4 text-3xl font-black">Start your recovery engine</h1><p className="mt-3 text-slate-600">You’ll complete secure payment with Stripe.</p><CheckoutForm plan={validPlan} /></div></div></main>;
}
