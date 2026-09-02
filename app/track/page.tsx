"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, Search, ShieldCheck } from "lucide-react";
import { demoTickets, statusSteps, type Ticket } from "@/lib/site";

function getStoredTickets(): Ticket[] {
  try {
    const stored = window.localStorage.getItem("de-tickets");
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function TrackPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Ticket | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const ticketParam = new URLSearchParams(window.location.search).get("ticket");
    if (ticketParam) {
      setQuery(ticketParam);
      lookup(ticketParam);
    }
  }, []);

  function lookup(value = query) {
    const normalized = value.trim().toUpperCase();
    const found = [...getStoredTickets(), ...demoTickets].find((item) => item.ticket.toUpperCase() === normalized);
    setResult(found || null);
    setSearched(true);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    lookup();
  }

  const activeIndex = result ? statusSteps.findIndex((step) => step.id === result.status) : -1;

  return (
    <>
      <section className="page-hero page-hero-blueprint"><div className="container page-hero-inner"><div className="page-hero-copy"><div className="eyebrow">Repair visibility / one live thread</div><h1>Track the work, not just the promise.</h1><p>Enter the repair reference from your booking confirmation and see the current stage of the device journey.</p></div><div className="page-hero-meta"><div className="meta-card"><ShieldCheck size={20} color="#155eef" /><strong>Your reference is the thread</strong><span>Received, diagnostics, repair and ready for pickup — each stage has a clear place in the journey.</span></div></div></div></section>
      <section className="section"><div className="container tracker-wrap"><form className="tracker-search" onSubmit={handleSubmit}><Search size={18} color="#8ca0ba" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter repair reference e.g. DPH-REP-1049" aria-label="Repair reference" /><button className="button button-primary" type="submit">View status</button></form>{searched && !result && <div className="tracker-result empty-state" role="status"><h3>That reference was not found</h3><p>Check the number and try again. If the team sent you a different reference, use that exact code.</p></div>}{result && <div className="tracker-result" role="status" aria-live="polite"><div className="tracker-result-header"><div className="ticket-label"><span>Repair reference</span><h2>{result.ticket}</h2><span>{result.deviceType} · {result.fault}</span></div><div className="tracker-badge">{statusSteps[activeIndex]?.label}</div></div><div className="tracker-steps">{statusSteps.map((step, index) => <div className={`tracker-step ${index < activeIndex ? "complete" : ""} ${index === activeIndex ? "active" : ""}`} key={step.id}><div className="step-dot">{index < activeIndex ? <Check size={15} /> : index === activeIndex ? <span style={{ width: 8, height: 8, background: "white", borderRadius: "50%" }} /> : index + 1}</div><strong>{step.label}</strong><span>{index === activeIndex ? step.short : index < activeIndex ? "Completed" : "Up next"}</span></div>)}</div><div style={{ marginTop: 30, padding: "14px 16px", background: "#f6f9fc", borderRadius: 12, color: "#66758c", fontSize: ".78rem" }}>Reference holder: <strong style={{ color: "#15233b" }}>{result.clientName}</strong> · For the latest team update, continue the conversation on WhatsApp.</div></div>}{!searched && <div className="demo-note">See how it works with a sample reference: <button type="button" onClick={() => { setQuery("DPH-REP-1049"); lookup("DPH-REP-1049"); }} style={{ border: 0, background: "transparent", padding: 0, color: "#155eef", fontWeight: 700 }}>DPH-REP-1049</button></div>}</div></section>
    </>
  );
}
