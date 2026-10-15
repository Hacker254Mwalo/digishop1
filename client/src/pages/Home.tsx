import {
  ArrowRight,
  ArrowUpRight,
  BatteryCharging,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Cpu,
  Laptop,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  ShieldCheck,
  Smartphone,
  Wrench,
  Zap,
} from "lucide-react";
import { Link } from "wouter";
import PublicShell from "@/components/PublicShell";

const repairChoices = [
  { label: "Cracked screen", hint: "Phone display or glass", device: "phone", issue: "Cracked screen or damaged display", icon: Smartphone },
  { label: "Battery drains fast", hint: "Weak battery or shutdowns", device: "phone", issue: "Battery drains quickly or will not hold charge", icon: BatteryCharging },
  { label: "Won't charge", hint: "Cable, port or power fault", device: "phone", issue: "Device will not charge or the charging port feels loose", icon: Zap },
  { label: "Slow or dead laptop", hint: "Performance or power issue", device: "laptop", issue: "Laptop is slow, freezing, or not powering on", icon: Laptop },
  { label: "Something else", hint: "Tell us what changed", device: "phone", issue: "I need help diagnosing a device problem", icon: Wrench },
];

const serviceCards = [
  { icon: Smartphone, label: "Phone repair", detail: "Screens, batteries, charging and software support.", href: "/phone-repair-siaya", accent: "text-cyan-200", tag: "01" },
  { icon: Laptop, label: "Laptop service", detail: "Diagnostics for slow, dead, overheating or charging problems.", href: "/repair?device=laptop", accent: "text-violet-200", tag: "02" },
  { icon: Cpu, label: "Electronics care", detail: "A practical first check for power, sound and everyday devices.", href: "/repair?device=electronics", accent: "text-emerald-200", tag: "03" },
  { icon: Package, label: "Parts & accessories", detail: "Chargers, covers, screens, batteries and device essentials.", href: "/spares", accent: "text-orange-200", tag: "04" },
];

const promises = [
  { icon: ShieldCheck, title: "Approval before repair", copy: "We inspect first, explain the recommended fix and wait for your decision." },
  { icon: ClipboardCheck, title: "A reference you can track", copy: "Every repair request gets a reference and a clear next stage." },
  { icon: Package, title: "Fit before fulfilment", copy: "We help confirm the model before you order a part or accessory." },
];

const faqs = [
  { question: "Do I need to know the exact part I need?", answer: "No. Tell us the brand, model and what changed. We can help narrow down the right repair or part." },
  { question: "How much will a repair cost?", answer: "We do not invent a price before checking the fault. The desk confirms the repair plan and amount before work begins." },
  { question: "Can I buy a part that is not listed?", answer: "Yes. Send the device model and item you need. We can confirm sourcing, price and collection or delivery." },
  { question: "Should I repair or replace the device?", answer: "Start with a diagnosis. We explain the options so you can choose the sensible route for the device and your budget." },
];

function repairHref(device: string, issue: string) {
  return `/repair?device=${device}&issue=${encodeURIComponent(issue)}`;
}

export default function Home() {
  return (
    <PublicShell>
      <main>
        <section className="relative isolate overflow-hidden border-b border-white/[0.08] bg-[#081018]">
          <div className="absolute inset-0 -z-20 bg-[url('/brand/dph-repair-bench-portrait.webp')] bg-cover bg-center opacity-[0.22]" aria-hidden="true" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#081018_0%,rgba(8,16,24,.95)_34%,rgba(8,16,24,.68)_68%,rgba(8,16,24,.88)_100%)]" aria-hidden="true" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_76%_20%,rgba(34,211,238,.18),transparent_24%),linear-gradient(180deg,rgba(8,16,24,.05),#081018_94%)]" aria-hidden="true" />
          <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.08fr_.72fr] lg:items-center lg:gap-20 lg:px-8 lg:pb-24 lg:pt-24">
            <div className="animate-fade-up">
              <div className="flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-[0.22em] text-cyan-200"><span className="h-px w-10 bg-cyan-300" />Siaya service desk · Parts across Kenya</div>
              <h1 className="mt-6 max-w-4xl text-balance text-5xl font-extrabold leading-[.94] tracking-[-0.08em] text-white sm:text-7xl lg:text-[6.2rem]">Your device, <span className="text-cyan-200">properly looked after.</span></h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">Phone, laptop and electronics care that starts with the real problem. Get a clear next step, a compatible part or a repair you understand before you approve it.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="#repair-help" className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-300 px-6 py-3.5 text-sm font-extrabold text-slate-950 shadow-[0_14px_34px_rgba(84,231,222,.15)] transition hover:-translate-y-0.5 hover:bg-cyan-200">Start with the problem <ArrowRight className="h-4 w-4" /></Link><Link href="/spares" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.16] bg-black/20 px-6 py-3.5 text-sm font-bold text-white transition hover:border-orange-200/40 hover:bg-black/35">Shop parts & accessories <Package className="h-4 w-4 text-orange-200" /></Link></div>
              <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/[0.12] pt-5 text-xs text-slate-400"><span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-cyan-200" />Siaya Town desk</span><span className="flex items-center gap-2"><Package className="h-4 w-4 text-orange-200" />Delivery or collection</span><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-200" />Approval before repair</span></div>
            </div>
            <div className="relative animate-fade-up [animation-delay:120ms]">
              <div className="rounded-[2rem] border border-white/[0.14] bg-[#09131d]/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
                <div className="flex items-start justify-between gap-5"><div><p className="eyebrow text-cyan-200">The right starting point</p><h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.06em] text-white">Tell us what changed.</h2></div><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-300 text-slate-950"><Wrench className="h-5 w-5" /></span></div>
                <p className="mt-5 text-sm leading-6 text-slate-300">You do not need technical words. Choose the closest problem and we will open the right request for you.</p>
                <div className="mt-7 space-y-2"><Link href={repairHref("phone", "Cracked screen or damaged display")} className="group flex items-center justify-between rounded-2xl border border-white/[0.1] bg-white/[0.05] px-4 py-3.5 transition hover:border-cyan-200/40 hover:bg-cyan-300/[0.08]"><span className="flex items-center gap-3 text-sm font-bold text-white"><Smartphone className="h-4 w-4 text-cyan-200" />Phone problem</span><ChevronRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-white" /></Link><Link href={repairHref("laptop", "Laptop is slow, freezing, or not powering on")} className="group flex items-center justify-between rounded-2xl border border-white/[0.1] bg-white/[0.05] px-4 py-3.5 transition hover:border-violet-200/40 hover:bg-violet-300/[0.08]"><span className="flex items-center gap-3 text-sm font-bold text-white"><Laptop className="h-4 w-4 text-violet-200" />Laptop problem</span><ChevronRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-white" /></Link><Link href="/spares" className="group flex items-center justify-between rounded-2xl border border-white/[0.1] bg-white/[0.05] px-4 py-3.5 transition hover:border-orange-200/40 hover:bg-orange-300/[0.08]"><span className="flex items-center gap-3 text-sm font-bold text-white"><Package className="h-4 w-4 text-orange-200" />I need a part or accessory</span><ChevronRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-white" /></Link></div>
                <div className="mt-7 flex items-center gap-3 border-t border-white/[0.1] pt-5 text-xs leading-5 text-slate-400"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />We inspect first. You decide what happens next.</div>
              </div>
            </div>
          </div>
        </section>

        <section id="repair-help" className="border-b border-white/[0.08] bg-[#0c141d] px-4 py-14 sm:px-6 lg:px-8 lg:py-18"><div className="mx-auto max-w-7xl"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="eyebrow text-cyan-200">Repair helper</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-0.06em] text-white sm:text-4xl">Start with what changed.</h2></div><p className="max-w-xl text-sm leading-7 text-slate-400">Choose the closest symptom. We will prefill the repair form so you do not have to find the technical words first.</p></div><div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{repairChoices.map(choice => <Link key={choice.label} href={repairHref(choice.device, choice.issue)} className="group rounded-2xl border border-white/[0.1] bg-white/[0.035] p-4 transition hover:-translate-y-1 hover:border-cyan-200/30 hover:bg-white/[0.07]"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950/60 text-cyan-200"><choice.icon className="h-5 w-5" /></span><ArrowUpRight className="h-4 w-4 text-slate-500 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" /></div><h3 className="mt-5 font-bold text-white">{choice.label}</h3><p className="mt-1 text-xs leading-5 text-slate-400">{choice.hint}</p><span className="mt-5 inline-flex text-xs font-bold text-cyan-200">Tell us more <ArrowRight className="ml-1 h-3.5 w-3.5" /></span></Link>)}</div></div></section>

        <section className="border-b border-white/[0.08] bg-[#090f17] px-4 py-16 sm:px-6 lg:px-8 lg:py-24"><div className="mx-auto max-w-7xl"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow text-cyan-200">The Highbridge standard</p><h2 className="mt-3 max-w-2xl text-3xl font-extrabold leading-[1.04] tracking-[-0.06em] text-white sm:text-4xl">A careful service desk, not a guessing game.</h2></div><p className="max-w-md text-sm leading-6 text-slate-400">The same team can help diagnose a problem, source a compatible part and keep you updated after the request.</p></div><div className="mt-8 grid gap-3 md:grid-cols-3">{promises.map((promise, index) => <div key={promise.title} className="rounded-[1.35rem] border border-white/[0.09] bg-white/[0.035] p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-200/25 hover:bg-white/[0.06]"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200"><promise.icon className="h-5 w-5" /></span><span className="text-xs font-extrabold tracking-[0.18em] text-white/20">0{index + 1}</span></div><h3 className="mt-6 font-bold text-white">{promise.title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{promise.copy}</p></div>)}</div></div></section>

        <section className="relative overflow-hidden bg-[#080d14] px-4 py-16 sm:px-6 lg:px-8 lg:py-24"><div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_75%_50%,rgba(249,115,22,.11),transparent_30rem)]" /><div className="relative mx-auto max-w-7xl"><div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:items-end"><div><p className="eyebrow text-orange-200">One place for the next move</p><h2 className="mt-4 max-w-xl text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.07em] text-white sm:text-5xl">Repair the device. Or find the part.</h2></div><p className="max-w-xl text-sm leading-7 text-slate-400">From a cracked screen to a missing charger, choose the practical route instead of being pushed into a product you do not need.</p></div><div className="mt-12 grid gap-3 md:grid-cols-2 lg:grid-cols-4">{serviceCards.map(service => <Link href={service.href} key={service.label} className="group relative rounded-[1.65rem] border border-white/[0.1] bg-white/[0.035] p-5 transition duration-300 hover:-translate-y-1 hover:border-white/[0.25] hover:bg-white/[0.07]"><span className="absolute right-5 top-4 text-5xl font-extrabold text-white/[0.06]">{service.tag}</span><div className="flex items-start justify-between"><span className={`grid h-11 w-11 place-items-center rounded-2xl bg-slate-950/70 ${service.accent}`}><service.icon className="h-5 w-5" /></span><ArrowRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-1 group-hover:text-white" /></div><h3 className="mt-9 text-xl font-extrabold tracking-[-0.04em] text-white">{service.label}</h3><p className="mt-3 min-h-12 text-sm leading-6 text-slate-400">{service.detail}</p><span className={`mt-6 inline-flex items-center gap-2 text-sm font-bold ${service.accent}`}>Explore <ArrowRight className="h-4 w-4" /></span><span className="absolute bottom-0 left-5 right-5 h-px origin-left scale-x-0 bg-cyan-300 transition group-hover:scale-x-100" /></Link>)}</div></div></section>

        <section className="border-y border-white/[0.08] bg-[#0d141d] px-4 py-16 sm:px-6 lg:px-8 lg:py-24"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-start"><div><p className="eyebrow text-violet-200">Useful answers</p><h2 className="mt-4 max-w-xl text-4xl font-extrabold leading-[1.02] tracking-[-0.07em] text-white sm:text-5xl">Clear before you commit.</h2><p className="mt-5 max-w-md text-sm leading-7 text-slate-400">Good service starts by removing uncertainty. Here is what you can expect from the desk.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col"><Link href="/repair-status" className="inline-flex items-center justify-between rounded-2xl border border-white/[0.1] bg-white/[0.035] px-4 py-3 text-sm font-bold text-white transition hover:border-cyan-200/30 hover:bg-white/[0.07]">Track an existing repair <ArrowRight className="h-4 w-4 text-cyan-200" /></Link><a href="https://wa.me/254718114009?text=Hello%20Digital%20Phone%20Hub%2C%20I%20have%20a%20question%20before%20booking%20or%20ordering." target="_blank" rel="noreferrer" className="inline-flex items-center justify-between rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] px-4 py-3 text-sm font-bold text-emerald-100 transition hover:bg-emerald-300/[0.1]">Ask on WhatsApp <MessageCircle className="h-4 w-4" /></a></div></div><div className="divide-y divide-white/[0.1] rounded-[1.75rem] border border-white/[0.1] bg-white/[0.025] px-5 sm:px-7">{faqs.map((faq, index) => <details key={faq.question} className="group py-5" open={index === 0}><summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-base font-bold text-white"><span>{faq.question}</span><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/[0.12] text-cyan-200 transition group-open:rotate-45"><span className="text-xl font-light">+</span></span></summary><p className="max-w-2xl pr-10 pt-3 text-sm leading-7 text-slate-400">{faq.answer}</p></details>)}</div></div></section>

        <section className="bg-[#090b10] px-4 py-16 sm:px-6 lg:px-8 lg:py-20"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 rounded-[2rem] border border-cyan-200/10 bg-gradient-to-br from-cyan-300/[0.11] via-white/[0.03] to-violet-300/[0.08] p-7 sm:p-10 lg:flex-row lg:items-center"><div><p className="eyebrow text-cyan-200">Ready when you are</p><h2 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-[-0.06em] text-white sm:text-4xl">Bring us the problem. Leave with a plan.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">Book a check, ask for a part or speak to the service desk in Siaya.</p></div><div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row"><Link href="/repair" className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-300 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-cyan-200">Book a repair <ArrowUpRight className="h-4 w-4" /></Link><a href="tel:+254718114009" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.14] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.07]"><Phone className="h-4 w-4 text-cyan-200" />Call the desk</a></div></div></section>
      </main>
    </PublicShell>
  );
}
