import { ArrowRight, BatteryCharging, CheckCircle2, Clock3, MapPin, MessageCircle, Phone, ShieldCheck, Smartphone, Wrench } from "lucide-react";
import { Link } from "wouter";
import PublicShell from "@/components/PublicShell";

const repairProblems = [
  { icon: Smartphone, title: "Screen damage", copy: "Cracked glass, an unresponsive display or a screen that no longer shows a clear picture." },
  { icon: BatteryCharging, title: "Battery & charging", copy: "Fast drain, unexpected shutdowns, a loose port or a phone that will not charge." },
  { icon: Wrench, title: "Audio & software", copy: "Microphone, speaker, setup or software problems that need a closer check." },
];

const steps = [
  { number: "01", title: "Tell us the model and fault", copy: "Share the phone brand, model and what changed. You do not need to diagnose it yourself." },
  { number: "02", title: "The desk checks the next step", copy: "We review the fault and explain the options. Timing and parts depend on the device and availability." },
  { number: "03", title: "Approve before repair", copy: "You decide after the repair plan and cost have been confirmed. No work starts without your approval." },
];

const faqs = [
  { question: "Where can I get phone repair in Siaya?", answer: "Digital Phone Hub provides phone repair support from its service desk in Siaya Town. Start online or call 0718 114 009 so the team can confirm the next step before work begins." },
  { question: "Can you help me find the right screen?", answer: "Share the exact phone brand and model. The team can help check compatibility and confirm the available option before you decide." },
  { question: "How long does a repair take?", answer: "Timing depends on the fault and part availability. The desk explains the expected next step after an initial check rather than promising a time before diagnosis." },
];

export default function PhoneRepairSiaya() {
  return (
    <PublicShell>
      <main id="main-content" className="bg-[#f6f3ee] pb-24 text-[#202a30] sm:pb-0">
        <section className="border-b border-[#d9d2c8] px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
            <div className="max-w-2xl">
              <p className="flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[.22em] text-[#a93823]"><span className="h-px w-8 bg-[#d94b2b]" />Phone repair · Siaya Town</p>
              <h1 className="mt-5 text-balance text-4xl font-black leading-[1.01] tracking-[-.06em] text-[#202a30] sm:text-6xl">A phone repair starts with the right check.</h1>
              <p className="mt-5 max-w-xl text-[15px] leading-7 text-[#56636a] sm:text-base">Bring a cracked screen, weak battery, charging fault or software problem to a local service desk that explains the next step clearly.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/repair" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d94b2b] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#b53d25] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#b53d25]">Start a repair request <ArrowRight className="h-4 w-4" /></Link>
                <a href="tel:+254718114009" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#cfc5b8] bg-white px-5 py-3 text-sm font-extrabold text-[#202a30] transition hover:border-[#d94b2b]/50"><Phone className="h-4 w-4 text-[#b53d25]" />0718 114 009</a>
              </div>
              <div className="mt-7 flex flex-wrap gap-2 text-xs font-bold text-[#46535a]"><span className="inline-flex items-center gap-2 rounded-full border border-[#d9d2c8] bg-white px-3 py-2"><MapPin className="h-3.5 w-3.5 text-[#b53d25]" />Siaya Town service desk</span><span className="inline-flex items-center gap-2 rounded-full border border-[#d9d2c8] bg-white px-3 py-2"><Clock3 className="h-3.5 w-3.5 text-[#28766b]" />Mon–Sat · 8:00–18:00</span></div>
            </div>
            <figure className="relative overflow-hidden rounded-[1.75rem] bg-[#202a30] shadow-xl shadow-[#202a30]/15">
              <img src="/brand/dph-repair-bench-portrait.webp" alt="Digital Phone Hub repair bench in Siaya" width="720" height="960" className="h-[23rem] w-full object-cover object-[center_35%] sm:h-[30rem]" fetchPriority="high" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#202a30]/90 to-transparent p-5 sm:p-7"><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#f6c36a]">Digital Phone Hub</p><figcaption className="mt-2 max-w-sm text-xl font-extrabold leading-tight text-white">Clear advice before you commit to a repair.</figcaption></div>
            </figure>
          </div>
        </section>

        <section className="border-b border-[#d9d2c8] bg-white px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-[#a93823]">What we help you check</p><h2 className="mt-3 text-3xl font-black tracking-[-.05em] text-[#202a30] sm:text-4xl">Practical phone support, one clear step at a time.</h2></div>
            <div className="mt-7 grid gap-4 md:grid-cols-3">{repairProblems.map(problem => <article key={problem.title} className="rounded-2xl border border-[#d9d2c8] bg-[#f6f3ee] p-5 sm:p-6"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-[#b53d25]"><problem.icon className="h-5 w-5" /></span><h3 className="mt-5 text-lg font-extrabold text-[#202a30]">{problem.title}</h3><p className="mt-2 text-sm leading-6 text-[#56636a]">{problem.copy}</p></article>)}</div>
          </div>
        </section>

        <section className="border-b border-[#d9d2c8] bg-[#202a30] px-4 py-12 text-white sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#f6c36a]">A straightforward repair journey</p><h2 className="mt-3 text-3xl font-black tracking-[-.05em] sm:text-4xl">No guesswork. A decision that stays yours.</h2><p className="mt-4 max-w-lg text-sm leading-7 text-[#e0e5e6]">We inspect first, explain the available options and confirm the cost before repair work begins.</p><Link href="/repair" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#d94b2b] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#b53d25]">Request a phone check <ArrowRight className="h-4 w-4" /></Link></div>
            <div className="space-y-3">{steps.map(step => <article key={step.number} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[.06] p-5"><span className="font-mono text-lg font-bold text-[#f6c36a]">{step.number}</span><div><h3 className="font-extrabold text-white">{step.title}</h3><p className="mt-2 text-sm leading-6 text-[#d0d8da]">{step.copy}</p></div></article>)}</div>
          </div>
        </section>

        <section className="bg-[#f6f3ee] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto max-w-4xl"><p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-[#a93823]">Before you visit</p><h2 className="mt-3 text-3xl font-black tracking-[-.05em] text-[#202a30]">Common questions about phone repair.</h2><div className="mt-7 divide-y divide-[#d9d2c8] rounded-2xl border border-[#d9d2c8] bg-white px-5">{faqs.map(faq => <details key={faq.question} className="group py-5"><summary className="cursor-pointer list-none pr-8 font-extrabold text-[#202a30] marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b53d25]">{faq.question}<span className="float-right text-[#b53d25] transition group-open:rotate-45">+</span></summary><p className="mt-3 max-w-3xl text-sm leading-7 text-[#56636a]">{faq.answer}</p></details>)}</div>
            <div className="mt-7 flex flex-col justify-between gap-4 rounded-2xl border border-[#d9d2c8] bg-white p-5 sm:flex-row sm:items-center"><div><p className="font-extrabold text-[#202a30]">Would you rather talk first?</p><p className="mt-1 text-sm text-[#56636a]">Call the Digital Phone Hub service desk in Siaya.</p></div><div className="flex flex-col gap-2 sm:flex-row"><a href="tel:+254718114009" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d94b2b] px-4 py-3 text-sm font-extrabold text-white"><Phone className="h-4 w-4" />Call 0718 114 009</a><a href="https://wa.me/254718114009?text=Hello%20Digital%20Phone%20Hub%2C%20I%20have%20a%20question%20about%20phone%20repair." target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#cfc5b8] px-4 py-3 text-sm font-extrabold text-[#202a30]"><MessageCircle className="h-4 w-4 text-[#28766b]" />WhatsApp</a></div></div>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
