import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Package, Phone, Search, ShoppingBag, Trash2, Truck } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "wouter";
import PublicShell from "@/components/PublicShell";
import { trpc } from "@/lib/trpc";
import { getOrCreateSubmissionId, readSavedReference, saveReference, startNewSubmission } from "@/lib/requestTokens";

type Product = {
  id: number; sku: string; name: string; category: string; productType: "part" | "device" | "accessory" | "service";
  description: string | null; compatibility: string | null; imageUrl: string | null; externalUrl: string | null;
  price: number; stock: number; availability: string;
};

const categories = [
  { value: "all", label: "All items" }, { value: "phone_screen", label: "Screens" },
  { value: "battery", label: "Batteries" }, { value: "charging_port", label: "Charging" },
  { value: "laptop_spare", label: "Laptop parts" }, { value: "accessory", label: "Accessories" },
];
const categoryLabels: Record<string, string> = { phone_screen: "Screen", battery: "Battery", charging_port: "Charging", laptop_spare: "Laptop part", accessory: "Accessory", other: "Electronics" };
const submissionStorageKey = "dph-parts-submission-id";
const resultStorageKey = "dph-parts-result-reference";
const basketStorageKey = "dph-parts-request-basket";

function readSavedBasket(): Record<number, number> {
  if (typeof window === "undefined") return {};
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(basketStorageKey) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const basket: Record<number, number> = {};
    for (const [id, quantity] of Object.entries(parsed as Record<string, unknown>)) {
      if (/^\d+$/.test(id) && typeof quantity === "number" && Number.isInteger(quantity) && quantity > 0 && quantity <= 20) basket[Number(id)] = quantity;
    }
    return basket;
  } catch { return {}; }
}

function formatPrice(value: number) { return value > 0 ? `KES ${value.toLocaleString("en-KE")}` : "Price to be confirmed"; }
function availabilityLabel(product: Product) {
  if (product.externalUrl) return "Sold through external seller";
  if (product.availability === "out_of_stock" || product.stock <= 0 && product.availability !== "by_order" && product.productType !== "service") return "Check availability";
  if (product.availability === "by_order") return "Request to order";
  if (product.availability === "low_stock") return "Limited stock · confirm first";
  return "Request availability";
}
function canRequestFromListing(product: Product) { return !product.externalUrl && product.availability !== "out_of_stock" && (product.stock > 0 || product.availability === "by_order" || product.productType === "service"); }

export default function SpareParts() {
  const products = trpc.public.products.useQuery();
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<number, number>>(readSavedBasket);
  const [form, setForm] = useState({ name: "", phone: "", email: "", location: "", model: "", customPart: "", notes: "", fulfillment: "delivery" as "delivery" | "collection" });
  const [submitted, setSubmitted] = useState<string | null>(() => typeof window !== "undefined" ? readSavedReference(resultStorageKey) : null);
  const [submissionId, setSubmissionId] = useState(() => typeof window !== "undefined" ? getOrCreateSubmissionId(submissionStorageKey) : "");
  const mutation = trpc.public.createOrderRequest.useMutation({ onSuccess: result => { saveReference(resultStorageKey, result.reference); setSubmitted(result.reference); setSelected({}); } });
  const update = (key: string, value: string) => setForm(current => ({ ...current, [key]: value }));
  const allProducts = (products.data ?? []) as Product[];
  useEffect(() => { try { sessionStorage.setItem(basketStorageKey, JSON.stringify(selected)); } catch { /* Session storage may be unavailable in private browsing. */ } }, [selected]);
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("en-KE");
    return allProducts.filter(product => {
      const matchesCategory = category === "all" || product.category === category;
      const haystack = [product.name, product.sku, product.description, product.compatibility, categoryLabels[product.category]].filter(Boolean).join(" ").toLocaleLowerCase("en-KE");
      return matchesCategory && (!query || haystack.includes(query));
    });
  }, [allProducts, category, search]);
  const selectedItems = Object.entries(selected).map(([id, quantity]) => ({ product: allProducts.find(item => item.id === Number(id)), quantity })).filter((item): item is { product: Product; quantity: number } => Boolean(item.product && item.quantity > 0));
  const itemCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const unavailableSelectionCount = products.isLoading ? 0 : Object.keys(selected).filter(id => !allProducts.some(product => product.id === Number(id))).length;
  const overQuantityItems = selectedItems.filter(({ product, quantity }) => product.availability !== "by_order" && product.productType !== "service" && quantity > product.stock);
  const hasRequestLines = selectedItems.length > 0 || Boolean(form.customPart.trim());
  const hasUnpricedItem = selectedItems.some(item => item.product.price <= 0) || Boolean(form.customPart.trim());
  const knownTotal = selectedItems.reduce((sum, item) => sum + (item.product.price > 0 ? item.product.price * item.quantity : 0), 0);

  const addProduct = (product: Product) => {
    if (!canRequestFromListing(product)) return;
    const maxQuantity = product.availability === "by_order" || product.productType === "service" ? 20 : Math.min(20, product.stock);
    setSelected(current => ({ ...current, [product.id]: Math.min((current[product.id] ?? 0) + 1, maxQuantity) }));
  };
  const changeQuantity = (id: number, amount: number) => setSelected(current => {
    if (amount <= 0) { const next = { ...current }; delete next[id]; return next; }
    return { ...current, [id]: Math.min(amount, 20) };
  });
  const goToRequest = () => document.getElementById("order-request")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const addRequestItem = (name: string, model = "") => {
    setForm(current => ({ ...current, customPart: current.customPart ? `${current.customPart}, ${name}` : name, model: current.model || model }));
    window.setTimeout(goToRequest, 0);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const custom = form.customPart.trim();
    if ((selectedItems.length === 0 && custom.length < 3) || unavailableSelectionCount > 0 || overQuantityItems.length > 0) return;
    const items = [
      ...selectedItems.map(({ product, quantity }) => ({ productId: product.id, productName: product.name, quantity, unitPrice: product.price })),
      ...(custom ? [{ productName: custom.slice(0, 180), quantity: 1, unitPrice: 0 }] : []),
    ];
    mutation.mutate({
      submissionId: submissionId || undefined,
      customer: { name: form.name.trim(), phone: form.phone.trim(), email: form.email || undefined, location: form.location || undefined },
      fulfillment: form.fulfillment,
      deliveryLocation: form.fulfillment === "delivery" ? form.location.trim() : undefined,
      notes: [form.model.trim() ? `Device model: ${form.model.trim()}` : "", form.notes.trim()].filter(Boolean).join(". ") || undefined,
      items,
    });
  };

  const startAnotherRequest = () => {
    setSubmissionId(startNewSubmission(submissionStorageKey, resultStorageKey));
    setSelected({});
    setForm({ name: "", phone: "", email: "", location: "", model: "", customPart: "", notes: "", fulfillment: "delivery" });
    setSubmitted(null);
    mutation.reset();
  };

  if (submitted) return (
    <PublicShell>
      <main id="main-content" className="grid min-h-[65vh] place-items-center bg-[#f6f3ee] px-4 pb-24 pt-12 sm:pb-12">
        <section className="w-full max-w-2xl rounded-[1.75rem] border border-[#d9d2c8] bg-white p-6 text-center shadow-xl shadow-[#202a30]/[.08] sm:p-10" role="status" aria-live="polite">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e4f3ed] text-[#205c52]"><CheckCircle2 className="h-7 w-7" /></span>
          <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#205c52]">Request saved</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-.04em] text-[#202a30] sm:text-4xl">The parts desk has your enquiry.</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#56636a]">This is an availability/order request, not a completed purchase. No payment was taken. The desk needs to confirm stock, compatibility, final price and fulfilment before you decide.</p>
          <div className="mx-auto mt-6 max-w-md rounded-xl border border-[#d9d2c8] bg-[#f6f3ee] p-5"><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#69747b]">Request reference</p><p className="mt-2 break-all font-mono text-xl font-black text-[#a93823]">{submitted}</p><p className="mt-2 text-xs leading-5 text-[#69747b]">Keep this reference private. Anyone who has it can check the order stage and request a payment prompt to the phone saved on the order. Use it when contacting the service desk.</p></div>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/order-status" onClick={() => { try { window.sessionStorage.setItem("dph-order-status-reference", submitted); } catch { /* The customer can enter the reference manually. */ } }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#205c52] px-5 py-3 text-sm font-extrabold text-white">Check order status &amp; payment <ArrowRight className="h-4 w-4" /></Link><a href={`https://wa.me/254718114009?text=${encodeURIComponent(`Hello Digital Phone Hub, I am following up on a parts request. I can provide my reference.`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#cfc5b8] px-5 py-3 text-sm font-extrabold text-[#202a30]">Ask the desk on WhatsApp <ArrowRight className="h-4 w-4" /></a><Link href="/" className="inline-flex items-center justify-center rounded-xl border border-[#cfc5b8] px-5 py-3 text-sm font-extrabold text-[#202a30]">Back to the shop</Link></div>
          <button type="button" onClick={startAnotherRequest} className="mt-5 text-sm font-bold text-[#a93823] underline-offset-4 hover:underline">Start another parts request</button>
        </section>
      </main>
    </PublicShell>
  );

  return (
    <PublicShell>
      <main id="main-content" className="bg-[#f6f3ee] pb-24 text-[#202a30] sm:pb-0">
        <section className="border-b border-[#d9d2c8] bg-white px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_.8fr] lg:items-center"><div><Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#56636a] hover:text-[#a93823]"><ArrowLeft className="h-4 w-4" />Back to Digital Phone Hub</Link><p className="mt-7 text-[10px] font-extrabold uppercase tracking-[.22em] text-[#a93823]">Parts & accessories · Siaya Town</p><h1 className="mt-3 max-w-2xl text-4xl font-black leading-[1.02] tracking-[-.06em] sm:text-5xl">Find the right part for your device.</h1><p className="mt-4 max-w-xl text-[15px] leading-7 text-[#56636a]">Browse items the shop has published, or describe what you need. We confirm compatibility, availability and final price before you decide.</p><div className="mt-6 flex flex-col gap-3 sm:flex-row"><a href="#catalogue" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d94b2b] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#b53d25]">Browse published items <ArrowRight className="h-4 w-4" /></a><a href="tel:+254718114009" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#cfc5b8] px-5 py-3 text-sm font-extrabold text-[#202a30]"><Phone className="h-4 w-4 text-[#a93823]" />Talk to the desk</a></div></div><figure className="relative overflow-hidden rounded-2xl bg-[#202a30]"><img src="/brand/dph-storefront-sign-wide.webp" alt="Digital Phone Hub storefront in Siaya" width="1200" height="600" className="h-56 w-full object-cover sm:h-64" fetchPriority="high" /><figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#202a30]/85 to-transparent p-4 text-sm font-extrabold text-white">Digital Phone Hub · Siaya Town</figcaption></figure></div>
        </section>
        <section className="border-b border-[#d9d2c8] bg-[#fff8f1] px-4 py-5 sm:px-6 lg:px-8"><div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-3"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#a93823]"><Search className="h-4 w-4" /></span><span><strong className="block text-sm">Check compatibility</strong><span className="text-xs text-[#56636a]">Share the exact model</span></span></div><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#a93823]"><Truck className="h-4 w-4" /></span><span><strong className="block text-sm">Ask about fulfilment</strong><span className="text-xs text-[#56636a]">Request delivery or collection</span></span></div><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#205c52]"><CheckCircle2 className="h-4 w-4" /></span><span><strong className="block text-sm">Confirm before purchase</strong><span className="text-xs text-[#56636a]">No payment is taken with this request</span></span></div></div></section>
        <section id="catalogue" className="scroll-mt-24 px-4 py-10 sm:px-6 lg:px-8 lg:py-14"><div className="mx-auto max-w-7xl"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#a93823]">Shop catalogue</p><h2 className="mt-2 text-3xl font-black tracking-[-.05em] text-[#202a30]">Published items</h2><p className="mt-2 text-sm leading-6 text-[#56636a]">Prices and availability are confirmed by the service desk before fulfilment.</p></div><label className="relative block w-full lg:max-w-sm"><Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[#69747b]" /><input value={search} onChange={event => setSearch(event.target.value)} className="h-11 w-full rounded-xl border border-[#cfc5b8] bg-white pl-10 pr-3 text-sm text-[#202a30] outline-none focus:border-[#b53d25] focus:ring-4 focus:ring-[#d94b2b]/10" placeholder="Search screens, batteries, chargers…" aria-label="Search items" /></label></div>
          {allProducts.length > 0 && <div className="mt-5 flex gap-2 overflow-x-auto pb-2" aria-label="Catalogue categories">{categories.map(item => <button key={item.value} type="button" aria-pressed={category === item.value} onClick={() => setCategory(item.value)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-bold transition ${category === item.value ? "border-[#202a30] bg-[#202a30] text-white" : "border-[#d9d2c8] bg-white text-[#46535a] hover:border-[#b53d25]"}`}>{item.label}</button>)}</div>}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-live="polite">
            {products.isLoading ? <div className="rounded-2xl border border-[#d9d2c8] bg-white p-8 text-sm text-[#56636a] sm:col-span-2 xl:col-span-3" role="status"><Loader2 className="mr-2 inline h-4 w-4 animate-spin text-[#a93823]" />Loading published items…</div>
              : products.error ? <div className="rounded-2xl border border-[#d94b2b]/25 bg-white p-6 text-sm leading-6 text-[#8d311e] sm:col-span-2 xl:col-span-3" role="alert">The catalogue is unavailable right now. Please call 0718 114 009 or send an item enquiry below.</div>
                : filteredProducts.length === 0 ? <div className="rounded-2xl border border-[#d9d2c8] bg-white p-6 sm:col-span-2 xl:col-span-3"><div className="max-w-2xl"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff1e7] text-[#a93823]"><Package className="h-5 w-5" /></span><h3 className="mt-4 text-xl font-black text-[#202a30]">{allProducts.length === 0 ? "No items are published yet." : "No items match that search."}</h3><p className="mt-2 text-sm leading-6 text-[#56636a]">You can still tell the parts desk what you need. We will confirm compatibility, availability and the price before you decide.</p><button type="button" onClick={() => addRequestItem(search.trim() || "Phone part or accessory enquiry")} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#d94b2b] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#b53d25]">Ask about an item <ArrowRight className="h-4 w-4" /></button></div></div>
                  : filteredProducts.map(product => { const quantity = selected[product.id] ?? 0; return <article key={product.id} className="flex flex-col rounded-2xl border border-[#d9d2c8] bg-white p-4 shadow-sm transition hover:border-[#c7b6a3] hover:shadow-md"><div className="overflow-hidden rounded-xl border border-[#e5ded5] bg-[#f6f3ee]">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} width="640" height="480" className="h-44 w-full object-contain p-4" loading="lazy" /> : <div className="grid h-44 place-items-center text-[#b53d25]"><Package className="h-10 w-10" /><span className="sr-only">No product image available</span></div>}</div><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-[#f6f3ee] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#56636a]">{categoryLabels[product.category] ?? "Electronics"}</span><span className="rounded-full bg-[#e4f3ed] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.1em] text-[#205c52]">{availabilityLabel(product)}</span></div><h3 className="mt-3 text-lg font-extrabold text-[#202a30]">{product.name}</h3><p className="mt-2 text-sm leading-6 text-[#56636a]">{product.description || "Contact the service desk for item details."}</p>{product.compatibility && <p className="mt-3 text-xs leading-5 text-[#46535a]"><strong>Compatibility:</strong> {product.compatibility}</p>}<div className="mt-auto flex items-end justify-between gap-3 pt-5"><div><p className="font-black text-[#202a30]">{formatPrice(product.price)}</p><p className="mt-1 text-[11px] text-[#69747b]">{product.sku}</p></div>{product.externalUrl ? <a href={product.externalUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-[#d9d2c8] px-3 py-2 text-xs font-extrabold text-[#202a30]">Visit seller <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></a> : quantity > 0 ? <div className="flex items-center gap-2 rounded-xl border border-[#d9d2c8] p-1"><button type="button" onClick={() => changeQuantity(product.id, quantity - 1)} className="grid h-8 w-8 place-items-center rounded-lg text-[#a93823] hover:bg-[#fff1e7]" aria-label={`Remove one ${product.name}`}><span aria-hidden="true">−</span></button><span className="min-w-5 text-center text-sm font-extrabold" aria-label={`Quantity ${quantity}`}>{quantity}</span><button type="button" onClick={() => addProduct(product)} className="grid h-8 w-8 place-items-center rounded-lg text-[#a93823] hover:bg-[#fff1e7]" aria-label={`Add one ${product.name}`}><span aria-hidden="true">+</span></button></div> : <button type="button" onClick={() => canRequestFromListing(product) ? addProduct(product) : addRequestItem(product.name, product.compatibility ?? "")} className="rounded-xl bg-[#d94b2b] px-3 py-2 text-xs font-extrabold text-white hover:bg-[#b53d25]">{canRequestFromListing(product) ? "Add to request" : "Check options"}</button>}</div></article>; })}
          </div>
        </div></section>
        <section id="order-request" className="scroll-mt-24 border-y border-[#d9d2c8] bg-white px-4 py-10 sm:px-6 lg:px-8 lg:py-14"><div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[.85fr_1.15fr] lg:items-start"><aside className="rounded-2xl bg-[#202a30] p-6 text-white lg:sticky lg:top-24"><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#f6c36a]">Your item request</p><h2 className="mt-2 text-2xl font-black">A desk enquiry, not a checkout.</h2><p className="mt-3 text-sm leading-6 text-[#e0e5e6]">Nothing is charged here. The service desk confirms stock, model fit, total price and collection or delivery details before you decide whether to buy.</p><div className="mt-5 rounded-xl border border-white/10 bg-white/[.06] p-4"><div className="flex items-center justify-between text-sm"><span>Catalogue items</span><strong>{itemCount}</strong></div>{selectedItems.length > 0 && <div className="mt-3 space-y-2 border-t border-white/10 pt-3">{selectedItems.map(({ product, quantity }) => <div key={product.id} className="flex items-start justify-between gap-3 text-sm"><span>{product.name} × {quantity}</span><button type="button" onClick={() => changeQuantity(product.id, 0)} aria-label={`Remove ${product.name} from request`} className="text-[#f6c36a] hover:text-white"><Trash2 className="h-4 w-4" /></button></div>)}</div>}{form.customPart && <p className="mt-3 border-t border-white/10 pt-3 text-sm">Additional enquiry: {form.customPart}</p>}<div className="mt-3 border-t border-white/10 pt-3">{!hasRequestLines ? <p className="text-sm font-extrabold text-[#f6c36a]">No items selected yet</p> : hasUnpricedItem ? <p className="text-sm font-extrabold text-[#f6c36a]">Final price: to be confirmed</p> : <p className="text-sm font-extrabold text-white">Listed estimate: KES {knownTotal.toLocaleString("en-KE")}</p>}<p className="mt-1 text-xs leading-5 text-[#d0d8da]">{!hasRequestLines ? "Add a published item or describe what you need before sending." : hasUnpricedItem ? "No payment is taken; the desk confirms the final price before you decide." : "This is a listed estimate, not a payment or a guaranteed final price."}</p></div></div>{itemCount > 0 && <button type="button" onClick={() => setSelected({})} className="mt-3 text-xs font-bold text-[#f6c36a] hover:text-white">Clear catalogue items</button>}</aside>
          <form onSubmit={submit} className="rounded-2xl border border-[#d9d2c8] bg-[#f6f3ee] p-5 sm:p-7"><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#a93823]">Send the request</p><h2 className="mt-2 text-2xl font-black text-[#202a30]">How should the desk reach you?</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{([["name", "Your name", "Full name"], ["phone", "Phone number", "0718 114 009"], ["email", "Email (optional)", "you@example.com"], ["model", "Device brand & model", "Samsung A14, iPhone 11…"]] as const).map(([key, label, placeholder]) => <label key={key} className="text-sm font-bold text-[#39464d]">{label}<input required={key === "name" || key === "phone"} type={key === "phone" ? "tel" : key === "email" ? "email" : "text"} inputMode={key === "phone" ? "tel" : undefined} autoComplete={key === "name" ? "name" : key === "phone" ? "tel" : key === "email" ? "email" : undefined} value={form[key]} onChange={event => update(key, event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#cfc5b8] bg-white px-3 text-sm text-[#202a30] outline-none focus:border-[#b53d25] focus:ring-4 focus:ring-[#d94b2b]/10" placeholder={placeholder} /></label>)}
            <label className="text-sm font-bold text-[#39464d]">Fulfilment<select value={form.fulfillment} onChange={event => update("fulfillment", event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#cfc5b8] bg-white px-3 text-sm text-[#202a30] outline-none focus:border-[#b53d25] focus:ring-4 focus:ring-[#d94b2b]/10"><option value="delivery">Ask about delivery</option><option value="collection">Collection in Siaya</option></select></label>
            {form.fulfillment === "delivery" && <label className="text-sm font-bold text-[#39464d]">Delivery town or area<input required maxLength={180} value={form.location} onChange={event => update("location", event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#cfc5b8] bg-white px-3 text-sm text-[#202a30] outline-none focus:border-[#b53d25] focus:ring-4 focus:ring-[#d94b2b]/10" placeholder="Town or estate" /></label>}
            <label className="text-sm font-bold text-[#39464d] sm:col-span-2">Part or item you need (if not already in the request)<input value={form.customPart} maxLength={180} onChange={event => update("customPart", event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#cfc5b8] bg-white px-3 text-sm text-[#202a30] outline-none focus:border-[#b53d25] focus:ring-4 focus:ring-[#d94b2b]/10" placeholder="e.g. screen for Samsung A14" /></label>
            <label className="text-sm font-bold text-[#39464d] sm:col-span-2">Anything else the desk should know? (optional)<textarea value={form.notes} maxLength={2000} onChange={event => update("notes", event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-[#cfc5b8] bg-white p-3 text-sm leading-6 text-[#202a30] outline-none focus:border-[#b53d25] focus:ring-4 focus:ring-[#d94b2b]/10" placeholder="Colour, part code or a question for the team" /></label>
          </div>
          {unavailableSelectionCount > 0 && <div role="alert" className="mt-4 rounded-xl border border-[#d94b2b]/25 bg-[#fff1e7] p-3 text-sm leading-6 text-[#8d311e]"><p>{unavailableSelectionCount} saved catalogue item{unavailableSelectionCount === 1 ? " is" : "s are"} no longer published. Remove the outdated selection before sending this request.</p><button type="button" onClick={() => setSelected(current => Object.fromEntries(Object.entries(current).filter(([id]) => allProducts.some(product => product.id === Number(id)))))} className="mt-2 font-extrabold underline underline-offset-4">Remove unavailable items</button></div>}
          {overQuantityItems.length > 0 && <p role="alert" className="mt-4 rounded-xl border border-[#d94b2b]/25 bg-[#fff1e7] p-3 text-sm leading-6 text-[#8d311e]">Stock changed for {overQuantityItems.map(item => item.product.name).join(", ")}. Reduce the selected quantity to the published stock level before sending.</p>}
          {selectedItems.length === 0 && form.customPart.trim().length < 3 && <p className="mt-4 rounded-xl border border-[#d9d2c8] bg-white p-3 text-sm leading-6 text-[#56636a]">Add at least one catalogue item or describe what you are looking for before sending this request.</p>}
          {mutation.error && <p role="alert" className="mt-4 rounded-xl border border-[#d94b2b]/25 bg-[#fff1e7] p-3 text-sm leading-6 text-[#8d311e]">We could not save the request. Nothing is confirmed as received; please try again or call 0718 114 009.</p>}
          <div className="mt-5 flex flex-col gap-3 border-t border-[#d9d2c8] pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-sm text-xs leading-5 text-[#69747b]">Your contact details are used to follow up on this request. No payment is taken by submitting it.</p><button type="submit" disabled={mutation.isPending || unavailableSelectionCount > 0 || overQuantityItems.length > 0 || (selectedItems.length === 0 && form.customPart.trim().length < 3)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d94b2b] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#b53d25] disabled:cursor-not-allowed disabled:opacity-60">{mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}{mutation.isPending ? "Saving request…" : "Send item request"}</button></div>
          </form>
        </div></section>
      </main>
    </PublicShell>
  );
}
