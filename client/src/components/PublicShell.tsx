import { ArrowUpRight, Clock3, Menu, MessageCircle, Phone, ShieldCheck, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/repair", label: "Repair services" },
  { href: "/repair-status", label: "Track my repair" },
  { href: "/spares", label: "Parts & accessories" },
  { href: "/account", label: "My account" },
];

const phoneHref = "tel:+254718114009";
const whatsAppHref = "https://wa.me/254718114009?text=Hello%20Digital%20Phone%20Hub%2C%20I%20need%20help%20with%20a%20repair%20or%20part.";

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <span className={`grid ${compact ? "h-9 w-9 rounded-xl" : "h-10 w-10 rounded-2xl"} shrink-0 place-items-center overflow-hidden bg-[#d94b2b]`}>
        <img src="/brand/icon.svg" alt="" aria-hidden="true" className="h-full w-full object-cover" />
      </span>
      <span className="leading-tight">
        <strong className={`${compact ? "text-sm" : "text-[15px]"} block font-extrabold tracking-[-0.03em] text-[#202a30]`}>Digital Phone Hub</strong>
        <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.2em] text-[#b53d25]">Repair & Electronics</span>
      </span>
    </span>
  );
}

export default function PublicShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const currentPath = location.split("?")[0];
  const isActive = (href: string) => href === "/" ? currentPath === "/" : currentPath === href || currentPath.startsWith(`${href}/`);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="min-h-screen bg-[#f6f3ee] text-[#202a30] selection:bg-[#f6c36a]/60 selection:text-[#202a30]">
      <a href="#main-content" className="sr-only z-50 rounded-md bg-white px-4 py-3 font-bold text-[#202a30] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:ring-2 focus:ring-[#d94b2b]">
        Skip to main content
      </a>
      <div className="hidden border-b border-[#d9d2c8] bg-white text-[11px] text-[#56636a] sm:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
          <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#28766b]" />Phone, laptop and electronics care in Siaya Town</span>
          <span className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5 text-[#b53d25]" />Mon–Sat · 8:00–18:00</span>
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b border-[#d9d2c8] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b53d25]" onClick={() => setOpen(false)} aria-label="Digital Phone Hub home">
            <BrandMark />
          </Link>
          <nav className="hidden items-center gap-1 rounded-full border border-[#d9d2c8] bg-[#f6f3ee] p-1 text-sm lg:flex" aria-label="Primary navigation">
            {navItems.map(item => <Link key={item.href} href={item.href} className={`rounded-full px-4 py-2 transition-colors ${isActive(item.href) ? "bg-[#202a30] font-semibold text-white" : "text-[#56636a] hover:bg-white hover:text-[#202a30]"}`} aria-current={isActive(item.href) ? "page" : undefined}>{item.label}</Link>)}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/spares" className="hidden items-center gap-2 rounded-full border border-[#d94b2b]/25 bg-[#fff1e7] px-3 py-2 text-xs font-bold text-[#a93823] transition hover:border-[#d94b2b]/50 hover:bg-[#fbe7dc] sm:flex">Parts desk</Link>
            <a href={whatsAppHref} target="_blank" rel="noopener noreferrer" className="hidden items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-[#56636a] transition hover:bg-[#f6f3ee] hover:text-[#202a30] md:flex"><MessageCircle className="h-3.5 w-3.5 text-[#28766b]" />WhatsApp</a>
            <a href={phoneHref} className="hidden items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-[#56636a] transition hover:bg-[#f6f3ee] hover:text-[#202a30] sm:flex"><Phone className="h-3.5 w-3.5 text-[#b53d25]" />0718 114 009</a>
            <Link href="/repair" className="hidden items-center gap-2 rounded-full bg-[#d94b2b] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#b53d25] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#b53d25] sm:flex">Book a repair <ArrowUpRight className="h-3.5 w-3.5" /></Link>
            <button type="button" className="grid h-10 w-10 place-items-center rounded-full border border-[#cfc5b8] text-[#202a30] transition hover:border-[#d94b2b]/50 hover:bg-[#f6f3ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b53d25] lg:hidden" onClick={() => setOpen(value => !value)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-primary-navigation">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {open && <nav id="mobile-primary-navigation" className="border-t border-[#d9d2c8] bg-white px-4 py-4 shadow-xl lg:hidden" aria-label="Mobile navigation"><div className="mx-auto grid max-w-7xl gap-2 text-sm">{navItems.map(item => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`rounded-xl px-3 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b53d25] ${isActive(item.href) ? "bg-[#fff1e7] font-semibold text-[#a93823]" : "text-[#46535a] hover:bg-[#f6f3ee] hover:text-[#202a30]"}`} aria-current={isActive(item.href) ? "page" : undefined}>{item.label}</Link>)}<a href={phoneHref} className="mt-2 flex items-center justify-between rounded-xl border border-[#d94b2b]/20 bg-[#fff1e7] px-3 py-3 font-semibold text-[#a93823]"><span>Talk to the service desk</span><span className="flex items-center gap-2 text-xs"><Phone className="h-3.5 w-3.5" />0718 114 009</span></a></div></nav>}
      </header>
      {children}
      <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] z-30 grid grid-cols-3 gap-2 rounded-2xl border border-[#d9d2c8] bg-white/95 p-2 shadow-xl backdrop-blur-xl sm:hidden">
        <a href={phoneHref} className="flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-bold text-[#46535a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b53d25]"><Phone className="h-4 w-4 text-[#b53d25]" />Call</a>
        <a href={whatsAppHref} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 rounded-xl bg-[#e4f3ed] py-2 text-[10px] font-bold text-[#205c52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28766b]"><MessageCircle className="h-4 w-4" />WhatsApp</a>
        <Link href="/repair" className="flex flex-col items-center gap-1 rounded-xl bg-[#d94b2b] py-2 text-[10px] font-extrabold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#b53d25]"><ArrowUpRight className="h-4 w-4" />Book repair</Link>
      </div>
      <footer className="border-t border-white/10 bg-[#202a30] text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 sm:p-8 lg:p-10">
            <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[#d94b2b]/20 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#f6c36a]">Digital Phone Hub · Siaya</p><h2 className="mt-3 max-w-xl text-2xl font-extrabold tracking-[-.04em] text-white sm:text-3xl">Start with the problem. Leave with a clear next step.</h2><p className="mt-3 max-w-lg text-sm leading-6 text-[#e0e5e6]">Share the device and issue with the service desk. We check first and confirm the repair plan before work begins.</p></div>
              <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row"><Link href="/repair" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d94b2b] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#b53d25] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#202a30] focus-visible:ring-white">Book a repair <ArrowUpRight className="h-4 w-4" /></Link><a href={phoneHref} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"><Phone className="h-4 w-4 text-[#f6c36a]" />Call the desk</a></div>
            </div>
          </div>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            <div><Link href="/" className="inline-flex rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><BrandMark compact /></Link><p className="mt-4 max-w-sm text-sm leading-6 text-[#d0d8da]">Local phone, laptop and electronics care from Digital Phone Hub in Siaya Town.</p></div>
            <div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#f6c36a]">Customer care</p><div className="mt-4 grid gap-3 text-sm text-[#e0e5e6]"><Link className="transition hover:text-white" href="/repair">Book a repair</Link><Link className="transition hover:text-white" href="/repair-status">Track a repair</Link><Link className="transition hover:text-white" href="/spares">Ask about parts</Link><Link className="transition hover:text-white" href="/account">Optional customer account</Link></div></div>
            <div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#f6c36a]">Service desk</p><div className="mt-4 grid gap-3 text-sm text-[#e0e5e6]"><span>Siaya Town, Siaya County</span><a className="transition hover:text-white" href={phoneHref}>0718 114 009</a><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#79d5c4]" />Approval before repair</span></div></div>
          </div>
        </div>
        <div className="border-t border-white/10 px-4 py-5 pb-24 text-center text-xs text-[#d0d8da] sm:pb-5">© {new Date().getFullYear()} Digital Phone Hub Repair & Electronics</div>
      </footer>
    </div>
  );
}
