import Link from "next/link";
import { ArrowUpRight, Clock3, MapPin, MessageCircle } from "lucide-react";
import { normalizeKenyanNumber, site } from "@/lib/site";

export function Footer() {
  const whatsappHref = site.whatsappNumber
    ? `https://wa.me/${normalizeKenyanNumber(site.whatsappNumber)}`
    : "/book";
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="brand footer-brand-lockup" aria-label="Digital Electronics home">
              <span className="brand-mark" aria-hidden="true">DE</span>
              <span className="brand-copy"><strong>Digital</strong><span>Electronics</span></span>
            </Link>
            <p>Device repair, tested spares and practical technical support for people, teams and businesses across Kenya.</p>
            <a className="button button-secondary button-small" href={whatsappHref}>
              <MessageCircle size={14} /> Chat with the team <ArrowUpRight size={14} />
            </a>
          </div>
          <div>
            <div className="footer-title">Customer care</div>
            <div className="footer-links">
              <Link href="/book">Book a repair</Link>
              <Link href="/track">Track a device</Link>
              <Link href="/shop">Browse spares</Link>
              <Link href="/contact">Location & hours</Link>
            </div>
          </div>
          <div>
            <div className="footer-title">Digital Electronics, Siaya</div>
            <div className="footer-links">
              <span><MapPin size={12} style={{ verticalAlign: "-2px", marginRight: 5 }} />{site.address}</span>
              <span><Clock3 size={12} style={{ verticalAlign: "-2px", marginRight: 5 }} />Mon–Sat service hours</span>
              <span>{site.phoneDisplay}</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Digital Electronics. All rights reserved.</span>
          <span>Professional device care, connected to Siaya.</span>
        </div>
      </div>
    </footer>
  );
}
