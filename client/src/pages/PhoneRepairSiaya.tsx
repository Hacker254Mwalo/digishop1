import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, MapPin, Phone, ShieldCheck, Smartphone, Wrench } from "lucide-react";
import { Link } from "wouter";
import PublicShell from "@/components/PublicShell";

const repairProblems = [
  "Cracked or unresponsive phone screens",
  "Weak batteries, fast drain or charging faults",
  "Charging ports, microphones and speakers",
  "Software issues, setup and device diagnostics",
];

const faqs = [
  {
    question: "Where can I get phone repair in Siaya?",
    answer: "Digital Phone Hub provides phone repair support from its service desk in Siaya Town. Start online or call 0718 114 009 so the team can confirm the next step before work begins.",
  },
  {
    question: "Can you help me find the right LCD screen?",
    answer: "Yes. Share the exact phone brand and model. The team can help confirm compatibility and check the available screen option before you place an order.",
  },
  {
    question: "How long does a phone repair take?",
    answer: "Timing depends on the fault and part availability. Digital Phone Hub checks the device first and then explains the expected next step rather than promising a time before diagnosis.",
  },
  {
    question: "Do you serve customers outside Siaya?",
    answer: "The service desk is in Siaya, while selected spare parts and accessories can be arranged across Kenya. Call the desk to confirm delivery or collection options.",
  },
];

export default function PhoneRepairSiaya() {
  return <PublicShell><main className="bg-[#090b10] text-slate-100">
    <section className="border-b border-white/[0.08] bg-[radial-gradient(circle_at_82%_12%,rgba(34,211,238,.16),transparent_28%),linear-gradient(135deg,#09111a,#111b2d_60%,#15152b)] px-4 py-14 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.02fr_.98fr] lg:items-center">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"><ArrowLeft className="h-4 w-4" />Back to Digital Phone Hub</Link>
          <p className="mt-10 text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-200">Phone repair in Siaya · Digital Phone Hub</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-[.98] tracking-[-0.07em] text-white sm:text-6xl">Phone repair that starts with the right check.</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300">Bring a cracked screen, weak battery, charging fault or software problem to a local service desk that explains the next step clearly.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/repair" className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-300 px-6 py-3.5 text-sm font-extrabold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-200">Book a repair <ArrowRight className="h-4 w-4" /></Link><a href="tel:+254718114009" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/[0.08]"><Phone className="h-4 w-4 text-cyan-200" />0718 114 009</a></div>
          <div className="mt-9 flex flex-wrap gap-3 text-xs font-semibold text-slate-400"><span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2"><MapPin className="h-3.5 w-3.5 text-cyan-200" />Siaya Town service desk</span><span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2"><Clock3 className="h-3.5 w-3.5 text-orange-200" />Mon–Sat · 8:00–18:00</span></div>
        </div>
        <div className="premium-panel rounded-[2rem] p-3 shadow-2xl shadow-black/30"><div className="overflow-hidden rounded-[1.5rem] border border-white/10"><img src="/brand/dph-repair-bench-portrait.webp" alt="Digital Phone Hub phone repair service desk in Siaya" className="h-72 w-full object-cover sm:h-[26rem]" /></div><div className="grid gap-3 p-4 sm:grid-cols-3"><div><CheckCircle2 className="h-5 w-5 text-cyan-200" /><p className="mt-3 text-sm font-bold text-white">Tell us the fault</p></div><div><ShieldCheck className="h-5 w-5 text-violet-200" /><p className="mt-3 text-sm font-bold text-white">Get clear advice</p></div><div><Wrench className="h-5 w-5 text-orange-200" /><p className="mt-3 text-sm font-bold text-white">Approve the next step</p></div></div></div>
      </div>
    </section>

    <section className="border-b border-white/[0.08] bg-[#0d131c] px-4 py-14 sm:px-6 lg:px-8 lg:py-20"><div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-200">What we help with</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-0.06em] text-white sm:text-4xl">Practical support for the phone problems that interrupt your day.</h2></div><div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{repairProblems.map(problem => <div key={problem} className="premium-panel-hover rounded-2xl border border-white/[0.09] bg-white/[0.035] p-5"><Smartphone className="h-5 w-5 text-cyan-200" /><p className="mt-5 text-sm font-bold leading-6 text-white">{problem}</p><p className="mt-2 text-xs leading-5 text-slate-500">Start with the model and what changed.</p></div>)}</div></div></section>

    <section className="bg-[#090b10] px-4 py-14 sm:px-6 lg:px-8 lg:py-20"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-start"><div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-orange-200">A calmer repair journey</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-0.06em] text-white sm:text-4xl">No guessing. No pressure. Just a clear next step.</h2><p className="mt-5 text-sm leading-7 text-slate-400">Digital Phone Hub checks the device, explains what was found and helps you decide whether to repair it, order a compatible part or come back with more information.</p><Link href="/spares" className="mt-7 inline-flex items-center gap-2 rounded-full border border-orange-200/25 bg-orange-300/[0.08] px-5 py-3 text-sm font-bold text-orange-100 transition hover:bg-orange-300/15">Browse spare parts <ArrowRight className="h-4 w-4" /></Link></div><div className="space-y-3">{[{n:"01",title:"Tell us what happened",copy:"Share your phone model, issue and contact number online or by phone."},{n:"02",title:"We check and advise",copy:"The service desk reviews the fault and contacts you with the practical next step."},{n:"03",title:"You choose confidently",copy:"Approve the repair, ask for a compatible part or arrange delivery or collection."}].map(step => <div key={step.n} className="premium-panel-hover flex gap-4 rounded-2xl border border-white/[0.09] bg-white/[0.035] p-5"><span className="text-xl font-extrabold text-cyan-200">{step.n}</span><div><h3 className="font-bold text-white">{step.title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{step.copy}</p></div></div>)}</div></div></section>

    <section className="border-y border-white/[0.08] bg-[#0e141e] px-4 py-14 sm:px-6 lg:px-8 lg:py-20"><div className="mx-auto max-w-4xl"><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-violet-200">Questions customers ask</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-0.06em] text-white sm:text-4xl">Before you bring your phone in.</h2><div className="mt-8 divide-y divide-white/10 rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-5">{faqs.map(faq => <details key={faq.question} className="group py-5"><summary className="cursor-pointer list-none pr-8 text-base font-bold text-white marker:hidden">{faq.question}<span className="float-right text-cyan-200 transition group-open:rotate-45">+</span></summary><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">{faq.answer}</p></details>)}</div><div className="mt-8 flex flex-col justify-between gap-4 rounded-2xl border border-cyan-200/15 bg-cyan-300/[0.06] p-5 sm:flex-row sm:items-center"><div><p className="font-bold text-white">Need help now?</p><p className="mt-1 text-sm text-slate-400">Call the Digital Phone Hub service desk in Siaya.</p></div><a href="tel:+254718114009" className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-300 px-5 py-3 text-sm font-extrabold text-slate-950"><Phone className="h-4 w-4" />Call 0718 114 009</a></div></div></section>
  </main></PublicShell>;
}
