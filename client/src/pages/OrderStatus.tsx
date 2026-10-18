import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, Clock3, Loader2, Phone, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import PublicShell from "@/components/PublicShell";
import { trpc } from "@/lib/trpc";
import { getOrCreateSubmissionId, startNewSubmission } from "@/lib/requestTokens";

const orderReferencePattern = /^DPH-ORD-[A-F0-9]{24}$/;
const orderStatusHandoffKey = "dph-order-status-reference";
const paymentKeyFor = (reference: string) => `dph-mpesa-${reference}`;
const paymentResultKeyFor = (reference: string) => `dph-mpesa-result-${reference}`;

function orderStage(status: string, hasConfirmedTotal: boolean) {
  if (status === "new") return "The service desk is reviewing this request. Payment is not due yet.";
  if (status === "confirmed") return hasConfirmedTotal ? "The service desk confirmed this request. Review the final total below before choosing to pay." : "The request has been reviewed, but its final payable total or item availability is not confirmed yet.";
  if (status === "fulfilled") return "This request is marked fulfilled. Contact the service desk if you need help with it.";
  if (status === "cancelled") return "This request is cancelled. Contact the service desk if you think this is incorrect.";
  return "The current order stage is being checked.";
}

function paymentMessage(status: string) {
  if (status === "paid") return "Safaricom confirmed the payment and the shop saved the result.";
  if (status === "pending" || status === "initiating") return "A payment prompt is in progress. Check the phone you used for the item request and approve it there. An accepted prompt is not yet a receipt.";
  if (status === "failed") return "M-PESA did not complete this attempt. You may retry, or contact the service desk.";
  if (status === "review") return "The provider response needs service-desk review. Do not start another prompt; contact the shop with this reference.";
  if (status === "rate_limited") return "Too many M-PESA prompts were requested for this order. Wait ten minutes or contact the service desk.";
  if (status === "setup_required") return "Payment records are not ready. No prompt was sent; contact the service desk.";
  if (status === "not_configured") return "M-PESA checkout is not enabled yet. No prompt was sent; contact the service desk.";
  return "No M-PESA payment has been started for this request.";
}

export default function OrderStatus() {
  const [referenceInput, setReferenceInput] = useState("");
  const [activeReference, setActiveReference] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [mutationReference, setMutationReference] = useState("");
  const paymentMutation = trpc.public.startOrderPayment.useMutation();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("reference") ?? "";
    if (params.has("reference")) window.history.replaceState(window.history.state, "", window.location.pathname);
    let handoff = "";
    try {
      handoff = window.sessionStorage.getItem(orderStatusHandoffKey) ?? "";
      window.sessionStorage.removeItem(orderStatusHandoffKey);
    } catch {
      // Manual reference entry remains available when session storage is unavailable.
    }
    const initialReference = (handoff || fromUrl).trim().toUpperCase();
    if (orderReferencePattern.test(initialReference)) {
      setReferenceInput(initialReference);
      setActiveReference(initialReference);
      setIdempotencyKey(getOrCreateSubmissionId(paymentKeyFor(initialReference)));
    }
  }, []);
  const statusQuery = trpc.public.getOrderPaymentStatus.useQuery(
    { reference: activeReference },
    {
      enabled: orderReferencePattern.test(activeReference),
      refetchInterval: query => {
        const queryStatus = query.state.data?.paymentStatus ?? "";
        const mutationStatus = mutationReference === activeReference ? paymentMutation.data?.status ?? "" : "";
        const queryPending = queryStatus === "pending" || queryStatus === "initiating";
        const mutationPending = (queryStatus === "" || queryStatus === "not_started") && (mutationStatus === "pending" || mutationStatus === "initiating");
        return queryPending || mutationPending ? 8000 : false;
      },
    },
  );

  const lookup = (event: FormEvent) => {
    event.preventDefault();
    const next = referenceInput.trim().toUpperCase();
    if (!orderReferencePattern.test(next)) return;
    setActiveReference(next);
    setIdempotencyKey(getOrCreateSubmissionId(paymentKeyFor(next)));
    setMutationReference("");
    paymentMutation.reset();
  };

  const startPayment = async () => {
    if (!statusQuery.data?.canPay || !activeReference) return;
    setMutationReference(activeReference);
    let key = idempotencyKey || getOrCreateSubmissionId(paymentKeyFor(activeReference));
    if (statusQuery.data.paymentStatus === "failed") {
      key = startNewSubmission(paymentKeyFor(activeReference), paymentResultKeyFor(activeReference));
      setIdempotencyKey(key);
    }
    try {
      await paymentMutation.mutateAsync({ reference: activeReference, idempotencyKey: key });
      await statusQuery.refetch();
    } catch {
      // The mutation error is announced in the payment panel; keep the page usable.
    }
  };

  const data = statusQuery.data;
  const showTotal = data?.orderStatus === "confirmed" && data.total != null;
  const paymentStatus = data?.paymentStatus && data.paymentStatus !== "not_started"
    ? data.paymentStatus
    : mutationReference === activeReference ? paymentMutation.data?.status ?? data?.paymentStatus ?? "not_started" : data?.paymentStatus ?? "not_started";

  return (
    <PublicShell>
      <main id="main-content" className="min-h-[65vh] bg-[#f6f3ee] px-4 pb-28 pt-8 text-[#202a30] sm:px-6 sm:pb-14 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Link href="/spares" className="inline-flex items-center gap-2 text-sm font-bold text-[#56636a] hover:text-[#a93823]"><ArrowLeft className="h-4 w-4" />Back to parts and accessories</Link>
          <header className="mt-7 rounded-3xl bg-[#202a30] p-6 text-white sm:p-8">
            <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#f6c36a]">Guest order reference · Siaya Town</p>
            <h1 className="mt-3 text-3xl font-black tracking-[-.04em] sm:text-4xl">Check an item request</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#e0e5e6]">You do not need an account. Enter the reference saved after your request. We show only the order stage and payment information, not customer contact details. Keep this reference private: anyone who has it can check status and request a prompt to the phone saved on the order.</p>
          </header>

          <form onSubmit={lookup} className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#d9d2c8] bg-white p-5 sm:flex-row sm:items-end">
            <label className="min-w-0 flex-1 text-sm font-bold text-[#39464d]">Order reference
              <input required pattern="DPH-ORD-[A-F0-9]{24}" autoCapitalize="characters" autoComplete="off" value={referenceInput} onChange={event => setReferenceInput(event.target.value.toUpperCase())} placeholder="DPH-ORD-…" className="mt-2 h-12 w-full rounded-xl border border-[#cfc5b8] bg-white px-3 font-mono text-sm text-[#202a30] outline-none focus:border-[#b53d25] focus:ring-4 focus:ring-[#d94b2b]/10" />
            </label>
            <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#202a30] px-5 text-sm font-extrabold text-white hover:bg-[#34434a]"><Search className="h-4 w-4" />Check request</button>
          </form>

          {!activeReference && <section className="mt-5 rounded-2xl border border-[#d9d2c8] bg-white p-6 text-sm leading-6 text-[#56636a]"><p>Find the reference on the confirmation screen or in the message you saved from Digital Phone Hub. If you cannot find it, call <a className="font-bold text-[#a93823] underline" href="tel:+254718114009">0718 114 009</a> and the desk can help.</p></section>}
          {activeReference && statusQuery.isLoading && <div role="status" className="mt-5 flex items-center gap-3 rounded-2xl border border-[#d9d2c8] bg-white p-6 text-sm text-[#56636a]"><Loader2 className="h-5 w-5 animate-spin text-[#a93823]" />Checking the request reference…</div>}
          {activeReference && statusQuery.error && <div role="alert" className="mt-5 rounded-2xl border border-[#d94b2b]/25 bg-white p-6 text-sm leading-6 text-[#8d311e]">We could not check this reference right now. Confirm the reference and try again, or call 0718 114 009.</div>}
          {activeReference && data === null && !statusQuery.isLoading && !statusQuery.error && <div role="alert" className="mt-5 rounded-2xl border border-[#d9d2c8] bg-white p-6 text-sm leading-6 text-[#56636a]">No request was found for this reference. Check the characters and try again, or call 0718 114 009.</div>}
          {activeReference && data && (
            <section className="mt-5 space-y-4" aria-live="polite">
              <article className="rounded-2xl border border-[#d9d2c8] bg-white p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#69747b]">Request reference</p><p className="mt-2 break-all font-mono text-lg font-black text-[#a93823]">{data.reference}</p></div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#fff1e7] px-3 py-1.5 text-xs font-extrabold text-[#8d311e]"><Clock3 className="h-4 w-4" />{data.orderStatus.replaceAll("_", " ")}</span>
                </div>
                <p className="mt-5 text-sm leading-6 text-[#56636a]">{orderStage(data.orderStatus, showTotal)}</p>
                {showTotal && <div className="mt-5 rounded-xl border border-[#d9d2c8] bg-[#f6f3ee] p-4"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#69747b]">Service-desk confirmed total</p><p className="mt-1 text-2xl font-black text-[#202a30]">KES {Number(data.total).toLocaleString("en-KE")}</p><p className="mt-1 text-xs leading-5 text-[#56636a]">Payment is optional. Only continue if this confirmed total matches what the desk agreed with you.</p></div>}
                {data.orderStatus === "confirmed" && !showTotal && paymentStatus !== "paid" && <p className="mt-5 rounded-xl border border-[#d9d2c8] bg-[#f6f3ee] p-4 text-sm leading-6 text-[#56636a]">The service desk has not confirmed a final payable total or item availability yet. No payment is due or available. Call or WhatsApp to confirm the next step.</p>}
              </article>

              <article className="rounded-2xl border border-[#d9d2c8] bg-white p-6 sm:p-8">
                <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e4f3ed] text-[#205c52]"><ShieldCheck className="h-5 w-5" /></span><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#205c52]">M-PESA · Safaricom Daraja</p><h2 className="mt-1 text-xl font-black text-[#202a30]">Payment status</h2></div></div>
                <p className="mt-4 text-sm leading-6 text-[#56636a]">{paymentMessage(paymentStatus)}</p>
                {mutationReference === activeReference && paymentMutation.data?.message && (!data || data.paymentStatus === "not_started") && <p className="mt-3 rounded-xl bg-[#f6f3ee] p-3 text-sm leading-6 text-[#39464d]">{paymentMutation.data.message}</p>}
                {mutationReference === activeReference && paymentMutation.error && <p role="alert" className="mt-3 rounded-xl border border-[#d94b2b]/25 bg-[#fff1e7] p-3 text-sm leading-6 text-[#8d311e]">M-PESA could not start this request. No payment is confirmed. Please try again or contact the service desk.</p>}
                {paymentStatus === "paid" && <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#e4f3ed] px-4 py-3 text-sm font-extrabold text-[#205c52]"><CheckCircle2 className="h-5 w-5" />Payment confirmed</p>}
                {data.canPay && paymentStatus !== "pending" && paymentStatus !== "initiating" && paymentStatus !== "review" && paymentStatus !== "paid" && (
                  <button type="button" onClick={() => void startPayment()} disabled={paymentMutation.isPending} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#205c52] px-5 py-3.5 text-sm font-extrabold text-white hover:bg-[#174a42] disabled:cursor-wait disabled:opacity-60 sm:w-auto">
                    {paymentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    {paymentMutation.isPending ? "Contacting M-PESA…" : "Send M-PESA prompt"}
                  </button>
                )}
                {!data.paymentAvailable && data.orderStatus === "confirmed" && <p className="mt-4 text-sm text-[#69747b]">Online payment setup is not complete. No M-PESA prompt will be sent. Call or WhatsApp the service desk to arrange the next step.</p>}
                {(paymentStatus === "pending" || paymentStatus === "initiating") && <p className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#56636a]"><RefreshCw className="h-4 w-4" />Status checks refresh automatically while the prompt is pending.</p>}
                <div className="mt-5 flex flex-wrap gap-3 border-t border-[#e5ded5] pt-4"><a href={`https://wa.me/254718114009?text=${encodeURIComponent(`Hello Digital Phone Hub, I need help checking an item request. I can provide my reference.`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-[#cfc5b8] px-4 py-2.5 text-sm font-bold text-[#202a30]">WhatsApp the desk</a><a href="tel:+254718114009" className="inline-flex items-center gap-2 rounded-xl border border-[#cfc5b8] px-4 py-2.5 text-sm font-bold text-[#202a30]"><Phone className="h-4 w-4" />Call 0718 114 009</a></div>
              </article>
            </section>
          )}

          <p className="mt-6 text-center text-xs leading-5 text-[#69747b]">Never share your M-PESA PIN with Digital Phone Hub. Approve payment only in the M-PESA prompt on your own phone, after confirming the total.</p>
        </div>
      </main>
    </PublicShell>
  );
}
