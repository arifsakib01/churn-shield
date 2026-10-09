import Link from "next/link";

export default function BillingSuccessPage() {
  return <main className="flex min-h-screen items-center justify-center bg-mint px-6"><div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-soft"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-mint text-forest">✓</div><h1 className="mt-5 text-2xl font-black">Welcome to Churn Shield</h1><p className="mt-3 text-slate-600">Your subscription is active. We’ll finish setting up your recovery workspace next.</p><Link href="/dashboard" className="mt-6 inline-block rounded-xl bg-forest px-5 py-3 font-bold text-white">Open dashboard</Link></div></main>;
}
