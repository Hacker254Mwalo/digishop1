import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Bot, Loader2, Send, Sparkles } from "lucide-react";
import { useState } from "react";

const prompts = ["Which products need restocking?", "Summarise active repairs", "Which orders need follow-up?"];

export default function AdminCopilot() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<{ text: string; aiPowered: boolean } | null>(null);
  const mutation = trpc.admin.copilot.useMutation({ onSuccess: result => { setAnswer({ text: result.answer, aiPowered: result.aiPowered }); setQuestion(""); } });
  const ask = (value = question) => { const trimmed = value.trim(); if (trimmed && !mutation.isPending) mutation.mutate({ question: trimmed }); };
  return <section className="premium-panel premium-panel-hover rounded-3xl p-6"><div className="flex items-start justify-between gap-4"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-300/10 text-violet-200"><Bot className="h-5 w-5" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-200">Owner assistant</p><h2 className="mt-2 text-xl font-semibold">Ask what needs attention.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Read-only help for stock, repairs and orders. It cannot change records.</p></div></div><Sparkles className="h-5 w-5 text-violet-200/60" /></div><div className="mt-5 flex flex-wrap gap-2">{prompts.map(prompt => <button key={prompt} type="button" onClick={() => { setQuestion(prompt); ask(prompt); }} className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-violet-300/30 hover:text-violet-100">{prompt}</button>)}</div><div className="mt-4 flex flex-col gap-3 sm:flex-row"><Textarea value={question} onChange={event => setQuestion(event.target.value)} placeholder="Ask about stock, repairs or orders…" className="min-h-20 resize-none" aria-label="Ask the owner assistant" /><Button className="shrink-0 sm:self-end" onClick={() => ask()} disabled={!question.trim() || mutation.isPending}>{mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Ask assistant</Button></div>{answer && <div className="mt-4 rounded-2xl border border-violet-300/15 bg-violet-300/[0.06] p-4"><p className="text-sm leading-6 text-slate-200">{answer.text}</p><p className="mt-3 text-[11px] text-slate-500">{answer.aiPowered ? "AI-assisted · based on current operational records" : "Smart fallback · based on current operational records"}</p></div>}{mutation.error && <p className="mt-3 text-xs text-amber-200">The assistant could not complete that request. The normal admin queues are still available.</p>}</section>;
}
