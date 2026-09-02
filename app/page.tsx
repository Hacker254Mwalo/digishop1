import Link from "next/link";
import { ArrowRight, BadgeCheck, BatteryCharging, CheckCircle2, Clock3, Laptop, MapPin, MessageCircle, Microscope, PhoneCall, ShieldCheck, Smartphone, Wrench } from "lucide-react";
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
              <span className="float-text"><strong>Trusted by design</strong><span>Simple intake, careful work</span></span>
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

      <section className="kicker-bar" aria-label="Digital Electronics benefits">
        <div className="container kicker-bar-inner">
          <div className="kicker-item"><Microscope size={22} /><div><strong>Diagnose before we repair</strong><span>Know what is wrong and why</span></div></div>
          <div className="kicker-item"><ShieldCheck size={22} /><div><strong>Service you can follow</strong><span>Get a ticket and clear stages</span></div></div>
          <div className="kicker-item"><MessageCircle size={22} /><div><strong>Talk to the desk directly</strong><span>Questions? We are one message away</span></div></div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading"><div className="eyebrow">What we do</div><h2>One dependable place for your everyday tech.</h2><p>Whether you need a fast part, a careful repair or a second opinion, the Digital Electronics desk keeps things practical and transparent.</p></div>
          <div className="service-grid">
            <article className="service-card"><div><div className="service-top"><span className="service-icon"><Smartphone size={22} /></span><span className="eyebrow">01</span></div><h3>Phone repairs</h3><p>Screen replacements, charging faults, battery changes, software issues and more for popular phone models.</p></div><Link href="/book?device=phone" className="service-link">Book phone service <ArrowRight size={15} /></Link></article>
            <article className="service-card"><div><div className="service-top"><span className="service-icon"><Laptop size={22} /></span><span className="eyebrow">02</span></div><h3>Laptop solutions</h3><p>Diagnostics, charging problems, keyboard issues, SSD upgrades and practical laptop support.</p></div><Link href="/book?device=laptop" className="service-link">Book laptop service <ArrowRight size={15} /></Link></article>
            <article className="service-card"><div><div className="service-top"><span className="service-icon"><Wrench size={22} /></span><span className="eyebrow">03</span></div><h3>Spares & accessories</h3><p>Source the screen, battery, port, charger or everyday accessory your device needs.</p></div><Link href="/shop" className="service-link">View the catalog <ArrowRight size={15} /></Link></article>
          </div>
        </div>
      </section>

      <section className="section split-section">
        <div className="container split-grid">
          <div className="split-copy"><div className="eyebrow">Why Digital Electronics</div><h2>Good repair starts with good communication.</h2><p>We designed every step around the questions customers actually have: Has my device been received? What is the fault? Is it being worked on? When can I collect it?</p><ul className="check-list"><li><CheckCircle2 size={17} /> Ticket number issued on intake</li><li><CheckCircle2 size={17} /> Status stages you can check online</li><li><CheckCircle2 size={17} /> WhatsApp-ready booking handover</li><li><CheckCircle2 size={17} /> Parts catalog with clear KES pricing</li></ul><Link href="/track" className="button button-primary" style={{ width: "fit-content" }}>Track a device <ArrowRight size={15} /></Link></div>
          <div className="image-collage"><div className="collage-image collage-small"><img src={gallery[1].src} alt={gallery[1].alt} /></div><div className="collage-image collage-large"><img src={gallery[2].src} alt={gallery[2].alt} /></div><div className="collage-caption"><MapPin size={17} color="#155eef" /><span><strong>Real people. Real counter.</strong> Visit us in Siaya for a direct conversation.</span></div></div>
        </div>
      </section>

      <section className="section">
        <div className="container"><div className="section-heading"><div className="eyebrow">Inside the shop</div><h2>See where your device is looked after.</h2><p>We are building a service experience that feels as trustworthy in person as it does online.</p></div><div className="gallery-grid">{gallery.map((item) => <article className="gallery-card" key={item.src}><img src={item.src} alt={item.alt} /><div className="gallery-content"><div className="eyebrow">{item.label}</div><h3>{item.title}</h3><p>{item.description}</p></div></article>)}</div></div>
      </section>

      <section className="section-tight cta-band" id="contact">
        <div className="container cta-grid"><div className="cta-copy"><div className="eyebrow" style={{ color: "#8dcaff" }}>Need help today?</div><h2>Bring the problem. We’ll help with the next step.</h2><p>Book a repair online, chat with the service desk or visit us in Siaya.</p></div><div className="cta-actions"><Link href="/book" className="button button-secondary">Book online <ArrowRight size={15} /></Link><a href={whatsappHref} className="button button-ghost"><MessageCircle size={15} /> WhatsApp</a><a href={callHref} className="button button-ghost"><PhoneCall size={15} /> Call</a></div></div>
      </section>
    </>
  );
}
