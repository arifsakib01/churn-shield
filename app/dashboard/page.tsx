import Link from "next/link";
import { ArrowUpRight, CircleDollarSign, RefreshCw, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ManualRetry from "./manual-retry";

export const dynamic = "force-dynamic";

const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser?.email) return null;
  const owner = await db.user.upsert({
    where: { email: authUser.email },
    update: { authUserId: authUser.id },
    create: { email: authUser.email, authUserId: authUser.id },
  });
  const invoiceWhere = { userId: owner.id };
  const [recovered, active, total, recoveredCount, recent] = await Promise.all([
    db.failedInvoice.aggregate({ _sum: { amountDue: true }, where: { ...invoiceWhere, status: "RECOVERED" } }),
    db.failedInvoice.count({ where: { ...invoiceWhere, status: "PENDING_RECOVERY" } }),
    db.failedInvoice.count({ where: invoiceWhere }),
    db.failedInvoice.count({ where: { ...invoiceWhere, status: "RECOVERED" } }),
    db.failedInvoice.findMany({ where: invoiceWhere, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, customerEmail: true, amountDue: true, status: true, createdAt: true, recoveryToken: true } }),
  ]);
  const recoveryRate = total ? Math.round((recoveredCount / total) * 100) : 0;

  return <main className="min-h-screen bg-[#f7faf8] px-5 py-8 md:px-10">
    <header className="mx-auto flex max-w-6xl items-center justify-between"><div><p className="text-sm font-bold uppercase tracking-[0.2em] text-forest">Churn Shield</p><h1 className="mt-2 text-3xl font-black">Recovery overview</h1></div><Link href="/" className="text-sm font-bold text-forest">View site <ArrowUpRight className="inline h-4 w-4" /></Link></header>
    <section className="mx-auto mt-10 grid max-w-6xl gap-4 md:grid-cols-3">
      <Metric icon={<CircleDollarSign />} label="Recovered revenue" value={money(recovered._sum.amountDue ?? 0)} />
      <Metric icon={<RefreshCw />} label="Active failed invoices" value={String(active)} />
      <Metric icon={<ShieldCheck />} label="Overall recovery rate" value={`${recoveryRate}%`} />
    </section>
    <section className="mx-auto mt-10 max-w-6xl overflow-hidden rounded-2xl bg-white shadow-soft"><div className="border-b border-slate-100 px-6 py-5"><h2 className="font-black">Recent failed invoices</h2><p className="mt-1 text-sm text-slate-500">Monitor recovery activity and retry payments manually.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-6 py-4">Customer</th><th className="px-6 py-4">Amount</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Date</th><th className="px-6 py-4 text-right">Action</th></tr></thead><tbody>{recent.map((invoice) => <tr key={invoice.id} className="border-t border-slate-100"><td className="px-6 py-4 font-medium">{invoice.customerEmail}</td><td className="px-6 py-4">{money(invoice.amountDue)}</td><td className="px-6 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${invoice.status === "RECOVERED" ? "bg-mint text-forest" : invoice.status === "FAILED" ? "bg-red-50 text-red-700" : "bg-orange-50 text-orange-700"}`}>{invoice.status.replace("_", " ")}</span></td><td className="px-6 py-4 text-slate-500">{invoice.createdAt.toLocaleDateString()}</td><td className="px-6 py-4 text-right">{invoice.status === "PENDING_RECOVERY" && <ManualRetry token={invoice.recoveryToken} invoiceId={invoice.id} />}</td></tr>)}{recent.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No failed invoices yet.</td></tr>}</tbody></table></div></section>
  </main>;
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl bg-white p-6 shadow-soft"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint text-forest">{icon}</div><p className="mt-5 text-sm text-slate-500">{label}</p><p className="mt-1 text-3xl font-black">{value}</p></div>;
}
