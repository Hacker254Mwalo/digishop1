import Link from "next/link";
import { ArrowRight, ArrowUpRight, BadgeCheck, BatteryCharging, CheckCircle2, Clock3, Laptop, MessageCircle, Microscope, PhoneCall, ShieldCheck, Smartphone, Wrench } from "lucide-react";
import { gallery, normalizeKenyanNumber, site } from "@/lib/site";

const callHref = site.phoneHref ? `tel:${site.phoneHref}` : "#contact";
const whatsappHref = site.whatsappNumber ? `https://wa.me/${normalizeKenyanNumber(site.whatsappNumber)}` : "/book";

const faqs = [
  {
    question: "What devices does Digital Electronics repair?",
    answer: "We work with common smartphones and laptops, including screen, battery, charging, software, keyboard and storage-related faults. Share the device and problem first so the team can confirm the right next step.",
  },
  {
    question: "Can I order a spare part before visiting the shop?",
    answer: "Yes. Browse the spares catalog, add the part to your order and send the details through WhatsApp. We confirm model compatibility, stock, price and collection or delivery before fulfillment.",
  },
  {
    question: "How does the digital repair ticket work?",
    answer: "A repair request creates a unique DE ticket. Keep that number, use it on the tracker and message the team on WhatsApp when you need an update. Diagnostics come before any repair work or final price confirmation.",
  },
  {
    question: "Where can I find Digital Electronics?",
    answer: "Digital Electronics is in Siaya Town, Siaya County, Kenya. The exterior sign is the landmark. Visit the location page for the map, operating hours, directions and the verified phone contact.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="hero hero-premium">
        <div className="hero-orbit hero-orbit-one" aria-hidden="true" />
        <div className="hero-orbit hero-orbit-two" aria-hidden="true" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow eyebrow-light"><span className="eyebrow-rule" /> Digital Electronics / Siaya, Kenya</div>
            <h1>Technology should <span>keep moving.</span></h1>
            <p className="hero-lead">A considered repair, parts and support experience for the devices people rely on every day.</p>
            <p className="hero-detail">From a cracked screen to a laptop that will not charge, start digitally and arrive with the right information already in hand.</p>
            <div className="hero-actions">
              <Link href="/book" className="button button-primary">Start a repair <ArrowRight size={16} /></Link>
              <Link href="/shop" className="button button-hero-ghost">Explore spares <ArrowUpRight size={15} /></Link>
            </div>
            <div className="hero-proof-strip" aria-label="Digital Electronics service principles">
              <div><strong>01</strong><span>Diagnose first</span></div>
              <div><strong>02</strong><span>Keep it visible</span></div>
              <div><strong>03</strong><span>Return it ready</span></div>
            </div>
            <div className="hero-contact" aria-label="Contact Digital Electronics">
              <a href={callHref}><PhoneCall size={14} /> {site.phoneDisplay}</a>
              <span className="hero-contact-divider">/</span>
              <a href={whatsappHref}><MessageCircle size={14} /> Start a WhatsApp chat</a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-visual-meta"><span>01 / 03</span><span>Field note / Siaya</span></div>
            <figure className="hero-photo-wrap">
              <img className="hero-photo" src={gallery[0].src} alt={gallery[0].alt} />
              <figcaption><span className="caption-line" /><span>One address for repair, parts and progress.</span></figcaption>
            </figure>
            <div className="hero-float hero-float-top">
              <span className="float-icon"><BadgeCheck size={18} /></span>
              <span className="float-text"><strong>Clear from intake</strong><span>One ticket. One next step.</span></span>
            </div>
            <div className="hero-float hero-float-bottom">
              <span className="float-icon"><Clock3 size={18} /></span>
              <span className="float-text"><strong>Track the work</strong><span>Updates stay with you.</span></span>
            </div>
          </div>
        </div>
      </section>

      <section className="signal-band" aria-label="Digital Electronics service coverage">
        <div className="container signal-band-inner">
          <span className="signal-label">One connected service</span>
          <div className="signal-items"><span>Repairs</span><i /> <span>Replacement parts</span><i /> <span>Accessories</span><i /> <span>Laptop support</span></div>
          <Link href="/contact" className="signal-link">Find the location <ArrowUpRight size={14} /></Link>
        </div>
      </section>

      <section className="section intro-section">
        <div className="container intro-grid">
          <div className="section-heading intro-heading"><div className="eyebrow">Built around the way people use technology</div><h2>The shop, made digital.</h2><p>Digital Electronics brings the confidence of a real service counter into a clearer online experience. Start a repair, find a part, follow a ticket or talk to the team without losing the human detail that matters.</p><Link href="/book" className="text-link">Tell us what needs attention <ArrowRight size={15} /></Link></div>
          <div className="intro-panel"><div className="intro-panel-top"><span className="panel-kicker">DE / 2026</span><BatteryCharging size={20} /></div><div className="intro-metric">Every device has a next step.</div><p>We make that next step easier to see — from first message to final handover.</p><div className="intro-panel-line"><span /> <span /> <span /> <span /></div><div className="intro-panel-foot"><span>Phone</span><span>Laptop</span><span>Parts</span></div></div>
        </div>
      </section>

      <section className="section service-section" id="services">
        <div className="container">
          <div className="section-heading section-heading-wide"><div className="eyebrow">What we take care of</div><h2>Three ways to move forward.</h2><p>Whether you need a repair, a replacement part or a more reliable setup, the same standard follows the work: clear information, careful checks and a practical next step.</p></div>
          <div className="service-grid service-grid-premium">
            <article className="service-card"><div><div className="service-top"><span className="service-icon"><Smartphone size={22} /></span><span className="service-index">01 / Repair</span></div><h3>Phone repair</h3><p>Screen replacement, charging faults, battery changes, software issues and everyday smartphone problems handled with a proper intake and diagnosis.</p></div><Link href="/book?device=phone" className="service-link">Book phone service <ArrowRight size={15} /></Link></article>
            <article className="service-card"><div><div className="service-top"><span className="service-icon"><Laptop size={22} /></span><span className="service-index">02 / Support</span></div><h3>Laptop solutions</h3><p>Diagnostics, charging problems, keyboard issues, storage upgrades and practical laptop support for work, study and home.</p></div><Link href="/book?device=laptop" className="service-link">Book laptop service <ArrowRight size={15} /></Link></article>
            <article className="service-card"><div><div className="service-top"><span className="service-icon"><Wrench size={22} /></span><span className="service-index">03 / Supply</span></div><h3>Spares & accessories</h3><p>Browse phone screens, charging ports, batteries, laptop spares and useful accessories. Ask the team to confirm fit before you order.</p></div><Link href="/shop" className="service-link">Open the catalog <ArrowRight size={15} /></Link></article>
          </div>
        </div>
      </section>

      <section className="section split-section process-section">
        <div className="container split-grid">
          <div className="split-copy"><div className="eyebrow">A better service signal</div><h2>Less guessing. More visibility.</h2><p>The digital flow is designed to reduce back-and-forth, not replace the people doing the work. Put the fault in writing, keep the ticket close and know what stage comes next.</p><ul className="check-list"><li><CheckCircle2 size={17} /> A reference number created at intake</li><li><CheckCircle2 size={17} /> Diagnostics before parts or repair work</li><li><CheckCircle2 size={17} /> Updates that move through WhatsApp</li><li><CheckCircle2 size={17} /> Pricing and fit discussed in clear terms</li></ul><Link href="/track" className="button button-dark" style={{ width: "fit-content" }}>Track a device <ArrowRight size={15} /></Link></div>
          <div className="service-standard-panel process-panel"><div className="standard-panel-header"><span className="float-icon"><Microscope size={18} /></span><div><div className="eyebrow">The service sequence</div><h3>A digital thread from fault to handover.</h3></div></div><div className="standard-row"><span className="standard-number">01</span><div><strong>Describe the device</strong><span>Tell us the model, the fault and what changed. The first message is already useful.</span></div></div><div className="standard-row"><span className="standard-number">02</span><div><strong>See the current stage</strong><span>Use your DE ticket to follow received, diagnostics, repair and ready for pickup.</span></div></div><div className="standard-row"><span className="standard-number">03</span><div><strong>Make the next decision</strong><span>We confirm compatibility, parts, timing and collection before work moves ahead.</span></div></div></div>
        </div>
      </section>

      <section className="section gallery-section">
        <div className="container"><div className="section-heading section-heading-wide"><div className="eyebrow">Real place. Digital access.</div><h2>See the standard behind the screen.</h2><p>The storefront, technician counter and parts display are real. The digital layer simply makes it easier to arrive prepared.</p></div><div className="gallery-grid">{gallery.map((item) => <article className="gallery-card" key={item.src}><img src={item.src} alt={item.alt} /><div className="gallery-content"><div className="eyebrow">{item.label}</div><h3>{item.title}</h3><p>{item.description}</p></div></article>)}</div></div>
      </section>

      <section className="section faq-section" id="faq">
        <div className="container faq-grid"><div className="section-heading"><div className="eyebrow">Useful before you start</div><h2>Clear answers, before the first message.</h2><p>Good service begins before the device arrives. These are the details customers usually want to know about repair, spares and visiting Digital Electronics in Siaya.</p><Link href="/contact" className="text-link">Contact the team directly <ArrowRight size={15} /></Link></div><div className="faq-list">{faqs.map((item) => <details className="faq-item" key={item.question}><summary>{item.question}<span>+</span></summary><p>{item.answer}</p></details>)}</div></div>
      </section>

      <section className="section-tight cta-band" id="contact">
        <div className="container cta-grid"><div className="cta-copy"><div className="eyebrow eyebrow-light">Your next step is digital</div><h2>Bring better information to the repair.</h2><p>Start online, order a part or visit the Digital Electronics location in Siaya. The team will take it from there.</p></div><div className="cta-actions"><Link href="/book" className="button button-secondary">Start a repair <ArrowRight size={15} /></Link><a href={whatsappHref} className="button button-ghost"><MessageCircle size={15} /> WhatsApp</a><a href={callHref} className="button button-ghost"><PhoneCall size={15} /> Call</a></div></div>
      </section>
    </>
  );
}
