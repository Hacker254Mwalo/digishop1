"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCheck, MessageCircle, ShieldCheck, Smartphone, Wrench } from "lucide-react";
import { createTicketNumber, demoTickets, getWhatsAppUrl, site, type Ticket } from "@/lib/site";

export default function BookPage() {
  const [deviceType, setDeviceType] = useState<"Phone" | "Laptop">("Phone");
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [fault, setFault] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const device = params.get("device");
    if (device === "laptop") setDeviceType("Laptop");
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!clientName.trim() || !phone.trim() || !fault.trim()) {
      setError("Please complete your name, phone number and fault description.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    const newTicket: Ticket = {
      ticket: createTicketNumber(),
      clientName: clientName.trim(),
      phone: phone.trim(),
      deviceType,
      fault: fault.trim(),
      status: "received",
      createdAt: new Date().toISOString(),
    };
    const stored = window.localStorage.getItem("de-tickets");
    const existing: Ticket[] = stored ? JSON.parse(stored) : [];
    window.localStorage.setItem("de-tickets", JSON.stringify([newTicket, ...existing]));
    setTicket(newTicket);
    const message = `Hello Digital Electronics, I would like to book a repair.\n\nTicket: ${newTicket.ticket}\nClient: ${newTicket.clientName}\nPhone: ${newTicket.phone}\nDevice: ${newTicket.deviceType}\nFault: ${newTicket.fault}\n\nPlease confirm the next step.`;
    window.setTimeout(() => {
      window.location.href = getWhatsAppUrl(message);
    }, 650);
  }

  return (
    <>
      <section className="page-hero"><div className="container page-hero-inner"><div className="page-hero-copy"><div className="eyebrow">Repair intake</div><h1>Start with a clear ticket.</h1><p>Tell us what your device is doing. We’ll issue a tracking number, then hand your details directly to the service desk on WhatsApp.</p></div><div className="page-hero-meta"><div className="meta-card"><ShieldCheck size={20} color="#155eef" /><strong>Clear from the first step</strong><span>Your ticket stays with you so you can follow progress from received to ready for pickup.</span></div></div></div></section>
      <section className="section"><div className="container form-layout"><form className="form-card" onSubmit={handleSubmit}><div className="form-card-header"><div className="eyebrow">Book online</div><h2>Repair details</h2><p>Share the basics. We’ll confirm the detailed quote after an in-person check.</p></div><div className="form-grid"><div className="field"><label htmlFor="client-name">Client name</label><input id="client-name" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Achieng Otieno" autoComplete="name" required /></div><div className="field"><label htmlFor="phone">Phone number</label><input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0712 345 678" inputMode="tel" autoComplete="tel" required /></div><div className="field field-full"><label>Device type</label><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><button type="button" className={`button ${deviceType === "Phone" ? "button-primary" : "button-ghost"}`} onClick={() => setDeviceType("Phone")}><Smartphone size={16} /> Phone</button><button type="button" className={`button ${deviceType === "Laptop" ? "button-primary" : "button-ghost"}`} onClick={() => setDeviceType("Laptop")}><Wrench size={16} /> Laptop</button></div></div><div className="field field-full"><label htmlFor="fault">Fault description</label><textarea id="fault" value={fault} onChange={(e) => setFault(e.target.value)} placeholder="Tell us what happened, what you have tried and whether the device powers on." required /></div></div>{error && <div className="form-error">{error}</div>}<div className="form-footer"><span className="form-note">No online payment is requested. A technician will confirm parts, pricing and timing.</span><button className="button button-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating ticket…" : "Create repair ticket"}<ArrowRight size={15} /></button></div>{ticket && <div className="success-card"><CheckCircle2 size={20} color="#159d69" /><h3>Ticket created</h3><div className="ticket-code">{ticket.ticket}</div><p style={{ fontSize: ".78rem", color: "#477563" }}>Your WhatsApp message is opening with these details. Keep this ticket number for tracking.</p><Link className="button button-secondary button-small" href={`/track?ticket=${ticket.ticket}`} style={{ width: "fit-content" }}>Open tracker <ArrowRight size={14} /></Link></div>}</form><aside className="side-stack"><div className="side-card"><ClipboardCheck size={22} color="#155eef" /><h3>What happens next?</h3><div className="side-list"><div className="side-list-item"><span className="step-dot" style={{ width: 24, height: 24, color: "#155eef", borderColor: "#c8daf3" }}>1</span><span><strong style={{ color: "#15233b" }}>We receive your request.</strong><br />Your ticket is created instantly.</span></div><div className="side-list-item"><span className="step-dot" style={{ width: 24, height: 24, color: "#155eef", borderColor: "#c8daf3" }}>2</span><span><strong style={{ color: "#15233b" }}>We diagnose the device.</strong><br />The service desk confirms the fault and next step.</span></div><div className="side-list-item"><span className="step-dot" style={{ width: 24, height: 24, color: "#155eef", borderColor: "#c8daf3" }}>3</span><span><strong style={{ color: "#15233b" }}>You collect with confidence.</strong><br />Track online or message us for the latest update.</span></div></div></div><div className="side-card" style={{ background: "#081a3a", color: "white", borderColor: "#081a3a" }}><MessageCircle size={22} color="#8dcaff" /><h3 style={{ color: "white" }}>Prefer a quick chat?</h3><p style={{ color: "#b8cce5" }}>Use the booking form to create a proper reference, or visit the service desk in Siaya during opening hours.</p><Link href="/contact" className="button button-secondary button-small" style={{ width: "fit-content" }}>See location <ArrowRight size={14} /></Link></div></aside></div></section>
    </>
  );
}
