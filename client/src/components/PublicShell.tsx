import { ArrowUpRight, Menu, Phone, ShieldCheck, Smartphone, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/repair", label: "Book a repair" },
  { href: "/repair-status", label: "Repair status" },
  { href: "/spares", label: "Spare parts" },
  { href: "/admin", label: "Owner portal" },
];

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <span aria-hidden="true" className={`${compact ? "h-9 w-9 rounded-xl" : "h-10 w-10 rounded-2xl"} relative grid place-items-center bg-gradient-to-br from-cyan-200 via-sky-400 to-blue-700 text-slate-950 shadow-lg shadow-cyan-400/20`}>
        <Smartphone className={compact ? "h-4 w-4" : "h-5 w-5"} />
        <span className={`${compact ? "bottom-1.5 right-1.5 h-1 w-1" : "bottom-1.5 right-1.5 h-1.5 w-1.5"} absolute rounded-full bg-violet-700`} />
      </span>
      <span className="leading-tight">
        <strong className={`${compact ? "text-sm" : "text-sm"} block font-semibold tracking-tight`}>Digital Phone Hub</strong>
        <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-cyan-200">Repair & Electronics</span>
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300" onClick={() => setOpen(false)} aria-label="Digital Phone Hub home">
            <BrandMark />
          </Link>
          <nav className="hidden items-center gap-7 text-sm lg:flex" aria-label="Primary navigation">
            {navItems.map(item => <Link key={item.href} href={item.href} className={`rounded-full px-2 py-2 transition ${isActive(item.href) ? "bg-cyan-300/10 text-cyan-100" : "text-slate-300 hover:bg-white/10 hover:text-white"}`} aria-current={isActive(item.href) ? "page" : undefined}>{item.label}</Link>)}
          </nav>
          <div className="flex items-center gap-2">
            <a href="tel:+254718114009" className="hidden items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 sm:flex"><Phone className="h-3.5 w-3.5 text-cyan-300" />0718 114 009</a>
            <Link href="/repair" className="hidden items-center gap-2 rounded-full bg-cyan-300 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-200 sm:flex">Start a repair <ArrowUpRight className="h-3.5 w-3.5" /></Link>
            <button className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-slate-200 transition hover:border-cyan-200/50 hover:bg-white/10 lg:hidden" onClick={() => setOpen(value => !value)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
          </div>
        </div>
        {open && <nav className="border-t border-white/10 bg-slate-900 px-4 py-4 shadow-2xl shadow-slate-950/30 lg:hidden" aria-label="Mobile navigation"><div className="mx-auto grid max-w-7xl gap-2 text-sm">{navItems.map(item => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`rounded-xl px-3 py-3 transition ${isActive(item.href) ? "bg-cyan-300/15 font-semibold text-cyan-100" : "text-slate-300 hover:bg-white/10 hover:text-white"}`} aria-current={isActive(item.href) ? "page" : undefined}>{item.label}</Link>)}<a href="tel:+254718114009" className="mt-2 flex items-center justify-between rounded-xl border border-cyan-200/15 bg-cyan-300/10 px-3 py-3 font-semibold text-cyan-100"><span>Talk to the service desk</span><span className="flex items-center gap-2 text-xs"><Phone className="h-3.5 w-3.5" />0718 114 009</span></a></div></nav>}
      </header>
      {children}
      <footer className="border-t border-white/10 bg-slate-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div><Link href="/" className="inline-flex rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"><BrandMark compact /></Link><p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">A real service desk in Siaya for phones and laptops, with spare parts and accessories available for customers across Kenya.</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Customer routes</p><div className="mt-4 grid gap-3 text-sm text-slate-400"><Link href="/repair">Book a repair</Link><Link href="/repair-status">Check repair status</Link><Link href="/spares">Request spare parts</Link><Link href="/admin">Owner portal</Link></div></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Service desk</p><div className="mt-4 grid gap-3 text-sm text-slate-400"><span>Siaya Town, Siaya County</span><a href="tel:+254718114009">0718 114 009</a><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" />Clear next steps, real people.</span></div></div>
        </div>
        <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-slate-500">© {new Date().getFullYear()} Digital Phone Hub Repair & Electronics</div>
      </footer>
    </div>
  );
}
