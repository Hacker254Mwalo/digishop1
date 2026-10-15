import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  ArrowUpRight,
  Boxes,
  Check,
  ChevronDown,
  ClipboardList,
  Copy,
  History,
  Mail,
  MessageCircle,
  Laptop,
  Loader2,
  PackagePlus,
  PhoneCall,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Smartphone,
  UserRound,
  Users,
  Wrench,
  X,
  Trash2,
  UploadCloud,
  WandSparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Section = "overview" | "repairs" | "inventory" | "orders" | "team";
const repairStatuses = ["received", "diagnostics", "awaiting_approval", "in_repair", "ready", "collected", "cancelled"] as const;
const orderStatuses = ["new", "confirmed", "fulfilled", "cancelled"] as const;
const productTypeLabels: Record<string, string> = { part: "Part", device: "Device", accessory: "Accessory", service: "Service" };

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" });
}

function statusLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

function statusTone(value: string) {
  if (["ready", "fulfilled", "confirmed"].includes(value)) return "bg-emerald-300/10 text-emerald-200 border-emerald-300/20";
  if (["cancelled", "out_of_stock"].includes(value)) return "bg-rose-300/10 text-rose-200 border-rose-300/20";
  if (["diagnostics", "in_repair", "awaiting_approval"].includes(value)) return "bg-cyan-300/10 text-cyan-200 border-cyan-300/20";
  return "bg-amber-300/10 text-amber-200 border-amber-300/20";
}

function readImageAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Could not read the selected image"));
    reader.readAsDataURL(file);
  });
}

function validateProductImage(file: File | undefined) {
  if (!file) return false;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    window.alert("Please choose a JPG, PNG or WebP image.");
    return false;
  }
  if (file.size > 6 * 1024 * 1024) {
    window.alert("Product images must be 6 MB or smaller.");
    return false;
  }
  return true;
}

async function cleanProductBackground(file: File) {
  const { removeBackground } = await import("@imgly/background-removal");
  const cleaned = await removeBackground(file);
  return new File([cleaned], `${file.name.replace(/\.[^.]+$/, "")}-clean.png`, { type: "image/png" });
}

function Metric({ label, value, hint, icon: Icon, tone }: { label: string; value: number; hint: string; icon: typeof Activity; tone: string }) {
  return (
    <div className={`premium-panel-hover rounded-2xl border p-5 shadow-sm ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] opacity-70">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950/20"><Icon className="h-5 w-5" /></span>
      </div>
      <p className="mt-4 text-xs opacity-75">{hint}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [section, setSection] = useState<Section>(() => {
    const requested = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("section") as Section | null;
    return requested && ["overview", "repairs", "inventory", "orders", "team"].includes(requested) ? requested : "overview";
  });
  useEffect(() => {
    const syncSection = () => {
      const requested = new URLSearchParams(window.location.search).get("section") as Section | null;
      setSection(requested && ["overview", "repairs", "inventory", "orders", "team"].includes(requested) ? requested : "overview");
    };
    window.addEventListener("popstate", syncSection);
    return () => window.removeEventListener("popstate", syncSection);
  }, []);
  const selectSection = (next: Section) => {
    const path = next === "overview" ? "/admin" : `/admin?section=${next}`;
    window.history.pushState({}, "", path);
    setSection(next);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };
  const [repairFilter, setRepairFilter] = useState("all");
  const [repairSearch, setRepairSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({ sku: "", name: "", category: "phone_screen", productType: "part", description: "", compatibility: "", price: "", stock: "", externalUrl: "" });
  const [productImage, setProductImage] = useState<File | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({});
  const [historyFor, setHistoryFor] = useState<{ customerId: number; deviceId: number } | null>(null);
  const [editingTechnicianId, setEditingTechnicianId] = useState<number | null>(null);
  const [technicianForm, setTechnicianForm] = useState({ name: "", phone: "", specialty: "" });
  const [technicianActive, setTechnicianActive] = useState(true);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [productEdit, setProductEdit] = useState({ price: "", stock: "", availability: "in_stock" });
  const utils = trpc.useUtils();
  const isAdmin = user?.role === "admin";
  const summary = trpc.admin.summary.useQuery(undefined, { enabled: isAdmin });
  const repairs = trpc.admin.repairs.useQuery(undefined, { enabled: isAdmin });
  const products = trpc.admin.products.useQuery(undefined, { enabled: isAdmin });
  const orders = trpc.admin.orders.useQuery(undefined, { enabled: isAdmin });
  const technicians = trpc.admin.technicians.useQuery(undefined, { enabled: isAdmin });
  const allTechnicians = trpc.admin.allTechnicians.useQuery(undefined, { enabled: isAdmin });
  const updateRepair = trpc.admin.updateRepair.useMutation({ onSuccess: () => utils.admin.repairs.invalidate().then(() => utils.admin.summary.invalidate()) });
  const addNote = trpc.admin.addNote.useMutation({ onSuccess: (_, variables) => { setNoteDrafts(current => ({ ...current, [variables.ticketId]: "" })); return utils.admin.repairs.invalidate(); } });
  const upsertProduct = trpc.admin.upsertProduct.useMutation({ onSuccess: () => Promise.all([utils.admin.products.invalidate(), utils.admin.summary.invalidate()]) });
  const uploadProductImage = trpc.admin.uploadProductImage.useMutation({ onSuccess: () => utils.admin.products.invalidate() });
  const removeProduct = trpc.admin.removeProduct.useMutation({ onSuccess: () => Promise.all([utils.admin.products.invalidate(), utils.admin.summary.invalidate()]) });
  const updateOrder = trpc.admin.updateOrder.useMutation({ onSuccess: () => Promise.all([utils.admin.orders.invalidate(), utils.admin.summary.invalidate()]) });
  const upsertTechnician = trpc.admin.upsertTechnician.useMutation({ onSuccess: () => { setEditingTechnicianId(null); setTechnicianForm({ name: "", phone: "", specialty: "" }); return Promise.all([utils.admin.allTechnicians.invalidate(), utils.admin.technicians.invalidate()]); } });

  const filteredRepairs = useMemo(() => {
    const query = repairSearch.trim().toLowerCase();
    return repairs.data?.filter(row => {
      const matchesStage = repairFilter === "all" || row.ticket.status === repairFilter;
      const haystack = [row.ticket.reference, row.ticket.issue, row.customer?.name, row.customer?.phone, row.device?.brand, row.device?.model].filter(Boolean).join(" ").toLowerCase();
      return matchesStage && (!query || haystack.includes(query));
    }) ?? [];
  }, [repairs.data, repairFilter, repairSearch]);
  const filteredOrders = useMemo(() => {
    const query = orderSearch.trim().toLowerCase();
    return orders.data?.filter(row => !query || [row.order.reference, row.customer?.name, row.customer?.phone, row.customer?.email, row.order.notes].filter(Boolean).join(" ").toLowerCase().includes(query)) ?? [];
  }, [orders.data, orderSearch]);
  const lowStockProducts = useMemo(() => products.data?.filter(product => product.stock <= product.reorderLevel) ?? [], [products.data]);
  const historyInput = useMemo(() => historyFor ?? { customerId: 0, deviceId: 0 }, [historyFor]);
  const history = trpc.admin.customerHistory.useQuery(historyInput, { enabled: isAdmin && Boolean(historyFor) });
  const queryError = summary.error || repairs.error || products.error || orders.error || technicians.error || allTechnicians.error || history.error;
  const mutationError = updateRepair.error || addNote.error || upsertProduct.error || uploadProductImage.error || removeProduct.error || updateOrder.error || upsertTechnician.error;

  if (!isAdmin) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-4 py-16">
        <div className="w-full rounded-3xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-100 text-rose-700"><ShieldAlert className="h-7 w-7" /></div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">Owner access required</h1>
          <p className="mt-3 text-sm text-muted-foreground">This area is reserved for the Digital Phone Hub Repair & Electronics owner. Sign in with the owner account to manage shop operations.</p>
        </div>
      </div>
    );
  }

  const refreshAll = () => Promise.all([summary.refetch(), repairs.refetch(), products.refetch(), orders.refetch(), technicians.refetch()]);
  const resetProductForm = () => { setProductForm({ sku: "", name: "", category: "phone_screen", productType: "part", description: "", compatibility: "", price: "", stock: "", externalUrl: "" }); setProductImage(null); setShowProductForm(false); };
  const saveNewProduct = async () => {
    const result = await upsertProduct.mutateAsync({ sku: productForm.sku, name: productForm.name, category: productForm.category as "phone_screen" | "charging_port" | "battery" | "laptop_spare" | "accessory" | "other", productType: productForm.productType as "part" | "device" | "accessory" | "service", description: productForm.description, compatibility: productForm.compatibility, externalUrl: productForm.externalUrl || undefined, price: Number(productForm.price), stock: Number(productForm.stock) });
    if (productImage) {
      const base64 = await readImageAsBase64(productImage);
      await uploadProductImage.mutateAsync({ id: result.id, fileName: productImage.name, mimeType: productImage.type as "image/jpeg" | "image/png" | "image/webp", base64 });
    }
    resetProductForm();
  };
  const replaceProductImage = async (id: number, file: File) => {
    const base64 = await readImageAsBase64(file);
    await uploadProductImage.mutateAsync({ id, fileName: file.name, mimeType: file.type as "image/jpeg" | "image/png" | "image/webp", base64 });
  };

  return (
    <div className="mx-auto max-w-7xl animate-fade-up space-y-7 px-1 pb-10 text-slate-100 sm:px-0">
      <header className="premium-panel relative overflow-hidden rounded-[2rem] p-5 sm:p-7"><div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" /><div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Owner operations</div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-white sm:text-5xl">Good morning, {user?.name?.split(" ")[0] || "owner"}.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">One calm view of repair intake, devices in the workshop, spare-parts stock and customer order requests.</p><div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400"><span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.07] px-3 py-1.5 text-emerald-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />Operations live</span><span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">Siaya service desk · Mon–Sat</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refreshAll()} disabled={summary.isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${summary.isFetching ? "animate-spin" : ""}`} />Refresh</Button>
          <Button size="sm" onClick={() => selectSection("repairs")}><ClipboardList className="mr-2 h-4 w-4" />Open queue</Button>
        </div>
      </div></header>

      <nav className="premium-panel flex flex-wrap gap-2 rounded-2xl p-2" aria-label="Owner sections">
        {(["overview", "repairs", "inventory", "orders", "team"] as Section[]).map(item => (
          <button key={item} onClick={() => selectSection(item)} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition ${section === item ? "bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-400/10" : "text-slate-400 hover:bg-white/[0.07] hover:text-white"}`}>{statusLabel(item)}</button>
        ))}
      </nav>

      {(queryError || mutationError) && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-300/20 bg-rose-300/[0.08] p-4 text-sm text-rose-100 shadow-lg shadow-rose-950/10"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /><div><strong>Something needs attention.</strong><p className="mt-1">The latest operation did not complete. Refresh the workspace and try again; no partial update was applied.</p></div></div>}

      {section === "overview" && (
        <div className="space-y-8">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
            <Metric label="New requests" value={summary.data?.newRepairs ?? 0} hint="Waiting for first action" icon={ClipboardList} tone="border-amber-300/20 bg-amber-300/10 text-amber-100" />
            <Metric label="In progress" value={summary.data?.activeRepairs ?? 0} hint="Diagnostics or repair" icon={Activity} tone="border-cyan-300/20 bg-cyan-300/10 text-cyan-100" />
            <Metric label="Quotes" value={summary.data?.awaitingApproval ?? 0} hint="Waiting for customer approval" icon={ClipboardList} tone="border-violet-300/20 bg-violet-300/10 text-violet-100" />
            <Metric label="Ready" value={summary.data?.readyRepairs ?? 0} hint="Ready for collection" icon={Check} tone="border-emerald-300/20 bg-emerald-300/10 text-emerald-100" />
            <Metric label="Low stock" value={summary.data?.lowStock ?? 0} hint="At or below reorder level" icon={Boxes} tone="border-violet-300/20 bg-violet-300/10 text-violet-100" />
            <Metric label="Orders" value={summary.data?.pendingOrders ?? 0} hint="Waiting for confirmation" icon={PackagePlus} tone="border-orange-300/20 bg-orange-300/10 text-orange-100" />
            <Metric label="Team" value={summary.data?.activeTechnicians ?? 0} hint="Available technicians" icon={Users} tone="border-emerald-300/20 bg-emerald-300/10 text-emerald-100" />
          </section>
          <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
            <section className="premium-panel premium-panel-hover rounded-3xl p-6">
              <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Attention board</p><h2 className="mt-2 text-xl font-semibold">What needs a decision?</h2></div><button className="text-sm font-semibold text-primary" onClick={() => selectSection("repairs")}>View queue <ArrowUpRight className="ml-1 inline h-4 w-4" /></button></div>
              <div className="mt-6 space-y-3">
                <AttentionRow icon={ClipboardList} title="New repair requests" value={summary.data?.newRepairs ?? 0} action="Review intake" onClick={() => selectSection("repairs")} />
                <AttentionRow icon={ClipboardList} title="Quotes waiting for approval" value={summary.data?.awaitingApproval ?? 0} action="Review quotes" onClick={() => { setRepairFilter("awaiting_approval"); selectSection("repairs"); }} />
                <AttentionRow icon={Boxes} title="Parts below reorder level" value={summary.data?.lowStock ?? 0} action="Check inventory" onClick={() => selectSection("inventory")} />
                <AttentionRow icon={PackagePlus} title="Spare-part orders waiting" value={summary.data?.pendingOrders ?? 0} action="Process orders" onClick={() => selectSection("orders")} />
              </div>
            </section>
            <section className="rounded-3xl border bg-gradient-to-br from-primary to-indigo-700 p-6 text-primary-foreground shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">Owner control</p><h2 className="mt-3 text-2xl font-semibold tracking-tight">Keep the next step visible.</h2><p className="mt-3 text-sm leading-6 text-blue-100">Update one ticket, one part or one order at a time. The public team can then work from the same source of truth.</p><div className="mt-7 grid grid-cols-2 gap-2 text-xs"><div className="rounded-2xl bg-white/10 p-3"><Wrench className="mb-2 h-4 w-4 text-cyan-200" />Repair stages</div><div className="rounded-2xl bg-white/10 p-3"><Boxes className="mb-2 h-4 w-4 text-cyan-200" />Stock control</div></div></section>
          </div>
        </div>
      )}

      {section === "repairs" && (
        <section className="space-y-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Workshop queue</p><h2 className="mt-2 text-2xl font-semibold">Repair requests</h2><p className="mt-2 text-sm text-muted-foreground">Assign a technician, move the stage forward and leave a useful internal note.</p></div><div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={repairSearch} onChange={event => setRepairSearch(event.target.value)} placeholder="Search requests" className="pl-9 sm:w-56" aria-label="Search repair requests" /></label><select value={repairFilter} onChange={event => setRepairFilter(event.target.value)} className="h-10 rounded-lg border bg-background px-3 text-sm"><option value="all">All stages</option>{repairStatuses.map(status => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></div></div>
          <div className="space-y-4">{repairs.isLoading ? <LoadingState label="Loading repair queue" /> : filteredRepairs.length === 0 ? <EmptyState icon={ClipboardList} title="No repair requests in this view" body="Public booking requests will appear here once customers submit them." /> : filteredRepairs.map(row => <RepairRow key={row.ticket.id} row={row} technicians={technicians.data ?? []} note={noteDrafts[row.ticket.id] ?? ""} onNoteChange={value => setNoteDrafts(current => ({ ...current, [row.ticket.id]: value }))} onUpdate={(payload) => updateRepair.mutate({ id: row.ticket.id, ...payload })} onAddNote={() => { const note = noteDrafts[row.ticket.id]?.trim(); if (note) addNote.mutate({ ticketId: row.ticket.id, note }); }} onHistory={() => setHistoryFor(current => current?.customerId === row.ticket.customerId && current?.deviceId === row.ticket.deviceId ? null : { customerId: row.ticket.customerId, deviceId: row.ticket.deviceId })} history={historyFor?.customerId === row.ticket.customerId && historyFor?.deviceId === row.ticket.deviceId ? history.data : undefined} historyLoading={history.isFetching} busy={updateRepair.isPending || addNote.isPending} />)}</div>
        </section>
      )}

      {section === "inventory" && (
        <section className="space-y-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Commerce desk</p><h2 className="mt-2 text-2xl font-semibold">Shop catalogue</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Add parts, laptops, accessories or services once and publish them to the customer shop. Use an external link when a device is sold through another website.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => { setShowProductForm(true); setProductForm({ sku: "", name: "LCD screen replacement — add model", category: "phone_screen", productType: "part", description: "Screen/display assembly. Confirm the exact phone model and quality before fulfilment.", compatibility: "Add exact compatible model", price: "", stock: "", externalUrl: "" }); }}><Smartphone className="mr-2 h-4 w-4" />Start an LCD listing</Button><Button variant="outline" onClick={() => { setShowProductForm(true); setProductForm({ sku: "", name: "Laptop — add model", category: "other", productType: "device", description: "Add the exact laptop model, condition and fulfilment details.", compatibility: "Add brand and model", price: "", stock: "", externalUrl: "" }); }}><Laptop className="mr-2 h-4 w-4" />Start a laptop listing</Button><Button onClick={() => setShowProductForm(value => !value)}><Plus className="mr-2 h-4 w-4" />Add product</Button></div></div>
          {showProductForm && <ProductForm form={productForm} setForm={setProductForm} image={productImage} setImage={setProductImage} onCancel={resetProductForm} onSubmit={saveNewProduct} busy={upsertProduct.isPending || uploadProductImage.isPending} />}
          {lowStockProducts.length > 0 && <div className="rounded-2xl border border-violet-300/20 bg-violet-300/10 p-4 text-sm text-violet-100"><strong>{lowStockProducts.length} item{lowStockProducts.length === 1 ? "" : "s"}</strong> need stock attention: {lowStockProducts.map(item => item.name).join(", ")}.</div>}<div className="grid gap-3 sm:grid-cols-3"><div className="premium-panel rounded-2xl p-4"><p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Live listings</p><p className="mt-2 text-2xl font-bold text-white">{products.data?.length ?? 0}</p><p className="mt-1 text-xs text-slate-500">Visible in the public shop</p></div><div className="premium-panel rounded-2xl p-4"><p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Low stock</p><p className="mt-2 text-2xl font-bold text-violet-200">{lowStockProducts.length}</p><p className="mt-1 text-xs text-slate-500">Review before promising</p></div><div className="premium-panel rounded-2xl p-4"><p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Shop promise</p><p className="mt-2 text-2xl font-bold text-emerald-200">Ready</p><p className="mt-1 text-xs text-slate-500">Orders are handled by the desk</p></div></div>
          <div className="premium-panel overflow-hidden rounded-3xl">{products.isLoading ? <LoadingState label="Loading inventory" /> : products.data?.length ? <div className="divide-y">{products.data.map(product => <ProductRow key={product.id} product={product} onSave={payload => upsertProduct.mutate(payload)} onUpload={replaceProductImage} onRemove={() => { if (window.confirm(`Remove ${product.name} from the public shop? Existing order history will be kept.`)) removeProduct.mutate({ id: product.id }); }} busy={upsertProduct.isPending || uploadProductImage.isPending || removeProduct.isPending} />)}</div> : <EmptyState icon={Boxes} title="Your shop is ready for setup" body="Add the first part, laptop, accessory or service listing with its SKU, price and fulfilment details." />}</div>
        </section>
      )}

      {section === "orders" && (
        <section className="space-y-5"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Fulfillment desk</p><h2 className="mt-2 text-2xl font-semibold">Shop order requests</h2><p className="mt-2 text-sm text-muted-foreground">Confirm the item, delivery or collection before moving an order forward.</p></div><label className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={orderSearch} onChange={event => setOrderSearch(event.target.value)} placeholder="Search orders" className="pl-9 sm:w-56" aria-label="Search spare-part orders" /></label></div><div className="space-y-4">{orders.isLoading ? <LoadingState label="Loading order requests" /> : filteredOrders.length ? filteredOrders.map(row => <div key={row.order.id} className="premium-panel premium-panel-hover rounded-3xl p-5"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm font-semibold text-primary">{row.order.reference}</span><Badge className={statusTone(row.order.status)}>{statusLabel(row.order.status)}</Badge></div><h3 className="mt-2 font-semibold">{row.customer?.name || "Customer"} · {row.customer?.phone || "No phone"}</h3><p className="mt-1 text-sm text-muted-foreground">{row.order.fulfillment === "delivery" ? `Delivery: ${row.order.deliveryLocation || "Location to confirm"}` : "Collection at Siaya service desk"} · {formatDate(row.order.createdAt)}</p></div><div className="text-left sm:text-right"><p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Order total</p><p className="mt-1 text-xl font-semibold">KES {(row.order.total ?? 0).toLocaleString()}</p></div></div><div className="mt-5 rounded-2xl bg-muted/50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Requested items</p>{row.items.length ? <div className="mt-3 space-y-2">{row.items.map(item => <div key={item.id} className="flex items-center justify-between gap-3 text-sm"><span>{item.productNameSnapshot} <span className="text-xs text-muted-foreground">× {item.quantity}</span></span><span className="font-medium">KES {item.unitPrice.toLocaleString()}</span></div>)}</div> : <p className="mt-2 text-sm text-muted-foreground">No item details were attached to this request.</p>}</div>{row.order.notes && <div className="mt-4 rounded-2xl border border-cyan-300/10 bg-cyan-300/5 p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">Customer notes</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{row.order.notes}</p></div>}<div className="mt-5 flex flex-col gap-3 border-t pt-4"><CustomerActions phone={row.customer?.phone} email={row.customer?.email} reference={row.order.reference} /><div className="flex flex-wrap gap-2">{orderStatuses.map(status => <Button key={status} size="sm" variant={status === row.order.status ? "default" : "outline"} onClick={() => updateOrder.mutate({ id: row.order.id, status })} disabled={updateOrder.isPending}>{statusLabel(status)}</Button>)}</div></div></div>) : <EmptyState icon={PackagePlus} title="No shop orders yet" body="Orders from the public catalogue will appear here for confirmation and fulfilment." />}</div></section>
      )}

      {section === "team" && (
        <section className="space-y-5"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Workshop team</p><h2 className="mt-2 text-2xl font-semibold">Technician roster</h2><p className="mt-2 text-sm text-muted-foreground">Keep the people available for repair assignment current and easy to recognize.</p></div><Button onClick={() => { setEditingTechnicianId(0); setTechnicianForm({ name: "", phone: "", specialty: "" }); setTechnicianActive(true); }}><Plus className="mr-2 h-4 w-4" />Add technician</Button></div>{editingTechnicianId !== null && <form onSubmit={event => { event.preventDefault(); upsertTechnician.mutate({ ...(editingTechnicianId > 0 ? { id: editingTechnicianId } : {}), name: technicianForm.name, phone: technicianForm.phone || undefined, specialty: technicianForm.specialty || undefined, active: technicianActive }); }} className="rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-cyan-300/10 via-slate-900 to-violet-300/10 p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">{editingTechnicianId > 0 ? "Edit roster record" : "New roster record"}</p><h3 className="mt-2 text-xl font-semibold text-white">Technician details</h3></div><button type="button" onClick={() => setEditingTechnicianId(null)} aria-label="Close technician form"><X className="h-5 w-5 text-slate-400" /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-3"><label className="text-sm font-medium text-slate-200">Name<Input required className="mt-1" value={technicianForm.name} onChange={event => setTechnicianForm(current => ({ ...current, name: event.target.value }))} placeholder="Technician name" /></label><label className="text-sm font-medium text-slate-200">Phone<Input className="mt-1" value={technicianForm.phone} onChange={event => setTechnicianForm(current => ({ ...current, phone: event.target.value }))} placeholder="0718 114 009" /></label><label className="text-sm font-medium text-slate-200">Specialty<Input className="mt-1" value={technicianForm.specialty} onChange={event => setTechnicianForm(current => ({ ...current, specialty: event.target.value }))} placeholder="Screens, laptops..." /></label></div><div className="mt-5 flex flex-col justify-between gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center"><label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={technicianActive} onChange={event => setTechnicianActive(event.target.checked)} className="h-4 w-4 accent-cyan-300" />Available for new assignments</label><Button type="submit" disabled={upsertTechnician.isPending || technicianForm.name.trim().length < 2}>{upsertTechnician.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}Save technician</Button></div></form>}<div className="premium-panel overflow-hidden rounded-3xl">{allTechnicians.isLoading ? <LoadingState label="Loading technician roster" /> : allTechnicians.data?.length ? <div className="divide-y">{allTechnicians.data.map(technician => <div key={technician.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-200"><Users className="h-5 w-5" /></div><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{technician.name}</h3><Badge className={technician.active ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200" : "border-slate-300/15 bg-slate-300/10 text-slate-400"}>{technician.active ? "Available" : "Inactive"}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{technician.specialty || "General device repair"}{technician.phone ? ` · ${technician.phone}` : ""}</p></div></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => { setEditingTechnicianId(technician.id); setTechnicianForm({ name: technician.name, phone: technician.phone || "", specialty: technician.specialty || "" }); setTechnicianActive(technician.active); }}>Edit record</Button><Button variant="outline" size="sm" onClick={() => upsertTechnician.mutate({ id: technician.id, name: technician.name, phone: technician.phone || undefined, specialty: technician.specialty || undefined, active: !technician.active })} disabled={upsertTechnician.isPending}>{technician.active ? "Set inactive" : "Set active"}</Button></div></div>)}</div> : <EmptyState icon={Users} title="No technicians added" body="Add the first team member so repair requests can be assigned with confidence." />}</div></section>
      )}
    </div>
  );
}

function AttentionRow({ icon: Icon, title, value, action, onClick }: { icon: typeof Activity; title: string; value: number; action: string; onClick: () => void }) {
  return <div className="flex items-center gap-3 rounded-2xl bg-muted/60 p-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-background text-primary"><Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{title}</p><p className="text-xs text-muted-foreground">{value} waiting</p></div><button onClick={onClick} className="text-xs font-semibold text-primary">{action}</button></div>;
}

function LoadingState({ label }: { label: string }) {
  return <div className="grid place-items-center gap-3 rounded-3xl border bg-card p-12 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />{label}</div>;
}

function EmptyState({ icon: Icon, title, body }: { icon: typeof Activity; title: string; body: string }) {
  return <div className="grid place-items-center gap-2 rounded-3xl border border-dashed bg-muted/30 p-12 text-center"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-6 w-6" /></span><h3 className="mt-2 font-semibold">{title}</h3><p className="max-w-md text-sm text-muted-foreground">{body}</p></div>;
}

function CustomerActions({ phone, email, reference }: { phone?: string | null; email?: string | null; reference: string }) {
  const [copied, setCopied] = useState(false);
  const digits = (phone ?? "").replace(/\D/g, "");
  const whatsapp = digits ? (digits.startsWith("0") ? `254${digits.slice(1)}` : digits) : "";
  const copyReference = async () => {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(reference);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  return <div className="flex flex-wrap gap-2" aria-label="Customer actions">
    {phone && <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-cyan-300/30 hover:text-cyan-200"><PhoneCall className="h-3.5 w-3.5" />Call</a>}
    {whatsapp && <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Digital Phone Hub request ${reference}`)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-emerald-300/30 hover:text-emerald-200"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</a>}
    {email && <a href={`mailto:${email}`} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-violet-300/30 hover:text-violet-200"><Mail className="h-3.5 w-3.5" />Email</a>}
    <button type="button" onClick={copyReference} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-cyan-300/30 hover:text-cyan-200"><Copy className="h-3.5 w-3.5" />{copied ? "Copied" : "Copy ref"}</button>
  </div>;
}

function RepairRow({ row, technicians, note, onNoteChange, onUpdate, onAddNote, onHistory, history, historyLoading, busy }: { row: any; technicians: Array<{ id: number; name: string; specialty: string | null }>; note: string; onNoteChange: (value: string) => void; onUpdate: (payload: { status?: typeof repairStatuses[number]; technicianId?: number | null; quotedAmount?: number | null }) => void; onAddNote: () => void; onHistory: () => void; history?: { tickets: any[]; notes: any[] }; historyLoading: boolean; busy: boolean }) {
  const device = row.device;
  const [quoteDraft, setQuoteDraft] = useState(row.ticket.quotedAmount == null ? "" : String(row.ticket.quotedAmount));
  const saveQuote = () => onUpdate({ quotedAmount: quoteDraft.trim() ? Math.max(0, Number(quoteDraft)) : null, status: quoteDraft.trim() ? "awaiting_approval" : undefined });
  return <article className="premium-panel premium-panel-hover rounded-3xl p-5"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start"><div className="flex min-w-0 gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">{device?.type === "laptop" ? <Laptop className="h-6 w-6" /> : <Phone className="h-6 w-6" />}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm font-semibold text-primary">{row.ticket.reference}</span><Badge className={statusTone(row.ticket.status)}>{statusLabel(row.ticket.status)}</Badge></div><h3 className="mt-2 text-lg font-semibold">{device ? `${device.brand} ${device.model}` : "Device"}</h3><p className="mt-1 text-sm text-muted-foreground">{row.customer?.name || "Customer"} · {row.customer?.phone || "No phone"} · received {formatDate(row.ticket.receivedAt)}</p><p className="mt-3 max-w-2xl text-sm leading-6">{row.ticket.issue}</p></div></div><div className="flex flex-col gap-2 sm:flex-row lg:flex-col"><label className="text-xs font-medium text-muted-foreground">Stage<select value={row.ticket.status} onChange={event => onUpdate({ status: event.target.value as typeof repairStatuses[number] })} disabled={busy} className="mt-1 h-10 w-full rounded-lg border bg-background px-3 text-sm sm:w-56"><option value="received">Received</option><option value="diagnostics">Diagnostics</option><option value="awaiting_approval">Awaiting approval</option><option value="in_repair">In repair</option><option value="ready">Ready</option><option value="collected">Collected</option><option value="cancelled">Cancelled</option></select></label><label className="text-xs font-medium text-muted-foreground">Technician<select value={row.ticket.technicianId ?? ""} onChange={event => onUpdate({ technicianId: event.target.value ? Number(event.target.value) : null })} disabled={busy} className="mt-1 h-10 w-full rounded-lg border bg-background px-3 text-sm sm:w-56"><option value="">Unassigned</option>{technicians.map(technician => <option key={technician.id} value={technician.id}>{technician.name}{technician.specialty ? ` · ${technician.specialty}` : ""}</option>)}</select></label></div></div><div className="mt-4 grid gap-3 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.05] p-4 sm:grid-cols-[1fr_auto] sm:items-end"><label className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">Repair quote (KES)<Input type="number" min="0" value={quoteDraft} onChange={event => setQuoteDraft(event.target.value)} placeholder="Enter amount after diagnosis" className="mt-2 bg-background text-sm normal-case tracking-normal" /></label><Button type="button" variant="outline" onClick={saveQuote} disabled={busy || (quoteDraft.trim() !== "" && Number.isNaN(Number(quoteDraft)))}>{quoteDraft.trim() ? "Save quote & request approval" : "Clear quote"}</Button></div><div className="mt-4 flex flex-col justify-between gap-3 border-t pt-4 sm:flex-row sm:items-center"><button type="button" onClick={onHistory} className="inline-flex items-center gap-2 text-xs font-semibold text-primary"><History className="h-4 w-4" />{history ? "Hide customer history" : "View customer history"}</button><CustomerActions phone={row.customer?.phone} email={row.customer?.email} reference={row.ticket.reference} />{historyLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}</div>{history && <div className="mt-4 rounded-2xl bg-muted/50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Previous work on this device</p><div className="mt-3 space-y-2">{history.tickets.map(ticketRow => <div key={ticketRow.ticket.id} className="flex flex-col justify-between gap-1 text-sm sm:flex-row"><span><strong>{ticketRow.ticket.reference}</strong> · {statusLabel(ticketRow.ticket.status)}</span><span className="text-xs text-muted-foreground">{formatDate(ticketRow.ticket.createdAt)}{ticketRow.technician ? ` · ${ticketRow.technician.name}` : ""}</span></div>)}</div>{history.notes.length > 0 && <div className="mt-4 border-t pt-3"><p className="text-xs font-semibold text-muted-foreground">Technician notes</p>{history.notes.slice(0, 4).map(noteRow => <p key={noteRow.id} className="mt-2 text-xs leading-5 text-muted-foreground">{noteRow.note}</p>)}</div>}</div>}<div className="mt-5 flex flex-col gap-2 border-t pt-4 sm:flex-row"><Input value={note} onChange={event => onNoteChange(event.target.value)} placeholder="Add an internal technician note" maxLength={4000} /><Button variant="outline" onClick={onAddNote} disabled={busy || !note.trim()}><Plus className="mr-2 h-4 w-4" />Add note</Button></div></article>;
}

function ProductRow({ product, onSave, onUpload, onRemove, busy }: { product: any; onSave: (payload: any) => void; onUpload: (id: number, file: File) => Promise<void>; onRemove: () => void; busy: boolean }) {
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draft, setDraft] = useState({ name: product.name, category: product.category, productType: product.productType ?? "part", description: product.description ?? "", compatibility: product.compatibility ?? "", price: String(product.price), stock: String(product.stock), availability: product.availability, externalUrl: product.externalUrl ?? "" });
  useEffect(() => { setDraft({ name: product.name, category: product.category, productType: product.productType ?? "part", description: product.description ?? "", compatibility: product.compatibility ?? "", price: String(product.price), stock: String(product.stock), availability: product.availability, externalUrl: product.externalUrl ?? "" }); }, [product.id, product.name, product.category, product.productType, product.description, product.compatibility, product.price, product.stock, product.availability, product.externalUrl]);
  const update = (key: string, value: string) => setDraft(current => ({ ...current, [key]: value }));
  const save = () => onSave({ id: product.id, sku: product.sku, name: draft.name, category: draft.category, productType: draft.productType, description: draft.description || undefined, compatibility: draft.compatibility || undefined, externalUrl: draft.externalUrl || undefined, price: Math.max(0, Number(draft.price)), stock: Math.max(0, Number(draft.stock)), availability: draft.availability });
  const chooseReplacement = async (file: File | undefined) => { if (!validateProductImage(file)) return; setUploading(true); try { const cleaned = await cleanProductBackground(file as File).catch(() => file as File); await onUpload(product.id, cleaned); } finally { setUploading(false); } };
  return <div className="flex flex-col gap-4 p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex min-w-0 items-start gap-4"><div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-primary/10">{product.imageUrl ? <img src={product.imageUrl} alt={`${product.name} listing`} className="h-full w-full bg-white object-contain p-1" /> : <div className="grid h-full w-full place-items-center text-primary">{draft.productType === "device" || product.category === "laptop_spare" ? <Laptop className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}</div>}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{product.name}</h3><Badge className="border-cyan-300/20 bg-cyan-300/10 text-cyan-200">{productTypeLabels[product.productType] ?? "Part"}</Badge><Badge className={statusTone(product.availability)}>{statusLabel(product.availability)}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{product.sku} · {product.compatibility || "Compatibility note not added"}</p>{product.externalUrl && <a href={product.externalUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">External destination <ArrowUpRight className="h-3.5 w-3.5" /></a>}<label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-cyan-200"><UploadCloud className="h-3.5 w-3.5" />{uploading ? "Uploading image…" : product.imageUrl ? "Replace listing image" : "Add listing image"}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading || busy} onChange={event => { const file = event.target.files?.[0]; event.currentTarget.value = ""; void chooseReplacement(file); }} /></label></div></div>{!editing && <div className="flex items-center gap-3 text-sm"><span className={`rounded-full px-3 py-1 font-semibold ${product.stock <= product.reorderLevel ? "border border-violet-300/20 bg-violet-300/10 text-violet-100" : "bg-muted text-muted-foreground"}`}>{product.stock} in stock</span><span className="font-semibold">KES {product.price.toLocaleString()}</span><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit listing</Button><Button variant="outline" size="sm" onClick={onRemove} disabled={busy || uploading} className="text-rose-200 hover:text-rose-100"><Trash2 className="mr-1.5 h-3.5 w-3.5" />Remove</Button></div></div>}</div>{editing && <div className="grid gap-3 rounded-2xl bg-muted/50 p-4 sm:grid-cols-2"><label className="text-xs font-medium text-muted-foreground">Name<Input value={draft.name} onChange={event => update("name", event.target.value)} /></label><label className="text-xs font-medium text-muted-foreground">Listing type<select className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" value={draft.productType} onChange={event => update("productType", event.target.value)}><option value="part">Spare part</option><option value="device">Device / laptop</option><option value="accessory">Accessory</option><option value="service">Service</option></select></label><label className="text-xs font-medium text-muted-foreground">Category<select className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" value={draft.category} onChange={event => update("category", event.target.value)}><option value="phone_screen">Phone screen</option><option value="charging_port">Charging port</option><option value="battery">Battery</option><option value="laptop_spare">Laptop spare</option><option value="accessory">Accessory</option><option value="other">Other</option></select></label><label className="text-xs font-medium text-muted-foreground">Price (KES)<Input type="number" min="0" value={draft.price} onChange={event => update("price", event.target.value)} /></label><label className="text-xs font-medium text-muted-foreground">Stock<Input type="number" min="0" value={draft.stock} onChange={event => update("stock", event.target.value)} /></label><label className="text-xs font-medium text-muted-foreground">Availability<select className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" value={draft.availability} onChange={event => update("availability", event.target.value)}><option value="in_stock">In stock</option><option value="low_stock">Low stock</option><option value="out_of_stock">Out of stock</option><option value="by_order">By order</option></select></label><label className="text-xs font-medium text-muted-foreground sm:col-span-2">Compatibility<Input value={draft.compatibility} onChange={event => update("compatibility", event.target.value)} /></label><label className="text-xs font-medium text-muted-foreground sm:col-span-2">External website (optional)<Input type="url" value={draft.externalUrl} onChange={event => update("externalUrl", event.target.value)} placeholder="https://your-shop.example/item" /></label><label className="text-xs font-medium text-muted-foreground sm:col-span-2">Description<textarea className="mt-1 min-h-20 w-full rounded-md border bg-background p-3 text-sm" value={draft.description} onChange={event => update("description", event.target.value)} /></label><div className="flex items-center justify-end gap-2 sm:col-span-2"><Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button><Button size="sm" onClick={() => { save(); setEditing(false); }} disabled={busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}Save changes</Button></div></div>}</div>;
}

function ProductForm({ form, setForm, image, setImage, onCancel, onSubmit, busy }: { form: { sku: string; name: string; category: string; productType: string; description: string; compatibility: string; price: string; stock: string; externalUrl: string }; setForm: (value: any) => void; image: File | null; setImage: (value: File | null) => void; onCancel: () => void; onSubmit: () => void; busy: boolean }) {
  const update = (key: string, value: string) => setForm({ ...form, [key]: value });
  const [cleaning, setCleaning] = useState(false);
  const [cleanupError, setCleanupError] = useState("");
  const chooseImage = async (file: File | undefined) => {
    if (!validateProductImage(file)) return;
    setCleanupError("");
    setImage(file as File);
    setCleaning(true);
    try {
      const cleaned = await cleanProductBackground(file as File);
      setImage(cleaned);
    } catch {
      setCleanupError("Automatic cleanup was unavailable, so the original image is ready to upload.");
    } finally {
      setCleaning(false);
    }
  };
  const previewUrl = image ? URL.createObjectURL(image) : "";
  const invalid = busy || !form.sku.trim() || !form.name.trim() || form.price === "" || form.stock === "" || Number(form.price) < 0 || Number(form.stock) < 0;
  return <div className="premium-panel premium-panel-hover rounded-3xl p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">New shop listing</p><h3 className="mt-2 text-xl font-semibold">Add a product</h3><p className="mt-2 text-sm text-muted-foreground">Publish a part, laptop, accessory or service with enough information for a customer to make the next decision.</p></div><button onClick={onCancel} aria-label="Close product form"><X className="h-5 w-5 text-muted-foreground" /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">SKU<Input className="mt-1" value={form.sku} onChange={event => update("sku", event.target.value)} placeholder="DPH-SCR-001" /></label><label className="text-sm font-medium">Name<Input className="mt-1" value={form.name} onChange={event => update("name", event.target.value)} placeholder="iPhone 11 Screen Assembly or HP EliteBook 840" /></label><label className="text-sm font-medium">Listing type<select className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.productType} onChange={event => update("productType", event.target.value)}><option value="part">Spare part</option><option value="device">Device / laptop</option><option value="accessory">Accessory</option><option value="service">Service</option></select></label><label className="text-sm font-medium">Category<select className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.category} onChange={event => update("category", event.target.value)}><option value="phone_screen">Phone screen</option><option value="charging_port">Charging port</option><option value="battery">Battery</option><option value="laptop_spare">Laptop spare</option><option value="accessory">Accessory</option><option value="other">Other</option></select></label><label className="text-sm font-medium">Price (KES)<Input className="mt-1" type="number" min="0" value={form.price} onChange={event => update("price", event.target.value)} /></label><label className="text-sm font-medium">Stock quantity<Input className="mt-1" type="number" min="0" value={form.stock} onChange={event => update("stock", event.target.value)} /><span className="mt-1 block text-xs font-normal text-muted-foreground">Use 0 when the item is available by order.</span></label><label className="text-sm font-medium">Compatibility or model<Input className="mt-1" value={form.compatibility} onChange={event => update("compatibility", event.target.value)} placeholder="Exact brand, model or fit details" /></label><label className="text-sm font-medium">External website (optional)<Input className="mt-1" type="url" value={form.externalUrl} onChange={event => update("externalUrl", event.target.value)} placeholder="https://your-other-shop.example/item" /><span className="mt-1 block text-xs font-normal text-muted-foreground">Use this when the customer should complete the purchase on another website.</span></label><label className="text-sm font-medium sm:col-span-2">Description<textarea className="mt-1 min-h-24 w-full rounded-md border bg-background p-3 text-sm" value={form.description} onChange={event => update("description", event.target.value)} placeholder="Condition, included items, warranty, model details, and what the customer should know." /></label><label className="sm:col-span-2 rounded-2xl border border-dashed border-cyan-300/25 bg-cyan-300/[0.04] p-4 text-sm font-medium"><span className="flex items-center gap-2 text-cyan-200"><UploadCloud className="h-4 w-4" />Product photo <span className="text-xs font-normal text-slate-400">JPG, PNG or WebP · max 6 MB</span></span><p className="mt-2 text-xs leading-5 text-slate-400">Choose a product photo and the free browser cleanup will remove the background before upload. The original stays on your device if cleanup fails.</p><input className="mt-3 block w-full text-sm text-slate-300 file:mr-3 file:rounded-full file:border-0 file:bg-cyan-300 file:px-4 file:py-2 file:font-semibold file:text-slate-950" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => { void chooseImage(event.target.files?.[0]); }} /><div className="mt-3 flex items-center gap-3">{previewUrl && <img src={previewUrl} alt="Cleaned product preview" className="h-20 w-20 rounded-xl border border-white/10 bg-white object-contain p-1" />}<span className="text-xs text-slate-400">{cleaning ? <span className="inline-flex items-center gap-2 text-cyan-200"><Loader2 className="h-3.5 w-3.5 animate-spin" />Cleaning background locally…</span> : image ? <span className="inline-flex items-center gap-2 text-emerald-200"><WandSparkles className="h-3.5 w-3.5" />Ready: {image.name}</span> : "Use a clear product photo. The cleaned preview is what will be uploaded."}</span></div>{cleanupError && <p className="mt-2 text-xs text-amber-200">{cleanupError}</p>}</label></div><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={onCancel}>Cancel</Button><Button onClick={onSubmit} disabled={invalid || cleaning}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}Publish listing</Button></div></div>;
}
