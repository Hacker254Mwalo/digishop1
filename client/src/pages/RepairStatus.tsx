import { ArrowRight, CheckCircle2, ClipboardCheck, Loader2, Search, ShieldCheck, Wrench } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "wouter";
import PublicShell from "@/components/PublicShell";
import { trpc } from "@/lib/trpc";

function formatDate(value: Date | string | null | undefined) {
  return value ? new Date(value).toLocaleString("en-KE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
}

function statusLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

export default function RepairStatus() {
  const initialReference = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("reference") ?? "";
  const [reference, setReference] = useState(initialReference);
  const [submittedReference, setSubmittedReference] = useState(initialReference.trim().toUpperCase());
  const status = trpc.public.getRepairStatus.useQuery({ reference: submittedReference }, { enabled: submittedReference.length >= 6, retry: false });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmittedReference(reference.trim().toUpperCase());
  };

  return (
    <PublicShell>
      <main id="main-content" className="bg-[#f6f3ee] pb-24 text-[#202a30] sm:pb-0">
        <section className="border-b border-[#d9d2c8] bg-white px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="mx-auto max-w-7xl"><p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-[#a93823]">Digital Phone Hub · Repair tracking</p><div className="mt-4 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"><div><h1 className="max-w-3xl text-4xl font-black leading-[1.02] tracking-[-.06em] text-[#202a30] sm:text-5xl">See the current stage of your repair.</h1><p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#56636a]">Enter the reference from your repair request. For your privacy, tracking shows the repair stage only.</p></div><Link href="/repair" className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#d94b2b] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#b53d25]">Start a repair request <ArrowRight className="h-4 w-4" /></Link></div></div>
        </section>
        <section className="px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
            <form onSubmit={submit} className="rounded-2xl border border-[#d9d2c8] bg-white p-5 shadow-sm sm:p-7">
              <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#a93823]">Track your repair</p><h2 className="mt-3 text-2xl font-black text-[#202a30]">Enter the repair reference.</h2><p className="mt-2 text-sm leading-6 text-[#56636a]">It begins with <span className="font-mono font-bold text-[#a93823]">DPH-REP-</span>. The full code is case-insensitive.</p>
              <label className="mt-6 block text-sm font-bold text-[#39464d]" htmlFor="repair-reference">Repair reference<input id="repair-reference" autoComplete="off" required minLength={6} maxLength={32} value={reference} onChange={event => setReference(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#cfc5b8] bg-[#fffdfa] px-3 font-mono text-sm text-[#202a30] outline-none transition focus:border-[#b53d25] focus:ring-4 focus:ring-[#d94b2b]/10" placeholder="DPH-REP-…" /></label>
              <button type="submit" disabled={status.isFetching || reference.trim().length < 6} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#d94b2b] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#b53d25] disabled:cursor-not-allowed disabled:opacity-60">{status.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Check status</button>
              <p className="mt-4 text-xs leading-5 text-[#69747b]">Lost the reference? Call 0718 114 009 and the service desk can help.</p>
            </form>
            <section className="min-h-64 rounded-2xl border border-[#d9d2c8] bg-white p-5 sm:p-7" aria-live="polite" aria-atomic="true">
              {!submittedReference ? <div><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#fff1e7] text-[#a93823]"><Wrench className="h-5 w-5" /></span><h2 className="mt-5 text-xl font-extrabold text-[#202a30]">Your update will appear here.</h2><p className="mt-2 max-w-md text-sm leading-6 text-[#56636a]">Use the reference from your confirmation to see the status last recorded by the repair desk.</p></div>
                : status.isLoading ? <div className="flex items-center gap-3 text-sm font-medium text-[#46535a]"><Loader2 className="h-5 w-5 animate-spin text-[#a93823]" />Checking the repair record…</div>
                  : status.error ? <div><p className="font-extrabold text-[#a93823]">We could not verify that reference.</p><p className="mt-2 text-sm leading-6 text-[#56636a]">Check the code and try again, or call 0718 114 009. The same message is shown whether a request is missing or has an invalid reference.</p></div>
                    : !status.data ? <div><p className="font-extrabold text-[#a93823]">We could not verify that reference.</p><p className="mt-2 text-sm leading-6 text-[#56636a]">Check the code and try again, or call 0718 114 009.</p></div>
                      : <div><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e4f3ed] text-[#205c52]"><CheckCircle2 className="h-6 w-6" /></span><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#205c52]">Repair record found</p><p className="mt-1 font-mono text-sm font-bold text-[#202a30]">{status.data.reference}</p></div></div><div className="mt-7 rounded-xl border border-[#d9d2c8] bg-[#f6f3ee] p-5"><div className="flex items-center gap-2 text-[#a93823]"><ClipboardCheck className="h-4 w-4" /><p className="text-[10px] font-extrabold uppercase tracking-[.16em]">Current stage</p></div><p className="mt-2 text-2xl font-black text-[#202a30]">{statusLabel(status.data.status)}</p><p className="mt-3 text-xs text-[#69747b]">Last recorded: {formatDate(status.data.updatedAt)}</p></div><div className="mt-5 rounded-xl border border-[#d9d2c8] p-4"><p className="text-sm font-extrabold text-[#202a30]">Need to discuss the next step?</p><p className="mt-1 text-sm leading-6 text-[#56636a]">Call the service desk and quote the reference above.</p><a href={`https://wa.me/254718114009?text=${encodeURIComponent(`Hello Digital Phone Hub, I am following up on repair ${status.data.reference}.`)}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-extrabold text-[#205c52]"><ShieldCheck className="h-4 w-4" />Send a WhatsApp message <ArrowRight className="h-4 w-4" /></a></div></div>}
            </section>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
