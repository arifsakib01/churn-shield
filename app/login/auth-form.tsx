"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setMessage("");
    const supabase = createSupabaseBrowserClient();
    const result = mode === "signin" ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password });
    if (result.error) setMessage(result.error.message);
    else if (mode === "signup") setMessage("Check your email to confirm your account.");
    else window.location.assign("/dashboard");
    setLoading(false);
  }
  return <form onSubmit={submit} className="mt-7"><label className="text-sm font-bold">Email</label><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /><label className="mt-4 block text-sm font-bold">Password</label><input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" />{message && <p className="mt-3 text-sm text-slate-600">{message}</p>}<button disabled={loading} className="mt-5 w-full rounded-xl bg-forest px-4 py-3 font-bold text-white">{loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</button><button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="mt-4 w-full text-sm font-bold text-forest">{mode === "signin" ? "Create a free account" : "Already have an account? Sign in"}</button></form>;
}
