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
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";
import { Link } from "wouter";
import PublicShell from "@/components/PublicShell";

const repairChoices = [
  { label: "Cracked screen", hint: "Phone display or glass", device: "phone", issue: "Cracked screen or damaged display", icon: Smartphone, tone: "cyan" },
  { label: "Battery drains fast", hint: "Weak battery or shutdowns", device: "phone", issue: "Battery drains quickly or will not hold charge", icon: BatteryCharging, tone: "orange" },
  { label: "Won't charge", hint: "Cable, port or power fault", device: "phone", issue: "Device will not charge or the charging port feels loose", icon: Zap, tone: "violet" },
  { label: "Slow or dead laptop", hint: "Performance or power issue", device: "laptop", issue: "Laptop is slow, freezing, or not powering on", icon: Laptop, tone: "emerald" },
  { label: "Something else", hint: "Tell us what changed", device: "phone", issue: "I need help diagnosing a device problem", icon: Wrench, tone: "slate" },
];

const serviceCards = [
  { icon: Smartphone, label: "Phone repair in Siaya", copy: "Screens, batteries, charging and software support. Start with the fault, not a guess.", href: "/phone-repair-siaya", tone: "cyan", image: "/brand/dph-repair-bench-portrait.webp", imageAlt: "Technician working at the Digital Phone Hub service desk" },
  { icon: Laptop, label: "Laptop service", copy: "Diagnostics for slow, dead, overheating, charging or storage problems.", href: "/repair?device=laptop", tone: "violet", image: "/brand/dph-service-desk-portrait.webp", imageAlt: "Laptop and accessories at the Digital Phone Hub service desk" },
  { icon: Cpu, label: "Electronics diagnostics", copy: "A practical first check for power, sound, accessories and everyday electronics.", href: "/repair?device=electronics", tone: "emerald", image: "/brand/dph-service-desk-portrait.webp", imageAlt: "Electronics service desk with devices and accessories" },
  { icon: Package, label: "Shop parts & accessories", copy: "Screens, batteries, chargers, covers and devices. Ask for the right fit before you pay.", href: "/spares", tone: "orange", image: "/brand/dph-storefront-sign-wide.webp", imageAlt: "Digital Phone Hub storefront for repairs and accessories" },
];

const promiseCards = [
  { icon: ShieldCheck, title: "No work without your approval", copy: "We check the device and explain the recommended next step before repair work moves ahead." },
  { icon: ClipboardCheck, title: "A reference you can track", copy: "Every repair request gets a reference so you can check the latest stage without repeating your story." },
  { icon: Package, title: "Compatibility before fulfilment", copy: "Share the device model and we help confirm a part, accessory or charger before the order is processed." },
];

const faqs = [
  { question: "Do I need to know the exact part I need?", answer: "No. Tell us the device brand, model and what changed. We can help narrow down the likely issue or compatible part before you order." },
  { question: "How much will a repair cost?", answer: "We do not publish a made-up price before checking the fault. The service desk reviews the device and confirms the repair plan and amount before work begins." },
  { question: "Can I buy a spare part that is not listed?", answer: "Yes. Use the shop request path or call the service desk with the device model, part name and location. We can confirm availability, price and delivery or collection." },
  { question: "How do I know whether to repair or replace?", answer: "Start with a diagnosis. We can explain what is wrong, what the repair involves and whether a compatible replacement or accessory is the more sensible option." },
];

const toneStyles: Record<string, { shell: string; icon: string; accent: string }> = {
  cyan: { shell: "from-cyan-300/[0.16] via-cyan-400/[0.03] to-slate-950", icon: "text-cyan-200", accent: "bg-cyan-300" },
  violet: { shell: "from-violet-300/[0.16] via-violet-400/[0.03] to-slate-950", icon: "text-violet-200", accent: "bg-violet-300" },
  emerald: { shell: "from-emerald-300/[0.16] via-emerald-400/[0.03] to-slate-950", icon: "text-emerald-200", accent: "bg-emerald-300" },
  orange: { shell: "from-orange-300/[0.16] via-orange-400/[0.03] to-slate-950", icon: "text-orange-200", accent: "bg-orange-300" },
  slate: { shell: "from-white/[0.1] via-white/[0.03] to-slate-950", icon: "text-slate-200", accent: "bg-slate-200" },
};

function repairHref(device: string, issue: string) {
  return `/repair?device=${device}&issue=${encodeURIComponent(issue)}`;
}

export default function Home() {
  return (
    <PublicShell>
      <main>
        <section className="relative isolate overflow-hidden border-b border-white/[0.08] bg-[#0a1018]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(34,211,238,.14),transparent_26%),radial-gradient(circle_at_8%_82%,rgba(124,58,237,.10),transparent_28%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-14 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[1fr_.9fr] lg:items-center lg:gap-16 lg:px-8 lg:pb-20 lg:pt-20">
            <div className="animate-fade-up">
              <div className="flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-[0.22em] text-cyan-200"><span className="h-px w-10 bg-cyan-300" />Siaya service desk · Parts across Kenya</div>
              <h1 className="mt-6 max-w-3xl text-balance text-5xl font-extrabold leading-[.94] tracking-[-0.08em] text-white sm:text-7xl lg:text-[5.6rem]">Fix it properly. <span className="bg-gradient-to-r from-cyan-200 via-sky-300 to-violet-300 bg-clip-text text-transparent">Keep moving.</span></h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">Phone, laptop and electronics care that starts with the real problem. Book a check, track the repair, or shop for a compatible part without guessing.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="#repair-help" className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-300 px-6 py-3.5 text-sm font-extrabold text-slate-950 shadow-[0_14px_34px_rgba(84,231,222,.15)] transition hover:-translate-y-0.5 hover:bg-cyan-200">Start with the problem <ArrowRight className="h-4 w-4" /></Link><Link href="/spares" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.14] bg-white/[0.04] px-6 py-3.5 text-sm font-bold text-white transition hover:border-orange-200/40 hover:bg-white/[0.08]">Shop parts & accessories <Package className="h-4 w-4 text-orange-200" /></Link></div>
              <div className="mt-9 grid gap-3 border-t border-white/[0.1] pt-5 text-xs text-slate-400 sm:grid-cols-3"><span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-cyan-200" />Siaya Town desk</span><span className="flex items-center gap-2"><Package className="h-4 w-4 text-orange-200" />Delivery or collection</span><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-200" />Approval before repair</span></div>
            </div>
            <div className="relative animate-fade-up [animation-delay:120ms]">
              <div className="pointer-events-none absolute -inset-12 rounded-full bg-cyan-400/[0.08] blur-3xl" />
              <div className="premium-panel relative overflow-hidden rounded-[2rem] p-2 shadow-2xl shadow-black/40 sm:p-3">
                <div className="relative overflow-hidden rounded-[1.45rem] border border-white/[0.09] bg-[#0c131d]"><img src="/brand/dph-repair-bench-portrait.webp" alt="Technician working at the Digital Phone Hub service desk" className="h-72 w-full object-cover opacity-85 sm:h-[25rem]" /><div className="absolute inset-0 bg-gradient-to-t from-[#071018] via-[#071018]/20 to-transparent" /><div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/[0.14] bg-[#071018]/70 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-100 backdrop-blur-md"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.9)]" /> Open for requests</div><div className="absolute inset-x-5 bottom-5"><p className="eyebrow text-cyan-200">A clear next step</p><h2 className="mt-2 text-2xl font-extrabold tracking-[-0.05em] text-white">We inspect first. You decide.</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-300">No pressure to approve a repair before you understand the fault, timing and options.</p></div></div>
                <div className="grid gap-2 p-2 sm:grid-cols-3"><Link href="/repair" className="group rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 transition hover:-translate-y-0.5 hover:border-cyan-200/30 hover:bg-cyan-300/[0.08]"><Smartphone className="h-5 w-5 text-cyan-200" /><p className="mt-6 text-xs text-slate-400">Need a repair?</p><p className="mt-1 font-bold text-white">Book a check <ChevronRight className="ml-1 inline h-4 w-4 transition group-hover:translate-x-1" /></p></Link><Link href="/repair-status" className="group rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 transition hover:-translate-y-0.5 hover:border-violet-200/30 hover:bg-violet-300/[0.08]"><ClipboardCheck className="h-5 w-5 text-violet-200" /><p className="mt-6 text-xs text-slate-400">Already booked?</p><p className="mt-1 font-bold text-white">Track it <ChevronRight className="ml-1 inline h-4 w-4 transition group-hover:translate-x-1" /></p></Link><a href="https://wa.me/254718114009?text=Hello%20Digital%20Phone%20Hub%2C%20I%20need%20help%20with%20a%20device%20or%20part." target="_blank" rel="noreferrer" className="group rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 transition hover:-translate-y-0.5 hover:border-emerald-200/30 hover:bg-emerald-300/[0.08]"><MessageCircle className="h-5 w-5 text-emerald-200" /><p className="mt-6 text-xs text-slate-400">Need an answer?</p><p className="mt-1 font-bold text-white">WhatsApp us <ChevronRight className="ml-1 inline h-4 w-4 transition group-hover:translate-x-1" /></p></a></div>
              </div>
            </div>
          </div>
        </section>

        <section id="repair-help" className="border-b border-white/[0.08] bg-[#0d131c] px-4 py-12 sm:px-6 lg:px-8 lg:py-16"><div className="mx-auto max-w-7xl"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="eyebrow text-cyan-200">Repair helper</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-0.06em] text-white sm:text-4xl">Start with what changed.</h2></div><p className="max-w-xl text-sm leading-7 text-slate-400">Choose the closest symptom. We will open the repair form with the right context already included, so you do not have to find the technical words first.</p></div><div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{repairChoices.map(choice => { const tone = toneStyles[choice.tone]; return <Link key={choice.label} href={repairHref(choice.device, choice.issue)} className="group rounded-2xl border border-white/[0.1] bg-white/[0.035] p-4 transition hover:-translate-y-1 hover:border-cyan-200/30 hover:bg-white/[0.07]"><div className="flex items-center justify-between"><span className={`grid h-10 w-10 place-items-center rounded-xl bg-slate-950/50 ${tone.icon}`}><choice.icon className="h-5 w-5" /></span><ArrowUpRight className="h-4 w-4 text-slate-500 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" /></div><h3 className="mt-5 font-bold text-white">{choice.label}</h3><p className="mt-1 text-xs leading-5 text-slate-400">{choice.hint}</p><span className={`mt-5 inline-flex text-xs font-bold ${tone.icon}`}>Tell us more <ArrowRight className="ml-1 h-3.5 w-3.5" /></span></Link> })}</div></div></section>

        <section className="border-b border-white/[0.08] bg-[#0a1018] px-4 py-14 sm:px-6 lg:px-8 lg:py-18"><div className="mx-auto max-w-7xl"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow text-cyan-200">The Highbridge standard</p><h2 className="mt-3 max-w-2xl text-3xl font-extrabold leading-[1.04] tracking-[-0.06em] text-white sm:text-4xl">A repair desk and a real shop, working together.</h2></div><p className="max-w-md text-sm leading-6 text-slate-400">The same team can help you diagnose a problem, source a compatible part and keep you updated after the request.</p></div><div className="mt-8 grid gap-3 md:grid-cols-3">{promiseCards.map((promise, index) => <div key={promise.title} className="group rounded-[1.35rem] border border-white/[0.09] bg-white/[0.035] p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-200/25 hover:bg-white/[0.06]"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200"><promise.icon className="h-5 w-5" /></span><span className="text-xs font-extrabold tracking-[0.18em] text-white/20">0{index + 1}</span></div><h3 className="mt-6 font-bold text-white">{promise.title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{promise.copy}</p></div>)}</div></div></section>

        <section className="bg-[#090b10] px-4 py-16 sm:px-6 lg:px-8 lg:py-24"><div className="mx-auto max-w-7xl"><div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:items-end"><div><p className="eyebrow text-orange-200">One place for the next move</p><h2 className="text-balance mt-4 max-w-xl text-4xl font-extrabold leading-[1.02] tracking-[-0.07em] text-white sm:text-5xl">Repair the device. Or find the part.</h2></div><p className="max-w-xl text-sm leading-7 text-slate-400">From a cracked screen to a missing charger, we help you choose the practical route instead of pushing you into a product you do not need.</p></div><div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{serviceCards.map((service, index) => { const tone = toneStyles[service.tone]; return <Link href={service.href} key={service.label} className={`group relative overflow-hidden rounded-[1.65rem] border border-white/[0.1] bg-gradient-to-br p-5 transition duration-300 hover:-translate-y-1 hover:border-white/[0.25] hover:shadow-2xl hover:shadow-black/30 ${tone.shell}`}><span className="absolute right-5 top-4 text-5xl font-extrabold text-white/[0.06]">0{index + 1}</span><div className="flex items-start justify-between"><span className={`grid h-11 w-11 place-items-center rounded-2xl bg-slate-950/60 ${tone.icon}`}><service.icon className="h-5 w-5" /></span><ArrowRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-1 group-hover:text-white" /></div><div className="mt-5 overflow-hidden rounded-2xl border border-white/[0.1] bg-slate-950/50"><img src={service.image} alt={service.imageAlt} className="h-36 w-full object-cover transition duration-500 group-hover:scale-105" loading={index === 0 ? "eager" : "lazy"} /></div><p className="eyebrow mt-5 text-slate-500">{index === 3 ? "Shop" : "Service"}</p><h3 className="mt-2 text-xl font-extrabold tracking-[-0.04em] text-white">{service.label}</h3><p className="mt-3 text-sm leading-6 text-slate-300">{service.copy}</p><span className={`mt-6 inline-flex items-center gap-2 text-sm font-bold ${tone.icon}`}>{index === 3 ? "Open the shop" : "See how it works"} <ArrowRight className="h-4 w-4" /></span><span className={`absolute bottom-0 left-0 h-0.5 w-0 ${tone.accent} transition-all duration-300 group-hover:w-full`} /></Link> })}</div></div></section>

        <section className="border-y border-white/[0.08] bg-[#0e141e] px-4 py-16 sm:px-6 lg:px-8 lg:py-24"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.85fr_1.15fr] lg:items-start"><div><p className="eyebrow text-violet-200">Questions before you act</p><h2 className="mt-4 max-w-2xl text-4xl font-extrabold leading-[1.02] tracking-[-0.07em] text-white sm:text-5xl">Useful answers, not sales copy.</h2><p className="mt-6 max-w-xl text-sm leading-7 text-slate-400">If you are unsure whether to repair, replace or order, start here. If your question is specific, call or WhatsApp the service desk.</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/repair-status" className="inline-flex items-center gap-2 rounded-full border border-white/[0.14] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.07]">Track a repair <ClipboardCheck className="h-4 w-4 text-cyan-200" /></Link><a href="https://wa.me/254718114009?text=Hello%20Digital%20Phone%20Hub%2C%20I%20have%20a%20question%20about%20a%20repair%20or%20part." target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-emerald-300 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-emerald-200"><MessageCircle className="h-4 w-4" />Ask on WhatsApp</a></div></div><div className="divide-y divide-white/10 rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-5">{faqs.map(faq => <details key={faq.question} className="group py-5"><summary className="cursor-pointer list-none pr-8 text-base font-bold text-white marker:hidden">{faq.question}<span className="float-right text-cyan-200 transition group-open:rotate-45">+</span></summary><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">{faq.answer}</p></details>)}</div></div></section>

        <section className="bg-[#090b10] px-4 py-16 sm:px-6 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-[2rem] border border-orange-200/15 bg-gradient-to-r from-orange-300/[0.09] via-cyan-300/[0.07] to-violet-400/[0.09] p-7 sm:flex-row sm:items-center sm:p-10"><div><p className="eyebrow text-orange-200">Ready for a practical next step?</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-0.05em] text-white">Tell us what changed.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Book a repair, request a part, call the desk or message us on WhatsApp. We will help you choose the route that makes sense.</p></div><div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row"><Link href="/repair" className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-300 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-cyan-200">Book a repair <ArrowRight className="h-4 w-4" /></Link><a href="tel:+254718114009" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.14] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.07]"><Phone className="h-4 w-4 text-cyan-200" />0718 114 009</a></div></div></section>
      </main>
    </PublicShell>
  );
}
