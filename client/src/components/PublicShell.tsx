import { ArrowUpRight, Clock3, Menu, Phone, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/repair", label: "Repair services" },
  { href: "/repair-status", label: "Track my repair" },
  { href: "/spares", label: "Parts & accessories" },
];

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <span className={`relative grid ${compact ? "h-9 w-9 rounded-xl" : "h-10 w-10 rounded-2xl"} shrink-0 place-items-center overflow-hidden bg-cyan-300 shadow-[0_0_28px_rgba(84,231,222,.2)]`}>
        <img src="/brand/icon.svg" alt="" aria-hidden="true" className="h-full w-full object-cover" />
      </span>
      <span className="leading-tight">
        <strong className={`${compact ? "text-sm" : "text-[15px]"} block font-extrabold tracking-[-0.03em] text-white`}>Digital Phone Hub</strong>
        <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-200/80">Repair & Electronics</span>
      </span>
    </span>
  );
}

export default function PublicShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const currentPath = location.split("?")[0];
  const isActive = (href: string) => href === "/" ? currentPath === "/" : currentPath === href || currentPath.startsWith(`${href}/`);

  return (
    <div className="min-h-screen bg-[#090b10] text-slate-100 selection:bg-cyan-300 selection:text-slate-950">
      <div className="hidden border-b border-white/[0.06] bg-[#0d1118] text-[11px] text-slate-400 sm:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
          <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.8)]" /> Your trusted phone-care team in Siaya · Parts available across Kenya</span>
          <span className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5 text-cyan-200" /> Mon–Sat · 8:00–18:00</span>
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#090b10]/85 backdrop-blur-2xl">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300" onClick={() => setOpen(false)} aria-label="Digital Phone Hub home">
            <BrandMark />
          </Link>
          <nav className="hidden items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.03] p-1 text-sm lg:flex" aria-label="Primary navigation">
            {navItems.map(item => <Link key={item.href} href={item.href} className={`relative rounded-full px-4 py-2 transition-all duration-200 ${isActive(item.href) ? "bg-white/[0.1] font-semibold text-white shadow-sm" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"}`} aria-current={isActive(item.href) ? "page" : undefined}>{item.label}</Link>)}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/spares" className="hidden items-center gap-2 rounded-full border border-orange-200/20 bg-orange-300/[0.08] px-3 py-2 text-xs font-bold text-orange-100 transition hover:border-orange-200/40 hover:bg-orange-300/15 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-orange-300" />Shop parts</Link><a href="tel:+254718114009" className="hidden items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white sm:flex"><Phone className="h-3.5 w-3.5 text-cyan-300" />0718 114 009</a>
            <Link href="/repair" className="hidden items-center gap-2 rounded-full bg-cyan-300 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-[0_8px_24px_rgba(84,231,222,.12)] transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-200 active:scale-[.98] sm:flex">Book a repair <ArrowUpRight className="h-3.5 w-3.5" /></Link>
            <button className="grid h-10 w-10 place-items-center rounded-full border border-white/[0.12] text-slate-200 transition hover:border-cyan-200/50 hover:bg-white/[0.08] lg:hidden" onClick={() => setOpen(value => !value)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
          </div>
        </div>
        {open && <nav className="border-t border-white/[0.08] bg-[#0d1118] px-4 py-4 shadow-2xl shadow-black/40 lg:hidden" aria-label="Mobile navigation"><div className="mx-auto grid max-w-7xl gap-2 text-sm">{navItems.map(item => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`rounded-xl px-3 py-3 transition ${isActive(item.href) ? "bg-cyan-300/10 font-semibold text-cyan-100" : "text-slate-300 hover:bg-white/[0.06] hover:text-white"}`} aria-current={isActive(item.href) ? "page" : undefined}>{item.label}</Link>)}<a href="tel:+254718114009" className="mt-2 flex items-center justify-between rounded-xl border border-cyan-200/15 bg-cyan-300/10 px-3 py-3 font-semibold text-cyan-100"><span>Talk to our service desk</span><span className="flex items-center gap-2 text-xs"><Phone className="h-3.5 w-3.5" />0718 114 009</span></a></div></nav>}
      </header>
      {children}
      <footer className="border-t border-white/[0.08] bg-[#07090d]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-cyan-200/10 bg-gradient-to-br from-cyan-300/[0.11] via-white/[0.03] to-violet-300/[0.08] p-6 sm:p-8 lg:p-10">
            <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div><p className="eyebrow text-cyan-200">Need trusted device care?</p><h2 className="mt-3 max-w-xl text-2xl font-extrabold tracking-[-0.05em] text-white sm:text-3xl">Bring your device to a team that cares about getting it right.</h2><p className="mt-3 max-w-lg text-sm leading-6 text-slate-400">Book online, call us or visit our Siaya shop. We check first, explain clearly and help you choose the right solution.</p></div>
              <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row"><Link href="/repair" className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-300 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-200 active:scale-[.98]">Book a repair <ArrowUpRight className="h-4 w-4" /></Link><a href="tel:+254718114009" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.14] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.07]"><Phone className="h-4 w-4 text-cyan-200" />Call the desk</a></div>
            </div>
          </div>
          <div className="mt-14 grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr]">
            <div><Link href="/" className="inline-flex rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"><BrandMark compact /></Link><p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">Digital Phone Hub is your local partner for phone, laptop and electronics care in Siaya, with parts and accessories available across Kenya.</p></div>
            <div><p className="eyebrow text-cyan-200/80">Customer care</p><div className="mt-4 grid gap-3 text-sm text-slate-400"><Link className="transition hover:text-white" href="/repair">Book a repair</Link><Link className="transition hover:text-white" href="/repair-status">Track my repair</Link><Link className="transition hover:text-white" href="/spares">Find parts & accessories</Link></div></div>
            <div><p className="eyebrow text-cyan-200/80">Service desk</p><div className="mt-4 grid gap-3 text-sm text-slate-400"><span>Siaya Town, Siaya County</span><a className="transition hover:text-white" href="tel:+254718114009">0718 114 009</a><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" />Honest advice. Reliable service.</span></div></div>
          </div>
        </div>
        <div className="border-t border-white/[0.06] px-4 py-5 text-center text-xs text-slate-600">© {new Date().getFullYear()} Digital Phone Hub Repair & Electronics</div>
      </footer>
    </div>
  );
}
