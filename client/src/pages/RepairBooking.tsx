import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, MapPin, Phone, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "wouter";
import PublicShell from "@/components/PublicShell";
import { trpc } from "@/lib/trpc";
import RepairHelper from "@/components/RepairHelper";
import { getOrCreateSubmissionId, readSavedReference, saveReference, startNewSubmission } from "@/lib/requestTokens";

type DeviceType = "phone" | "laptop" | "electronics";
const submissionStorageKey = "dph-repair-submission-id";
const resultStorageKey = "dph-repair-result-reference";

export default function RepairBooking() {
  const [deviceType, setDeviceType] = useState<DeviceType>(() => {
    const device = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("device") : null;
    return device === "laptop" || device === "electronics" ? device : "phone";
  });
  const [form, setForm] = useState(() => {
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    return { name: "", phone: "", email: "", location: "", brand: "", model: "", issue: params?.get("issue") ?? "", priority: "normal" as "normal" | "high" | "urgent" | "low" };
  });
  const [submitted, setSubmitted] = useState<{ reference: string } | null>(() => {
    const reference = typeof window !== "undefined" ? readSavedReference(resultStorageKey) : null;
    return reference ? { reference } : null;
  });
  const [submissionId, setSubmissionId] = useState(() => typeof window !== "undefined" ? getOrCreateSubmissionId(submissionStorageKey) : "");
  const mutation = trpc.public.createRepairRequest.useMutation({ onSuccess: result => { saveReference(resultStorageKey, result.reference); setSubmitted({ reference: result.reference }); } });
  const update = (key: string, value: string) => setForm(current => ({ ...current, [key]: value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    mutation.mutate({ submissionId: submissionId || undefined, customer: { name: form.name.trim(), phone: form.phone.trim(), email: form.email || undefined, location: form.location || undefined }, device: { type: deviceType, brand: form.brand.trim(), model: form.model.trim() }, issue: form.issue.trim(), priority: form.priority });
  };

  const startAnotherRequest = () => {
    setSubmissionId(startNewSubmission(submissionStorageKey, resultStorageKey));
    setSubmitted(null);
    setDeviceType("phone");
    setForm({ name: "", phone: "", email: "", location: "", brand: "", model: "", issue: "", priority: "normal" });
    mutation.reset();
  };

  if (submitted) {
    const trackingUrl = "/repair-status";
    const whatsappUrl = `https://wa.me/254718114009?text=${encodeURIComponent(`Hello Digital Phone Hub, I have submitted a repair request. Please confirm the next step; I can provide my reference.`)}`;
    return (
      <PublicShell>
        <main id="main-content" className="grid min-h-[70vh] place-items-center bg-[#f6f3ee] px-4 pb-24 pt-12 sm:pb-12">
          <section className="w-full max-w-2xl rounded-[1.75rem] border border-[#d9d2c8] bg-white p-6 text-center shadow-xl shadow-[#202a30]/[.08] sm:p-10" role="status" aria-live="polite">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e4f3ed] text-[#205c52]"><CheckCircle2 className="h-7 w-7" /></span>
            <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#205c52]">Saved to the repair desk</p>
            <h1 className="mt-3 text-3xl font-black tracking-[-.04em] text-[#202a30] sm:text-4xl">Your request is recorded.</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#56636a]">The service desk can use the details you provided to confirm the next step. No repair work starts before you approve the repair plan and price.</p>
            <div className="mx-auto mt-6 max-w-md rounded-xl border border-[#d9d2c8] bg-[#f6f3ee] p-5"><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#69747b]">Your repair reference</p><p className="mt-2 break-all font-mono text-xl font-black text-[#a93823]">{submitted.reference}</p><p className="mt-2 text-xs leading-5 text-[#69747b]">Keep this code. It opens a status-only tracking page; do not share it publicly.</p></div>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Link href={trackingUrl} onClick={() => { try { window.sessionStorage.setItem("dph-repair-status-reference", submitted.reference); } catch { /* The customer can enter the reference manually. */ } }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d94b2b] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#b53d25]">Track this repair <ArrowRight className="h-4 w-4" /></Link><a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#cfc5b8] px-5 py-3 text-sm font-extrabold text-[#202a30]"><Phone className="h-4 w-4 text-[#205c52]" />Message the desk</a></div>
            <div className="mt-6 flex flex-col items-center gap-3"><button type="button" onClick={startAnotherRequest} className="text-sm font-bold text-[#a93823] underline-offset-4 hover:underline">Start another repair request</button><Link href="/" className="text-sm font-bold text-[#56636a] hover:text-[#a93823]">Back to Digital Phone Hub</Link></div>
          </section>
        </main>
      </PublicShell>
    );
  }

  const fields: Array<[keyof typeof form, string, string, boolean]> = [["name", "Your name", "Full name", true], ["phone", "Phone number", "0718 114 009", true], ["email", "Email (optional)", "you@example.com", false], ["location", "Location (optional)", "Town or estate", false], ["brand", "Brand", "Apple, Samsung, HP…", true], ["model", "Model", "iPhone 11, A14, EliteBook…", true]];

  return (
    <PublicShell>
      <main id="main-content" className="bg-[#f6f3ee] pb-24 text-[#202a30] sm:pb-0">
        <section className="border-b border-[#d9d2c8] bg-white px-4 py-8 sm:px-6 lg:px-8 lg:py-12"><div className="mx-auto max-w-7xl"><Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#56636a] hover:text-[#a93823]"><ArrowLeft className="h-4 w-4" />Back to service hub</Link><div className="mt-7 grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div><p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-[#a93823]">Repair intake · Siaya Town</p><h1 className="mt-3 max-w-xl text-4xl font-black leading-[1.02] tracking-[-.06em] sm:text-5xl">Tell us what changed.</h1><p className="mt-4 max-w-xl text-[15px] leading-7 text-[#56636a]">Share the device and symptoms. The desk checks the request and explains the next step; you do not need to diagnose the problem yourself.</p><div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-[#46535a]"><span className="inline-flex items-center gap-2 rounded-full border border-[#d9d2c8] bg-[#f6f3ee] px-3 py-2"><ShieldCheck className="h-3.5 w-3.5 text-[#205c52]" />Approve before repair</span><span className="inline-flex items-center gap-2 rounded-full border border-[#d9d2c8] bg-[#f6f3ee] px-3 py-2"><MapPin className="h-3.5 w-3.5 text-[#a93823]" />Siaya Town</span></div></div><figure className="relative overflow-hidden rounded-2xl bg-[#202a30]"><img src="/brand/dph-repair-bench-portrait.webp" alt="Digital Phone Hub repair bench" width="720" height="960" className="h-56 w-full object-cover object-[center_35%] sm:h-64" /><figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#202a30]/90 to-transparent p-5 text-sm font-extrabold text-white">A clear plan before work begins.</figcaption></figure></div></div></section>
        <section className="px-4 py-9 sm:px-6 lg:px-8 lg:py-12"><div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.15fr_.85fr] lg:items-start">
          <form onSubmit={submit} className="rounded-2xl border border-[#d9d2c8] bg-white p-5 shadow-sm sm:p-8"><div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#a93823]">01 / Tell us about the device</p><h2 className="mt-2 text-2xl font-black text-[#202a30]">What can we help with?</h2></div>
            <fieldset className="mt-6"><legend className="text-sm font-extrabold text-[#39464d]">Device type</legend><div className="mt-2 grid grid-cols-3 gap-2 rounded-xl bg-[#f6f3ee] p-1">{(["phone", "laptop", "electronics"] as DeviceType[]).map((type, index) => <button key={type} type="button" aria-pressed={deviceType === type} onClick={() => setDeviceType(type)} className={`rounded-lg px-2 py-3 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b53d25] ${deviceType === type ? "bg-[#202a30] text-white shadow-sm" : "text-[#56636a] hover:bg-white"}`}>{["Phone", "Laptop", "Electronics"][index]}</button>)}</div></fieldset>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">{fields.map(([key, label, placeholder, required]) => <label key={key} className="text-sm font-bold text-[#39464d]">{label}<input required={required} type={key === "email" ? "email" : key === "phone" ? "tel" : "text"} inputMode={key === "phone" ? "tel" : undefined} autoComplete={key === "name" ? "name" : key === "phone" ? "tel" : key === "email" ? "email" : undefined} value={form[key] as string} onChange={event => update(key, event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#cfc5b8] bg-[#fffdfa] px-3 text-sm text-[#202a30] outline-none transition focus:border-[#b53d25] focus:ring-4 focus:ring-[#d94b2b]/10" placeholder={placeholder} /></label>)}
              <label className="text-sm font-bold text-[#39464d] sm:col-span-2">How urgent is it?<select value={form.priority} onChange={event => update("priority", event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#cfc5b8] bg-[#fffdfa] px-3 text-sm text-[#202a30] outline-none focus:border-[#b53d25] focus:ring-4 focus:ring-[#d94b2b]/10"><option value="normal">Normal — no urgent deadline</option><option value="high">High — an early response would help</option><option value="urgent">Urgent — I need help as soon as possible</option><option value="low">Low — planning ahead</option></select></label>
              <label className="text-sm font-bold text-[#39464d] sm:col-span-2">Describe the issue<textarea required minLength={5} maxLength={4000} value={form.issue} onChange={event => update("issue", event.target.value)} className="mt-2 min-h-32 w-full rounded-xl border border-[#cfc5b8] bg-[#fffdfa] p-3 text-sm leading-6 text-[#202a30] outline-none focus:border-[#b53d25] focus:ring-4 focus:ring-[#d94b2b]/10" placeholder="What happened, what changed, and what have you already tried?" /></label>
            </div>
            <RepairHelper deviceType={deviceType} brand={form.brand} model={form.model} issue={form.issue} onApply={(summary, priority) => setForm(current => ({ ...current, issue: `${current.issue.trim()}\n\nIntake summary: ${summary}`, priority }))} />
            {mutation.error && <p role="alert" className="mt-5 rounded-xl border border-[#d94b2b]/20 bg-[#fff1e7] p-3 text-sm leading-6 text-[#8d311e]">We could not save this request. Your information was not confirmed as received; please try again or call 0718 114 009.</p>}
            <div className="mt-6 flex flex-col gap-3 border-t border-[#d9d2c8] pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-sm text-xs leading-5 text-[#69747b]">Contact details are used to manage this repair request. Sending this form does not approve a repair.</p><button type="submit" disabled={mutation.isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d94b2b] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#b53d25] disabled:cursor-not-allowed disabled:opacity-60">{mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}{mutation.isPending ? "Saving request…" : "Send repair request"}</button></div>
          </form>
          <aside className="space-y-4 lg:sticky lg:top-24"><section className="rounded-2xl bg-[#202a30] p-6 text-white"><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#f6c36a]">What happens next</p><ol className="mt-5 space-y-5">{[{ title: "Request recorded", copy: "A reference appears on screen after the request is saved." }, { title: "Desk reviews the details", copy: "The team checks the model and symptoms you provided." }, { title: "You decide", copy: "The repair plan and cost are discussed before any work begins." }].map((step, index) => <li key={step.title} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-extrabold text-[#f6c36a]">0{index + 1}</span><div><p className="text-sm font-extrabold">{step.title}</p><p className="mt-1 text-xs leading-5 text-[#d0d8da]">{step.copy}</p></div></li>)}</ol></section><section className="rounded-2xl border border-[#d9d2c8] bg-white p-6"><div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-[#a93823]" /><h2 className="font-extrabold text-[#202a30]">Siaya service desk</h2></div><p className="mt-3 text-sm leading-6 text-[#56636a]">For in-person service, bring the device to the Siaya shop after the team confirms the next step.</p><a className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-[#a93823]" href="tel:+254718114009">Call 0718 114 009 <ArrowRight className="h-4 w-4" /></a></section></aside>
        </div></section>
      </main>
    </PublicShell>
  );
}
