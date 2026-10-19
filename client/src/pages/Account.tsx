import { ArrowRight, CheckCircle2, KeyRound, Loader2, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "wouter";
import PublicShell from "@/components/PublicShell";
import { getCustomerAuthClient, normalizeKenyanMpesaPhone } from "@/lib/customerAuth";
import { trpc } from "@/lib/trpc";
import { customerAuthEmail } from "@shared/customerIdentity";

function formatDate(value: string | Date) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, character => character.toUpperCase());
}

function formatPrice(value: number | null) {
  return typeof value === "number" && value > 0 ? `KES ${value.toLocaleString("en-KE")}` : "Price to be confirmed";
}

export default function Account() {
  const [authClient, setAuthClient] = useState<Awaited<ReturnType<typeof getCustomerAuthClient>>>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const customerIdentity = useRef<string | null>(null);
  const sessionEpoch = useRef(0);
  const utils = trpc.useUtils();
  const profileQuery = trpc.customer.me.useQuery(undefined, {
    enabled: sessionReady,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const ordersQuery = trpc.customer.orders.useQuery(undefined, {
    enabled: sessionReady && Boolean(profileQuery.data),
    retry: false,
    refetchOnWindowFocus: false,
  });
  const registerMutation = trpc.customer.register.useMutation();

  const clearCustomerData = useCallback(() => {
    sessionEpoch.current += 1;
    void utils.customer.me.cancel();
    void utils.customer.orders.cancel();
    void utils.public.currentCustomer.cancel();
    utils.customer.me.setData(undefined, null);
    utils.customer.orders.setData(undefined, []);
    utils.public.currentCustomer.setData(undefined, null);
  }, [utils]);

  const applySession = useCallback((session: { access_token?: string; user?: { id?: string } } | null) => {
    const nextIdentity = session?.user?.id ?? null;
    if (customerIdentity.current !== nextIdentity) {
      customerIdentity.current = nextIdentity;
      clearCustomerData();
    }
    setSessionReady(Boolean(session?.access_token));
  }, [clearCustomerData]);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    void getCustomerAuthClient().then(async client => {
      if (!active) return;
      setAuthClient(client);
      setAuthLoading(false);
      if (!client) return;

      try {
        const { data } = await client.auth.getSession();
        if (!active) return;
        applySession(data.session);
      } catch {
        if (!active) return;
        applySession(null);
      }

      const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
        if (active) applySession(session);
      });
      unsubscribe = () => subscription.subscription.unsubscribe();
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [applySession]);

  const submitCredentials = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setInfoMessage("");

    const normalizedUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(normalizedUsername)) {
      setErrorMessage("Use a username with 3–24 letters, numbers or underscores.");
      return;
    }
    const normalizedPhone = mode === "signup" ? normalizeKenyanMpesaPhone(phone) : null;
    if (mode === "signup" && !normalizedPhone) {
      setErrorMessage("Enter a valid Kenyan mobile number, such as 0718 114 009.");
      return;
    }
    if (mode === "signup" && password.length < 12) {
      setErrorMessage("Use a password with at least 12 characters.");
      return;
    }
    if (mode === "signup" && password !== confirmPassword) {
      setErrorMessage("The passwords do not match.");
      return;
    }
    if (!authClient) {
      setErrorMessage("Customer accounts are not available yet. You can still place a guest request.");
      return;
    }

    setBusy(true);
    const priorIdentity = customerIdentity.current;
    try {
      if (mode === "signup") {
        await registerMutation.mutateAsync({ username: normalizedUsername, phone: normalizedPhone!, password });
      }

      const { data, error } = await authClient.auth.signInWithPassword({
        email: customerAuthEmail(normalizedUsername),
        password,
      });
      if (error || !data.session?.access_token || !data.user?.id) {
        if (mode === "signup") {
          setMode("login");
          setInfoMessage("Your account was created. Sign in with your username and password.");
          setErrorMessage("");
        } else {
          setErrorMessage("That username or password is incorrect.");
        }
        return;
      }

      applySession(data.session);
      const expectedIdentity = data.user.id;
      const activeEpoch = sessionEpoch.current;
      await utils.customer.me.invalidate();
      if (customerIdentity.current !== expectedIdentity || sessionEpoch.current !== activeEpoch) return;
      const profile = await utils.customer.me.fetch(undefined, { staleTime: 0 });
      if (customerIdentity.current !== expectedIdentity || sessionEpoch.current !== activeEpoch) return;
      if (!profile || profile.username !== normalizedUsername) {
        applySession(null);
        await authClient.auth.signOut();
        setErrorMessage("We couldn't load this account. Please sign in again or continue as a guest.");
        return;
      }

      utils.customer.me.setData(undefined, profile);
      setPassword("");
      setConfirmPassword("");
      setInfoMessage(mode === "signup" ? "Your account is ready. Requests you make while signed in can appear in your history." : "You're signed in. Requests you make now can appear in your account history.");
    } catch (error) {
      if (customerIdentity.current !== priorIdentity && customerIdentity.current !== null) {
        applySession(null);
        await authClient.auth.signOut().catch(() => undefined);
      }
      if (error instanceof TRPCClientError && error.data?.code === "CONFLICT") {
        setErrorMessage(error.message);
      } else if (mode === "signup") {
        setErrorMessage("We couldn't create the account. Check the details or try again later.");
      } else {
        setErrorMessage("We couldn't sign you in. Check your details and try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    customerIdentity.current = null;
    setSessionReady(false);
    clearCustomerData();
    setPassword("");
    setConfirmPassword("");
    setErrorMessage("");
    setInfoMessage("You are signed out. Guest ordering is still available.");
    try { await authClient?.auth.signOut(); } catch { /* Private query caches were already cleared. */ }
    await utils.customer.me.invalidate();
    await utils.customer.orders.invalidate();
  };

  const profile = sessionReady ? profileQuery.data : null;
  const accountSetupError = sessionReady && profileQuery.isError;

  return (
    <PublicShell>
      <main id="main-content" className="min-h-[65vh] bg-[#f6f3ee] px-4 pb-24 pt-7 text-[#202a30] sm:px-6 sm:pb-12">
        <div className="mx-auto max-w-xl">
          <h1 className="mt-2 text-3xl font-black tracking-[-.04em]">Customer account</h1>
          <Link href="/spares" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#56636a] transition hover:text-[#a93823]">Continue as a guest <ArrowRight className="h-4 w-4" /></Link>
          <div className="mt-5">
            <section className="rounded-2xl border border-[#d9d2c8] bg-white p-5 shadow-lg shadow-[#202a30]/[.06] sm:p-7">
              {profile ? (
                <>
                  <div className="flex flex-col justify-between gap-4 border-b border-[#e6e0d8] pb-5 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#205c52]">Signed in</p>
                      <h2 className="mt-2 text-2xl font-black tracking-[-.04em]">Hello, @{profile.username}</h2>
                      <p className="mt-2 text-sm text-[#56636a]">Phone on file: +{profile.phone} <span className="text-[#7d8589]">(not verified by SMS)</span></p>
                    </div>
                    <button type="button" onClick={signOut} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#cfc5b8] px-4 py-2.5 text-sm font-bold text-[#46535a] transition hover:bg-[#f6f3ee]"><LogOut className="h-4 w-4" />Sign out</button>
                  </div>
                  <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#a93823]">Account history</p><h3 className="mt-2 text-xl font-black tracking-[-.03em]">Your item requests</h3></div>
                    <Link href="/spares" className="inline-flex items-center gap-2 text-sm font-extrabold text-[#a93823] hover:underline">Request a part <ArrowRight className="h-4 w-4" /></Link>
                  </div>
                  {ordersQuery.isLoading ? (
                    <div className="mt-6 flex items-center gap-2 text-sm text-[#56636a]" role="status"><Loader2 className="h-4 w-4 animate-spin" />Loading your requests…</div>
                  ) : ordersQuery.isError ? (
                    <p className="mt-5 rounded-xl border border-[#d9d2c8] bg-[#f6f3ee] p-4 text-sm leading-6 text-[#56636a]">Your request history is temporarily unavailable. Keep the order reference sent after checkout to track it.</p>
                  ) : ordersQuery.data?.length ? (
                    <div className="mt-5 grid gap-3">{ordersQuery.data.map(order => (
                      <article key={order.id} className="rounded-2xl border border-[#e4ddd3] bg-[#fffdfa] p-4 sm:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-sm font-black text-[#a93823]">{order.reference}</p><p className="mt-1 text-xs text-[#69747b]">Requested {formatDate(order.createdAt)}</p></div><span className="rounded-full bg-[#e4f3ed] px-3 py-1 text-xs font-extrabold text-[#205c52]">{formatStatus(order.status)}</span></div>
                        <ul className="mt-3 space-y-1 text-sm text-[#46535a]">{order.items.map((item, index) => <li key={`${order.id}-${index}`}>{item.quantity} × {item.productNameSnapshot}</li>)}</ul>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#eee8df] pt-3"><p className="text-sm font-extrabold text-[#202a30]">{formatPrice(order.total)}</p><Link href="/order-status" onClick={() => { try { window.sessionStorage.setItem("dph-order-status-reference", order.reference); } catch { /* Manual reference entry remains available. */ } }} className="inline-flex items-center gap-1 text-sm font-bold text-[#205c52] hover:underline">View request <ArrowRight className="h-4 w-4" /></Link></div>
                      </article>
                    ))}</div>
                  ) : (
                    <div className="mt-5 rounded-2xl border border-dashed border-[#cfc5b8] bg-[#f6f3ee] p-6"><p className="font-bold text-[#202a30]">No account-linked requests yet</p><p className="mt-2 text-sm leading-6 text-[#56636a]">Only requests you make while signed in are listed here. Earlier guest requests stay private and can still be checked with their reference.</p></div>
                  )}
                </>
              ) : accountSetupError ? (
                <div className="py-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff1e7] text-[#a93823]"><ShieldCheck className="h-6 w-6" /></span><h2 className="mt-5 text-2xl font-black tracking-[-.04em]">Account details unavailable</h2><p className="mt-3 text-sm leading-7 text-[#56636a]">We couldn't load this account right now. Sign out and continue as a guest; guest requests remain available.</p><button type="button" onClick={signOut} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#202a30] px-4 py-3 text-sm font-extrabold text-white"><LogOut className="h-4 w-4" />Sign out</button></div>
              ) : authLoading || (sessionReady && profileQuery.isLoading) ? (
                <div className="grid min-h-56 place-items-center gap-3 text-sm font-semibold text-[#56636a]" role="status"><Loader2 className="h-6 w-6 animate-spin text-[#d94b2b]" />Loading account…</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 rounded-xl border border-[#d9d2c8] bg-[#f6f3ee] p-1" role="group" aria-label="Account action">
                    <button type="button" disabled={busy} aria-pressed={mode === "signup"} onClick={() => { setMode("signup"); setErrorMessage(""); setInfoMessage(""); }} className={`rounded-lg px-3 py-2.5 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60 ${mode === "signup" ? "bg-white text-[#202a30] shadow-sm" : "text-[#56636a]"}`}>Create account</button>
                    <button type="button" disabled={busy} aria-pressed={mode === "login"} onClick={() => { setMode("login"); setErrorMessage(""); setInfoMessage(""); }} className={`rounded-lg px-3 py-2.5 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60 ${mode === "login" ? "bg-white text-[#202a30] shadow-sm" : "text-[#56636a]"}`}>Sign in</button>
                  </div>
                  {!authClient && !authLoading && <p className="mt-4 rounded-xl border border-[#d94b2b]/20 bg-[#fff1e7] p-3 text-sm leading-5 text-[#87331f]" role="status">Customer accounts are not enabled yet. You can still request items as a guest or call 0718 114 009.</p>}
                  <form className="mt-5 space-y-4" onSubmit={submitCredentials}>
                    <label className="block text-sm font-bold text-[#202a30]">Username<input autoComplete="username" maxLength={24} value={username} onChange={event => setUsername(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#cfc5b8] bg-white px-4 text-sm text-[#202a30] outline-none focus:border-[#b53d25] focus:ring-4 focus:ring-[#d94b2b]/10" placeholder="3–24 letters, numbers or _" required /></label>
                    {mode === "signup" && <label className="block text-sm font-bold text-[#202a30]">Kenyan mobile number<input autoComplete="tel" type="tel" value={phone} onChange={event => setPhone(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#cfc5b8] bg-white px-4 text-sm text-[#202a30] outline-none focus:border-[#b53d25] focus:ring-4 focus:ring-[#d94b2b]/10" placeholder="0718 114 009" required /></label>}
                    <label className="block text-sm font-bold text-[#202a30]">Password<input autoComplete={mode === "signup" ? "new-password" : "current-password"} type="password" minLength={mode === "signup" ? 12 : 1} maxLength={128} value={password} onChange={event => setPassword(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#cfc5b8] bg-white px-4 text-sm text-[#202a30] outline-none focus:border-[#b53d25] focus:ring-4 focus:ring-[#d94b2b]/10" placeholder={mode === "signup" ? "At least 12 characters" : "Enter your password"} required /></label>
                    {mode === "signup" && <label className="block text-sm font-bold text-[#202a30]">Confirm password<input autoComplete="new-password" type="password" minLength={12} maxLength={128} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#cfc5b8] bg-white px-4 text-sm text-[#202a30] outline-none focus:border-[#b53d25] focus:ring-4 focus:ring-[#d94b2b]/10" placeholder="Enter the password again" required /></label>}
                    {mode === "signup" && <p className="rounded-xl border border-[#d9d2c8] bg-[#f6f3ee] p-3 text-xs leading-5 text-[#56636a]">No SMS is sent. Your phone number is not verified and cannot be used to reset a forgotten password.</p>}
                    {errorMessage && <p className="rounded-xl border border-[#d94b2b]/25 bg-[#fff1e7] p-3 text-sm leading-6 text-[#87331f]" role="alert">{errorMessage}</p>}
                    {infoMessage && <p className="rounded-xl border border-[#28766b]/20 bg-[#e4f3ed] p-3 text-sm leading-6 text-[#205c52]" role="status">{infoMessage}</p>}
                    <button type="submit" disabled={busy || authLoading || !authClient} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#d94b2b] px-5 text-sm font-extrabold text-white transition hover:bg-[#b53d25] disabled:cursor-not-allowed disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signup" ? <UserRound className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}{busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}</button>
                  </form>
                </>
              )}
            </section>
          </div>
        </div>
      </main>
    </PublicShell>
  );
}
