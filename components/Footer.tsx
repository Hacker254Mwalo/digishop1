import Link from "next/link";
import { Clock3, MapPin, MessageCircle } from "lucide-react";
import { site } from "@/lib/site";

export function Footer() {
  const whatsappHref = site.whatsappNumber
    ? `https://wa.me/${site.whatsappNumber.replace(/\D/g, "")}`
    : "/book";
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="brand">
              <span className="brand-mark">DE</span>
              <span>Digital Electronics</span>
            </Link>
            <p>{site.tagline} Local service, clear updates and practical parts support from our Siaya counter.</p>
            <a className="button button-secondary button-small" href={whatsappHref}>
              <MessageCircle size={14} /> Chat on WhatsApp
            </a>
          </div>
          <div>
            <div className="footer-title">Explore</div>
            <div className="footer-links">
              <Link href="/book">Book a repair</Link>
              <Link href="/track">Track a device</Link>
              <Link href="/shop">Spares & accessories</Link>
              <Link href="/contact">Location & hours</Link>
            </div>
          </div>
          <div>
            <div className="footer-title">Find us</div>
            <div className="footer-links">
              <span><MapPin size={12} style={{ verticalAlign: "-2px", marginRight: 5 }} />{site.address}</span>
              <span><Clock3 size={12} style={{ verticalAlign: "-2px", marginRight: 5 }} />Mon–Sat service desk</span>
              <span>{site.phoneDisplay}</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Digital Electronics. Built for Siaya.</span>
          <span>Clear service. Trusted hands. Better device days.</span>
        </div>
      </div>
    </footer>
  );
}
