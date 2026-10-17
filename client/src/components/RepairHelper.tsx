import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, Sparkles, Wrench } from "lucide-react";
import { useState } from "react";

type DeviceType = "phone" | "laptop" | "electronics";

export default function RepairHelper({ deviceType, brand, model, issue, onApply }: { deviceType: DeviceType; brand: string; model: string; issue: string; onApply: (summary: string, priority: "low" | "normal" | "high" | "urgent") => void }) {
  const [result, setResult] = useState<Awaited<ReturnType<typeof trpc.public.repairHelper.useMutation>>["data"]>(undefined);
  const helper = trpc.public.repairHelper.useMutation({ onSuccess: response => { setResult(response); onApply(response.summary, response.suggestedPriority); } });
  const ready = brand.trim().length > 0 && model.trim().length > 0 && issue.trim().length >= 5;
  return <div className="mt-5 rounded-2xl border border-[#d9d2c8] bg-[#fffaf4] p-4">
    <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#fbe7dc] text-[#d94b2b]"><Sparkles className="h-4 w-4" /></span><div><p className="text-sm font-extrabold text-[#202a30]">Need help describing the problem?</p><p className="mt-1 text-xs leading-5 text-[#69747b]">The assistant can organise your symptoms and suggest the next safe step. It does not replace a technician’s inspection.</p></div></div>
    <Button type="button" variant="outline" size="sm" className="mt-4 border-[#d94b2b]/30 bg-white text-[#b53d25] hover:bg-[#fff1e7]" disabled={!ready || helper.isPending} onClick={() => helper.mutate({ deviceType, brand, model, issue })}>{helper.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wrench className="mr-2 h-4 w-4" />} {helper.isPending ? "Reviewing the symptoms…" : "Help me organise this"}</Button>
    {result && <div className="mt-4 space-y-3 rounded-xl border border-[#d9d2c8] bg-white p-3"><p className="text-sm leading-6 text-[#39464d]">{result.summary}</p><p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#d94b2b]">Useful questions for the service desk</p><ul className="space-y-1 text-xs leading-5 text-[#69747b]">{result.questions.map(question => <li key={question}>• {question}</li>)}</ul><p className="text-[11px] text-[#899196]">{result.aiPowered ? "AI-assisted intake · please confirm the details before sending" : "Smart intake guidance · final advice comes from the service desk"}</p></div>}
    {helper.error && <p className="mt-3 text-xs text-[#a24b2d]">The helper is unavailable, but you can still send your request normally.</p>}
  </div>;
}
