"use client";

import { useState } from "react";

export default function ManualRetry({ token, invoiceId }: { token: string; invoiceId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  async function retry() {
    setState("loading");
    const response = await fetch("/api/invoices/retry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, invoiceId }) });
    setState(response.ok ? "done" : "error");
  }
  return <button onClick={retry} disabled={state === "loading" || state === "done"} className="rounded-lg border border-forest px-3 py-2 text-xs font-bold text-forest disabled:opacity-50">{state === "loading" ? "Retrying…" : state === "done" ? "Retried" : state === "error" ? "Try again" : "Retry payment"}</button>;
}
