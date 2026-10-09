import AuthForm from "./auth-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const error = (await searchParams).error;
  return <main className="flex min-h-screen items-center justify-center bg-mint px-6"><div className="w-full max-w-md"><p className="mb-6 text-center text-sm font-bold uppercase tracking-[0.2em] text-forest">Churn Shield</p><div className="rounded-2xl bg-white p-8 shadow-soft"><h1 className="text-3xl font-black">Welcome back</h1><p className="mt-2 text-slate-500">Sign in to your recovery workspace.</p>{error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Authentication failed. Please try again.</p>}<AuthForm /></div></div></main>;
}
