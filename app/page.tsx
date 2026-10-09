import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-mint px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <p className="mb-6 text-sm font-bold uppercase tracking-[0.2em] text-forest">Churn Shield</p>
        <h1 className="max-w-3xl text-5xl font-black tracking-tight text-ink md:text-7xl">Recover revenue before it becomes churn.</h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">Automated payment recovery that feels personal, secure, and effortless for your customers.</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/pricing" className="rounded-xl bg-forest px-6 py-3 font-bold text-white shadow-soft">View plans</Link>
          <Link href="/dashboard" className="rounded-xl border border-forest px-6 py-3 font-bold text-forest">Open dashboard</Link>
        </div>
      </div>
    </main>
  );
}
