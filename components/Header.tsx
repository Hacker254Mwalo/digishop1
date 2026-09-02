import Link from "next/link";
import { ArrowUpRight, PhoneCall } from "lucide-react";
import { site } from "@/lib/site";

export function Header() {
  const callHref = site.phoneHref ? `tel:${site.phoneHref}` : "/contact#contact-details";
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="Digital Phone Hub Repair & Electronics home">
          <span className="brand-mark" aria-hidden="true">DPH</span>
          <span className="brand-copy"><strong>Digital Phone Hub</strong><span>Repair & Electronics</span></span>
        </Link>
        <nav className="nav" aria-label="Main navigation">
          <Link className="nav-link" href="/">Home</Link>
          <Link className="nav-link" href="/book">Book a repair</Link>
          <Link className="nav-link" href="/track">Track device</Link>
          <Link className="nav-link" href="/shop">Shop spares</Link>
          <Link className="nav-link" href="/contact">Visit us</Link>
        </nav>
        <div className="header-actions">
          <a className="header-phone" href={callHref} aria-label={`Call Digital Phone Hub Repair & Electronics on ${site.phoneDisplay}`}>
            <PhoneCall size={15} /> <span>{site.phoneDisplay}</span>
          </a>
          <Link className="button button-primary" href="/book">
            Start a repair <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </header>
  );
}
