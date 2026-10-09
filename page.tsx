import { db } from "@/lib/db";
import PaymentForm from "./payment-form";

export const dynamic = "force-dynamic";

export default async function UpdatePaymentPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token?.trim() ?? "";
  const validToken = /^[a-f0-9]{64}$/i.test(token);
  const invoice = validToken
    ? await db.failedInvoice.findUnique({ where: { recoveryToken: token }, select: { id: true, amountDue: true, customerEmail: true, status: true } })
    : null;

  if (!invoice || invoice.status !== "PENDING_RECOVERY") {
    return <main className="flex min-h-screen items-center justify-center bg-mint px-6"><div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-soft"><h1 className="text-2xl font-black text-ink">Link unavailable</h1><p className="mt-3 text-slate-600">This payment link is invalid or has already been completed.</p></div></main>;
  }

  return <PaymentForm token={token} invoiceId={invoice.id} amount={invoice.amountDue} email={invoice.customerEmail} />;
}
