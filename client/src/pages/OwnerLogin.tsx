import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { ShieldCheck, LockKeyhole, Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { useLocation } from "wouter";

export default function OwnerLogin() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("codeshuzaifa@gmail.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const utils = trpc.useUtils();
  const login = trpc.auth.ownerLogin.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate("/admin");
    },
    onError: (loginError) => setError(loginError.message || "Owner sign-in failed"),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    login.mutate({ email, password });
  };

  return (
    <main className="mx-auto flex min-h-[75vh] max-w-xl items-center px-4 py-16 sm:px-6">
      <section className="w-full rounded-3xl border border-cyan-200/15 bg-slate-900/80 p-7 shadow-2xl shadow-cyan-950/20 sm:p-10">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-200"><ShieldCheck className="h-7 w-7" /></div>
        <div className="mt-6 text-center"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">Private owner access</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Welcome back</h1><p className="mt-3 text-sm leading-6 text-slate-400">Sign in to manage repair tickets, inventory, orders and the workshop team.</p></div>
        <form className="mt-8 space-y-5" onSubmit={submit}>
          <label className="block text-sm font-medium text-slate-200">Owner email<Input className="mt-2" type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} required /></label>
          <label className="block text-sm font-medium text-slate-200">Password<Input className="mt-2" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required minLength={8} /></label>
          {error && <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">{error}</p>}
          <Button className="w-full" type="submit" disabled={login.isPending}>{login.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in…</> : <><LockKeyhole className="mr-2 h-4 w-4" />Sign in to owner portal</>}</Button>
        </form>
      </section>
    </main>
  );
}
