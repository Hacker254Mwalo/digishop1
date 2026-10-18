import { ArrowRight, CheckCircle2, KeyRound, Loader2, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "wouter";
import PublicShell from "@/components/PublicShell";
import { getCustomerAuthClient, normalizeKenyanMpesaPhone } from "@/lib/customerAuth";
import { trpc } from "@/lib/trpc";

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
  const [stage, setStage] = useState<"credentials" | "code" | "username">("credentials");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [verifiedUsername, setVerifiedUsername] = useState("");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const customerIdentity = useRef<string | null>(null);
  const sessionEpoch = useRef(0);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);
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

  const applySession = useCallback((session: { access_token?: string; user?: { id?: string; phone?: string | null } } | null) => {
    const nextIdentity = session?.user?.id ?? null;
    if (customerIdentity.current !== nextIdentity) {
      customerIdentity.current = nextIdentity;
      clearCustomerData();
    }
    setSessionReady(Boolean(session?.access_token));
    if (session?.user?.phone) {
      const normalizedPhone = normalizeKenyanMpesaPhone(session.user.phone);
      setPhone(normalizedPhone ? `+${normalizedPhone}` : session.user.phone);
      setVerifiedPhone(normalizedPhone ?? "");
    } else if (!session) {
      setVerifiedPhone("");
      setVerifiedUsername("");
    }
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

  useEffect(() => {
    if (stage === "code") codeInputRef.current?.focus();
    if (stage === "username") usernameInputRef.current?.focus();
  }, [stage]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown(current => Math.max(0, current - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (sessionReady && profileQuery.isSuccess && profileQuery.data === null && stage === "credentials") {
      setStage("username");
      setInfoMessage("Your phone is verified. Choose a username to finish setting up this account.");
    }
  }, [sessionReady, profileQuery.isSuccess, profileQuery.data, stage]);

  const sendCode = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setInfoMessage("");
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedPhone = normalizeKenyanMpesaPhone(phone);
    if (!/^[a-z0-9_]{3,24}$/.test(normalizedUsername)) {
      setErrorMessage("Use a username with 3–24 letters, numbers or underscores.");
      return;
    }
    if (!normalizedPhone) {
      setErrorMessage("Enter a valid Kenyan mobile number, such as 0718 114 009.");
      return;
    }
    if (!authClient) {
      setErrorMessage("Phone verification is not configured on this site yet. You can still continue as a guest.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await authClient.auth.signInWithOtp({
        phone: `+${normalizedPhone}`,
        options: { shouldCreateUser: mode === "signup" },
      });
      if (error) {
        setErrorMessage("We couldn't request a code. Phone/SMS verification may not be enabled yet; please try again later or continue as a guest.");
        return;
      }

      setVerifiedPhone(normalizedPhone);
      setVerifiedUsername(normalizedUsername);
      setStage("code");
      setCooldown(45);
      setInfoMessage(`A verification code was requested for +${normalizedPhone}. After phone verification, we will match the username to your account.`);
    } catch {
      setErrorMessage("We couldn't request a code because the connection failed. Please try again or continue as a guest.");
    } finally {
      setBusy(false);
    }
  };

  const finishSignup = async () => {
    const normalizedUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(normalizedUsername)) {
      setErrorMessage("Use a username with 3–24 letters, numbers or underscores.");
      return;
    }
    const signupIdentity = customerIdentity.current;
    const signupEpoch = sessionEpoch.current;
    if (!signupIdentity) {
      setErrorMessage("Your verified session is no longer active. Sign in again or continue as a guest.");
      return;
    }
    setBusy(true);
    setErrorMessage("");
    try {
      const profile = await registerMutation.mutateAsync({ username: normalizedUsername });
      if (customerIdentity.current !== signupIdentity || sessionEpoch.current !== signupEpoch) return;
      utils.customer.me.setData(undefined, profile);
      setStage("credentials");
      setInfoMessage("Your account is ready. New requests made while signed in can appear in your account history.");
    } catch (error) {
      if (customerIdentity.current !== signupIdentity || sessionEpoch.current !== signupEpoch) return;
      if (error instanceof TRPCClientError && error.data?.code === "CONFLICT") {
        setStage("username");
        setErrorMessage("That username is already in use. Choose another username; your phone is already verified.");
      } else {
        setStage("username");
        setErrorMessage("We couldn't save your account yet. The shop's account database setup may still be pending; guest requests remain available.");
      }
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setInfoMessage("");
    const token = code.replace(/\D/g, "");
    if (!authClient || token.length < 4 || token.length > 8) {
      setErrorMessage("Enter the verification code from the SMS.");
      return;
    }

    setBusy(true);
    const verificationEpoch = sessionEpoch.current;
    let activeEpoch = verificationEpoch;
    let expectedIdentity: string | null = null;
    let phoneVerified = false;
    try {
      const { data, error } = await authClient.auth.verifyOtp({ phone: `+${verifiedPhone}`, token, type: "sms" });
      if (sessionEpoch.current !== verificationEpoch && (!data.user?.id || customerIdentity.current !== data.user.id)) return;
      if (error || !data.session?.access_token || !data.user?.phone_confirmed_at) {
        if (data.session?.access_token) {
          applySession(null);
          void authClient.auth.signOut().catch(() => undefined);
        }
        setErrorMessage("That code could not be verified. Check it and try again, or request a new code.");
        return;
      }

      phoneVerified = true;
      expectedIdentity = data.user.id;
      if (sessionEpoch.current !== verificationEpoch && customerIdentity.current !== expectedIdentity) return;
      applySession(data.session);
      activeEpoch = sessionEpoch.current;
      await utils.customer.me.invalidate();
      if (customerIdentity.current !== expectedIdentity || sessionEpoch.current !== activeEpoch) return;
      const profile = await utils.customer.me.fetch(undefined, { staleTime: 0 });
      if (customerIdentity.current !== expectedIdentity || sessionEpoch.current !== activeEpoch) return;
      if (profile) {
        const matches = profile.username === verifiedUsername && profile.phone === verifiedPhone;
        if (!matches) {
          applySession(null);
          void authClient.auth.signOut().catch(() => undefined);
          setStage("credentials");
          setErrorMessage("The username and phone number did not match. Check both details or create an account.");
          return;
        }
        utils.customer.me.setData(undefined, profile);
        setStage("credentials");
        setInfoMessage("You're signed in. New requests can be saved to your account history.");
      } else if (mode === "signup") {
        setStage("username");
        await finishSignup();
      } else {
        applySession(null);
        void authClient.auth.signOut().catch(() => undefined);
        setStage("credentials");
        setErrorMessage("No customer account was found for those details. Create an account or continue as a guest.");
      }
    } catch {
      if (expectedIdentity
        ? customerIdentity.current !== expectedIdentity || sessionEpoch.current !== activeEpoch
        : sessionEpoch.current !== verificationEpoch) return;
      setStage(mode === "signup" ? "username" : "credentials");
      setErrorMessage(phoneVerified && mode === "signup"
        ? "Your phone was verified, but account storage is not ready yet. You can retry later or continue as a guest."
        : phoneVerified
          ? "We couldn't load your account right now. Please try again or continue as a guest."
          : "We couldn't verify the code because the connection failed. Please retry or request a new code.");
    } finally {
      setBusy(false);
    }
  };

  const resendCode = async () => {
    if (!authClient || !verifiedPhone || cooldown > 0 || busy) return;
    setBusy(true);
    setErrorMessage("");
    try {
      const { error } = await authClient.auth.signInWithOtp({
        phone: `+${verifiedPhone}`,
        options: { shouldCreateUser: mode === "signup" },
      });
      if (error) {
        setErrorMessage("We couldn't request another code. Please wait and try again later.");
        return;
      }
      setCooldown(45);
      setInfoMessage("A new verification code was requested.");
    } catch {
      setErrorMessage("We couldn't request another code because the connection failed.");
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    customerIdentity.current = null;
    setSessionReady(false);
    clearCustomerData();
    setStage("credentials");
    setCode("");
    setPhone("");
    setVerifiedPhone("");
    setVerifiedUsername("");
    setErrorMessage("");
    setInfoMessage("You are signed out. Guest ordering is still available.");
    try { await authClient?.auth.signOut(); } catch { /* The local view and query caches are already cleared. */ }
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
                    <div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#205c52]">Signed in</p><h2 className="mt-2 text-2xl font-black tracking-[-.04em]">Hello, @{profile.username}</h2><p className="mt-2 text-sm text-[#56636a]">Verified phone: +{profile.phone}</p></div>
                    <button type="button" onClick={signOut} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#cfc5b8] px-4 py-2.5 text-sm font-bold text-[#46535a] transition hover:bg-[#f6f3ee]"><LogOut className="h-4 w-4" />Sign out</button>
                  </div>
                  <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#a93823]">Account history</p><h3 className="mt-2 text-xl font-black tracking-[-.03em]">Your item requests</h3></div><Link href="/spares" className="inline-flex items-center gap-2 text-sm font-extrabold text-[#a93823] hover:underline">Request a part <ArrowRight className="h-4 w-4" /></Link></div>
                  {ordersQuery.isLoading ? <div className="mt-6 flex items-center gap-2 text-sm text-[#56636a]" role="status"><Loader2 className="h-4 w-4 animate-spin" />Loading your requests…</div> : ordersQuery.isError ? <p className="mt-5 rounded-xl border border-[#d9d2c8] bg-[#f6f3ee] p-4 text-sm leading-6 text-[#56636a]">Your account is signed in, but request history is temporarily unavailable. Your guest reference remains the backup way to track an order.</p> : ordersQuery.data?.length ? <div className="mt-5 grid gap-3">{ordersQuery.data.map(order => <article key={order.id} className="rounded-2xl border border-[#e4ddd3] bg-[#fffdfa] p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-sm font-black text-[#a93823]">{order.reference}</p><p className="mt-1 text-xs text-[#69747b]">Requested {formatDate(order.createdAt)}</p></div><span className="rounded-full bg-[#e4f3ed] px-3 py-1 text-xs font-extrabold text-[#205c52]">{formatStatus(order.status)}</span></div><ul className="mt-3 space-y-1 text-sm text-[#46535a]">{order.items.map((item, index) => <li key={`${order.id}-${index}`}>{item.quantity} × {item.productNameSnapshot}</li>)}</ul><div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#eee8df] pt-3"><p className="text-sm font-extrabold text-[#202a30]">{formatPrice(order.total)}</p><Link href="/order-status" onClick={() => { try { window.sessionStorage.setItem("dph-order-status-reference", order.reference); } catch { /* Manual reference entry remains available. */ } }} className="inline-flex items-center gap-1 text-sm font-bold text-[#205c52] hover:underline">View request <ArrowRight className="h-4 w-4" /></Link></div></article>)}</div> : <div className="mt-5 rounded-2xl border border-dashed border-[#cfc5b8] bg-[#f6f3ee] p-6"><p className="font-bold text-[#202a30]">No account-linked requests yet</p><p className="mt-2 text-sm leading-6 text-[#56636a]">Only new requests submitted while signed in with this verified phone appear here. Earlier guest requests stay private and can still be checked with their reference.</p></div>}
                </>
              ) : accountSetupError ? (
                <div className="py-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff1e7] text-[#a93823]"><ShieldCheck className="h-6 w-6" /></span><h2 className="mt-5 text-2xl font-black tracking-[-.04em]">Account setup is not ready</h2><p className="mt-3 text-sm leading-7 text-[#56636a]">Your phone session could not load an account profile. The account database migration may still need to be applied. Sign out to keep using guest ordering; no guest request is blocked.</p><button type="button" onClick={signOut} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#202a30] px-4 py-3 text-sm font-extrabold text-white"><LogOut className="h-4 w-4" />Sign out and continue as guest</button></div>
              ) : authLoading || (sessionReady && profileQuery.isLoading) ? (
                <div className="grid min-h-56 place-items-center gap-3 text-sm font-semibold text-[#56636a]" role="status"><Loader2 className="h-6 w-6 animate-spin text-[#d94b2b]" />Loading account…</div>
              ) : stage === "code" ? (
                <>
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e4f3ed] text-[#205c52]"><KeyRound className="h-6 w-6" /></span>
                  <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#205c52]">Phone verification</p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-.04em]">Enter your SMS code</h2>
                  <p className="mt-2 text-sm leading-6 text-[#56636a]">We requested a one-time code for <strong>@{verifiedUsername}</strong> at <strong>+{verifiedPhone}</strong>. After phone verification, we match the username to the account. Never share this code with anyone.</p>
                  <form className="mt-6 space-y-4" onSubmit={verifyCode}>
                    <label className="block text-sm font-bold text-[#202a30]">Verification code<input ref={codeInputRef} autoComplete="one-time-code" inputMode="numeric" maxLength={8} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, 8))} className="mt-2 h-12 w-full rounded-xl border border-[#cfc5b8] bg-white px-4 text-lg font-bold tracking-[.25em] text-[#202a30] outline-none focus:border-[#b53d25] focus:ring-4 focus:ring-[#d94b2b]/10" placeholder="Enter code" required /></label>
                    {errorMessage && <p className="rounded-xl border border-[#d94b2b]/25 bg-[#fff1e7] p-3 text-sm leading-6 text-[#87331f]" role="alert">{errorMessage}</p>}
                    {infoMessage && <p className="rounded-xl border border-[#28766b]/20 bg-[#e4f3ed] p-3 text-sm leading-6 text-[#205c52]" role="status">{infoMessage}</p>}
                    <button type="submit" disabled={busy} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#d94b2b] px-5 text-sm font-extrabold text-white transition hover:bg-[#b53d25] disabled:cursor-not-allowed disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}{busy ? "Verifying…" : "Verify and continue"}</button>
                  </form>
                  <div className="mt-4 flex items-center justify-between gap-3 text-sm"><button type="button" disabled={busy || cooldown > 0} onClick={resendCode} className="font-bold text-[#a93823] disabled:cursor-not-allowed disabled:text-[#8c9498]">{cooldown > 0 ? `Request another code in ${cooldown}s` : "Resend code"}</button><button type="button" disabled={busy} onClick={() => { setStage("credentials"); setCode(""); setVerifiedPhone(""); setVerifiedUsername(""); setErrorMessage(""); setInfoMessage(""); }} className="font-bold text-[#56636a] hover:underline disabled:cursor-not-allowed disabled:opacity-60">Change details</button></div>
                </>
              ) : stage === "username" ? (
                <>
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e4f3ed] text-[#205c52]"><UserRound className="h-6 w-6" /></span>
                  <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#205c52]">Finish account setup</p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-.04em]">Choose your username</h2>
                  <p className="mt-2 text-sm leading-6 text-[#56636a]">Your verified phone is +{verifiedPhone || phone}. Use 3–24 letters, numbers or underscores. This username is used when you sign in.</p>
                  <form className="mt-6 space-y-4" onSubmit={event => { event.preventDefault(); void finishSignup(); }}>
                    <label className="block text-sm font-bold text-[#202a30]">Username<input ref={usernameInputRef} autoComplete="username" maxLength={24} value={username} onChange={event => setUsername(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#cfc5b8] bg-white px-4 text-sm text-[#202a30] outline-none focus:border-[#b53d25] focus:ring-4 focus:ring-[#d94b2b]/10" placeholder="e.g. siaya_user" required /></label>
                    {errorMessage && <p className="rounded-xl border border-[#d94b2b]/25 bg-[#fff1e7] p-3 text-sm leading-6 text-[#87331f]" role="alert">{errorMessage}</p>}
                    {infoMessage && <p className="rounded-xl border border-[#28766b]/20 bg-[#e4f3ed] p-3 text-sm leading-6 text-[#205c52]" role="status">{infoMessage}</p>}
                    <button type="submit" disabled={busy || !sessionReady} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#d94b2b] px-5 text-sm font-extrabold text-white transition hover:bg-[#b53d25] disabled:cursor-not-allowed disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserRound className="h-4 w-4" />}{busy ? "Saving…" : "Save username"}</button>
                  </form>
                  <button type="button" onClick={signOut} className="mt-4 text-sm font-bold text-[#56636a] underline-offset-4 hover:underline">Sign out and continue as a guest</button>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 rounded-xl border border-[#d9d2c8] bg-[#f6f3ee] p-1" role="group" aria-label="Account action"><button type="button" disabled={busy} aria-pressed={mode === "signup"} onClick={() => { setMode("signup"); setErrorMessage(""); setInfoMessage(""); }} className={`rounded-lg px-3 py-2.5 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60 ${mode === "signup" ? "bg-white text-[#202a30] shadow-sm" : "text-[#56636a]"}`}>Create account</button><button type="button" disabled={busy} aria-pressed={mode === "login"} onClick={() => { setMode("login"); setErrorMessage(""); setInfoMessage(""); }} className={`rounded-lg px-3 py-2.5 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60 ${mode === "login" ? "bg-white text-[#202a30] shadow-sm" : "text-[#56636a]"}`}>Sign in</button></div>
                  {!authClient && <p className="mt-4 rounded-xl border border-[#d94b2b]/20 bg-[#fff1e7] p-3 text-sm leading-5 text-[#87331f]" role="status">SMS sign-in is not enabled yet. Continue as a guest or call 0718 114 009.</p>}
                  <form className="mt-5 space-y-4" onSubmit={sendCode}>
                    <label className="block text-sm font-bold text-[#202a30]">Username<input autoComplete="username" maxLength={24} value={username} onChange={event => setUsername(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#cfc5b8] bg-white px-4 text-sm text-[#202a30] outline-none focus:border-[#b53d25] focus:ring-4 focus:ring-[#d94b2b]/10" placeholder="3–24 letters, numbers or _" required /></label>
                    <label className="block text-sm font-bold text-[#202a30]">Phone number<input autoComplete="tel" type="tel" value={phone} onChange={event => setPhone(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#cfc5b8] bg-white px-4 text-sm text-[#202a30] outline-none focus:border-[#b53d25] focus:ring-4 focus:ring-[#d94b2b]/10" placeholder="0718 114 009" required /></label>
                    {errorMessage && <p className="rounded-xl border border-[#d94b2b]/25 bg-[#fff1e7] p-3 text-sm leading-6 text-[#87331f]" role="alert">{errorMessage}</p>}
                    {infoMessage && <p className="rounded-xl border border-[#28766b]/20 bg-[#e4f3ed] p-3 text-sm leading-6 text-[#205c52]" role="status">{infoMessage}</p>}
                    <button type="submit" disabled={busy || cooldown > 0 || authLoading || !authClient} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#d94b2b] px-5 text-sm font-extrabold text-white transition hover:bg-[#b53d25] disabled:cursor-not-allowed disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}{busy ? "Requesting code…" : cooldown > 0 ? `Wait ${cooldown}s before requesting a code` : "Send verification code"}</button>
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
