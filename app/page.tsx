import Link from "next/link";
import { ArrowRight, BadgeCheck, CheckCircle2, Clock3, Laptop, MessageCircle, Microscope, PhoneCall, ShieldCheck, Smartphone, Wrench } from "lucide-react";
import { gallery, site } from "@/lib/site";

const callHref = site.phoneHref ? `tel:${site.phoneHref}` : "#contact";
const whatsappHref = site.whatsappNumber ? `https://wa.me/${site.whatsappNumber.replace(/\D/g, "")}` : "/book";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">Siaya’s device care desk</div>
            <h1>Local service.<br /><span>Properly done.</span></h1>
            <p>{site.tagline} From a cracked screen to a slow laptop, we make the next step clear.</p>
            <div className="hero-actions">
              <Link href="/book" className="button button-primary">Book a repair <ArrowRight size={16} /></Link>
              <Link href="/shop" className="button button-ghost">Browse spares</Link>
            </div>
            <div className="trust-line" aria-label="Service promises">
              <span className="trust-point"><span className="trust-dot" /> Clear updates</span>
              <span className="trust-point"><span className="trust-dot" /> Parts support</span>
              <span className="trust-point"><span className="trust-dot" /> Siaya-based</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-float hero-float-top">
              <span className="float-icon"><BadgeCheck size={18} /></span>
              <span className="float-text"><strong>Service desk</strong><span>Clear intake, careful work</span></span>
            </div>
            <div className="hero-photo-wrap">
              <img className="hero-photo hero-photo-sign" src={gallery[0].src} alt={gallery[0].alt} />
            </div>
            <div className="hero-float hero-float-bottom">
              <span className="float-icon"><Clock3 size={18} /></span>
              <span className="float-text"><strong>Track your repair</strong><span>Use your DE ticket anytime</span></span>
            </div>
          </div>
        </div>
      </section>

      <section className="kicker-bar" aria-label="Quick service actions">
        <div className="container kicker-bar-inner">
          <Link className="kicker-item kicker-link" href="/book"><Microscope size={22} /><div><strong>Book a repair</strong><span>Start with your device details</span></div><ArrowRight size={15} /></Link>
          <Link className="kicker-item kicker-link" href="/track"><ShieldCheck size={22} /><div><strong>Track a repair</strong><span>Use your ticket number anytime</span></div><ArrowRight size={15} /></Link>
          <Link className="kicker-item kicker-link" href="/shop"><MessageCircle size={22} /><div><strong>Shop spares</strong><span>Ask about parts and availability</span></div><ArrowRight size={15} /></Link>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading"><div className="eyebrow">What we do</div><h2>Phone, laptop and parts service — in one place.</h2><p>Bring us the device, fault or part you need. We’ll give you a clear next step and practical support from the Digital Electronics counter in Siaya.</p></div>
          <div className="service-grid">
            <article className="service-card"><div><div className="service-top"><span className="service-icon"><Smartphone size={22} /></span><span className="eyebrow">01</span></div><h3>Phone repairs</h3><p>Screen replacements, charging faults, battery changes, software issues and more for popular phone models.</p></div><Link href="/book?device=phone" className="service-link">Book phone service <ArrowRight size={15} /></Link></article>
            <article className="service-card"><div><div className="service-top"><span className="service-icon"><Laptop size={22} /></span><span className="eyebrow">02</span></div><h3>Laptop solutions</h3><p>Diagnostics, charging problems, keyboard issues, SSD upgrades and practical laptop support.</p></div><Link href="/book?device=laptop" className="service-link">Book laptop service <ArrowRight size={15} /></Link></article>
            <article className="service-card"><div><div className="service-top"><span className="service-icon"><Wrench size={22} /></span><span className="eyebrow">03</span></div><h3>Spares & accessories</h3><p>Source the screen, battery, port, charger or everyday accessory your device needs.</p></div><Link href="/shop" className="service-link">View the catalog <ArrowRight size={15} /></Link></article>
          </div>
        </div>
      </section>

      <section className="section split-section">
        <div className="container split-grid">
          <div className="split-copy"><div className="eyebrow">Our service standard</div><h2>A repair process you can follow.</h2><p>From intake to collection, we keep the important details visible so you know what is happening with your device.</p><ul className="check-list"><li><CheckCircle2 size={17} /> Ticket number issued at intake</li><li><CheckCircle2 size={17} /> Diagnostics before repair work</li><li><CheckCircle2 size={17} /> Clear updates through WhatsApp</li><li><CheckCircle2 size={17} /> Parts and pricing shown in KES</li></ul><Link href="/track" className="button button-primary" style={{ width: "fit-content" }}>Track a device <ArrowRight size={15} /></Link></div>
          <div className="service-standard-panel"><div className="standard-panel-header"><span className="float-icon"><ShieldCheck size={18} /></span><div><div className="eyebrow">At the counter</div><h3>Simple, accountable service</h3></div></div><div className="standard-row"><span className="standard-number">01</span><div><strong>We record the fault</strong><span>Device details and the reported problem are captured at intake.</span></div></div><div className="standard-row"><span className="standard-number">02</span><div><strong>We confirm the next step</strong><span>Diagnostics come before parts, pricing or repair work.</span></div></div><div className="standard-row"><span className="standard-number">03</span><div><strong>We keep you updated</strong><span>Use your ticket online or message the service desk.</span></div></div></div>
        </div>
      </section>

      <section className="section">
        <div className="container"><div className="section-heading"><div className="eyebrow">Visit the counter</div><h2>Know the place before you arrive.</h2><p>These are the Digital Electronics counters and storefront customers will see in Siaya.</p></div><div className="gallery-grid">{gallery.map((item) => <article className="gallery-card" key={item.src}><img src={item.src} alt={item.alt} /><div className="gallery-content"><div className="eyebrow">{item.label}</div><h3>{item.title}</h3><p>{item.description}</p></div></article>)}</div></div>
      </section>

      <section className="section-tight cta-band" id="contact">
        <div className="container cta-grid"><div className="cta-copy"><div className="eyebrow" style={{ color: "#8dcaff" }}>Need help today?</div><h2>Let’s get your device working again.</h2><p>Book a repair online, check a ticket, order a part or visit the Digital Electronics counter in Siaya.</p></div><div className="cta-actions"><Link href="/book" className="button button-secondary">Book online <ArrowRight size={15} /></Link><a href={whatsappHref} className="button button-ghost"><MessageCircle size={15} /> WhatsApp</a><a href={callHref} className="button button-ghost"><PhoneCall size={15} /> Call</a></div></div>
      </section>
    </>
  );
}
