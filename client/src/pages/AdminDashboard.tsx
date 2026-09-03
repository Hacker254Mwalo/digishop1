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
  History,
  Laptop,
  Loader2,
  PackagePlus,
  Phone,
  Plus,
  RefreshCw,
  ShieldAlert,
  Smartphone,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Section = "overview" | "repairs" | "inventory" | "orders";
const repairStatuses = ["received", "diagnostics", "awaiting_approval", "in_repair", "ready", "collected", "cancelled"] as const;
const orderStatuses = ["new", "confirmed", "fulfilled", "cancelled"] as const;

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

function Metric({ label, value, hint, icon: Icon, tone }: { label: string; value: number; hint: string; icon: typeof Activity; tone: string }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${tone}`}>
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
    return requested && ["overview", "repairs", "inventory", "orders"].includes(requested) ? requested : "overview";
  });
  useEffect(() => {
    const syncSection = () => {
      const requested = new URLSearchParams(window.location.search).get("section") as Section | null;
      setSection(requested && ["overview", "repairs", "inventory", "orders"].includes(requested) ? requested : "overview");
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
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({ sku: "", name: "", category: "phone_screen", description: "", compatibility: "", price: "", stock: "" });
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({});
  const [historyFor, setHistoryFor] = useState<{ customerId: number; deviceId: number } | null>(null);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [productEdit, setProductEdit] = useState({ price: "", stock: "", availability: "in_stock" });
  const utils = trpc.useUtils();
  const isAdmin = user?.role === "admin";
  const summary = trpc.admin.summary.useQuery(undefined, { enabled: isAdmin });
  const repairs = trpc.admin.repairs.useQuery(undefined, { enabled: isAdmin });
  const products = trpc.admin.products.useQuery(undefined, { enabled: isAdmin });
  const orders = trpc.admin.orders.useQuery(undefined, { enabled: isAdmin });
  const technicians = trpc.admin.technicians.useQuery(undefined, { enabled: isAdmin });
  const updateRepair = trpc.admin.updateRepair.useMutation({ onSuccess: () => utils.admin.repairs.invalidate().then(() => utils.admin.summary.invalidate()) });
  const addNote = trpc.admin.addNote.useMutation({ onSuccess: (_, variables) => { setNoteDrafts(current => ({ ...current, [variables.ticketId]: "" })); return utils.admin.repairs.invalidate(); } });
  const upsertProduct = trpc.admin.upsertProduct.useMutation({ onSuccess: () => { setProductForm({ sku: "", name: "", category: "phone_screen", description: "", compatibility: "", price: "", stock: "" }); setShowProductForm(false); return Promise.all([utils.admin.products.invalidate(), utils.admin.summary.invalidate()]); } });
  const updateOrder = trpc.admin.updateOrder.useMutation({ onSuccess: () => Promise.all([utils.admin.orders.invalidate(), utils.admin.summary.invalidate()]) });

  const filteredRepairs = useMemo(() => repairs.data?.filter(row => repairFilter === "all" || row.ticket.status === repairFilter) ?? [], [repairs.data, repairFilter]);
  const lowStockProducts = useMemo(() => products.data?.filter(product => product.stock <= product.reorderLevel) ?? [], [products.data]);
  const historyInput = useMemo(() => historyFor ?? { customerId: 0, deviceId: 0 }, [historyFor]);
  const history = trpc.admin.customerHistory.useQuery(historyInput, { enabled: isAdmin && Boolean(historyFor) });
  const queryError = summary.error || repairs.error || products.error || orders.error || technicians.error || history.error;
  const mutationError = updateRepair.error || addNote.error || upsertProduct.error || updateOrder.error;

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

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-2 pb-10 text-slate-100 sm:px-4">
      <header className="flex flex-col justify-between gap-5 border-b pb-6 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Owner operations</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Good morning, {user?.name?.split(" ")[0] || "owner"}.</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">One calm view of repair intake, devices in the workshop, spare-parts stock and customer order requests.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refreshAll()} disabled={summary.isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${summary.isFetching ? "animate-spin" : ""}`} />Refresh</Button>
          <Button size="sm" onClick={() => selectSection("repairs")}><ClipboardList className="mr-2 h-4 w-4" />Open queue</Button>
        </div>
      </header>

      <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Owner sections">
        {(["overview", "repairs", "inventory", "orders"] as Section[]).map(item => (
          <button key={item} onClick={() => selectSection(item)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${section === item ? "bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-400/10" : "bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white"}`}>{statusLabel(item)}</button>
        ))}
      </nav>

      {(queryError || mutationError) && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm text-rose-100"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /><div><strong>Something needs attention.</strong><p className="mt-1">The latest operation did not complete. Refresh the workspace and try again; no partial update was applied.</p></div></div>}

      {section === "overview" && (
        <div className="space-y-8">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Metric label="New requests" value={summary.data?.newRepairs ?? 0} hint="Waiting for first action" icon={ClipboardList} tone="border-amber-300/20 bg-amber-300/10 text-amber-100" />
            <Metric label="In progress" value={summary.data?.activeRepairs ?? 0} hint="Diagnostics or repair" icon={Activity} tone="border-cyan-300/20 bg-cyan-300/10 text-cyan-100" />
            <Metric label="Ready" value={summary.data?.readyRepairs ?? 0} hint="Ready for collection" icon={Check} tone="border-emerald-300/20 bg-emerald-300/10 text-emerald-100" />
            <Metric label="Low stock" value={summary.data?.lowStock ?? 0} hint="At or below reorder level" icon={Boxes} tone="border-violet-300/20 bg-violet-300/10 text-violet-100" />
            <Metric label="Orders" value={summary.data?.pendingOrders ?? 0} hint="Waiting for confirmation" icon={PackagePlus} tone="border-orange-300/20 bg-orange-300/10 text-orange-100" />
          </section>
          <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
            <section className="rounded-3xl border bg-card p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Attention board</p><h2 className="mt-2 text-xl font-semibold">What needs a decision?</h2></div><button className="text-sm font-semibold text-primary" onClick={() => selectSection("repairs")}>View queue <ArrowUpRight className="ml-1 inline h-4 w-4" /></button></div>
              <div className="mt-6 space-y-3">
                <AttentionRow icon={ClipboardList} title="New repair requests" value={summary.data?.newRepairs ?? 0} action="Review intake" onClick={() => selectSection("repairs")} />
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
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Workshop queue</p><h2 className="mt-2 text-2xl font-semibold">Repair requests</h2><p className="mt-2 text-sm text-muted-foreground">Assign a technician, move the stage forward and leave a useful internal note.</p></div><select value={repairFilter} onChange={event => setRepairFilter(event.target.value)} className="h-10 rounded-lg border bg-background px-3 text-sm"><option value="all">All stages</option>{repairStatuses.map(status => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></div>
          <div className="space-y-4">{repairs.isLoading ? <LoadingState label="Loading repair queue" /> : filteredRepairs.length === 0 ? <EmptyState icon={ClipboardList} title="No repair requests in this view" body="Public booking requests will appear here once customers submit them." /> : filteredRepairs.map(row => <RepairRow key={row.ticket.id} row={row} technicians={technicians.data ?? []} note={noteDrafts[row.ticket.id] ?? ""} onNoteChange={value => setNoteDrafts(current => ({ ...current, [row.ticket.id]: value }))} onUpdate={(payload) => updateRepair.mutate({ id: row.ticket.id, ...payload })} onAddNote={() => { const note = noteDrafts[row.ticket.id]?.trim(); if (note) addNote.mutate({ ticketId: row.ticket.id, note }); }} onHistory={() => setHistoryFor(current => current?.customerId === row.ticket.customerId && current.deviceId === row.ticket.deviceId ? null : { customerId: row.ticket.customerId, deviceId: row.ticket.deviceId })} history={historyFor?.customerId === row.ticket.customerId && historyFor?.deviceId === row.ticket.deviceId ? history.data : undefined} historyLoading={history.isFetching} busy={updateRepair.isPending || addNote.isPending} />)}</div>
        </section>
      )}

      {section === "inventory" && (
        <section className="space-y-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Parts desk</p><h2 className="mt-2 text-2xl font-semibold">Spare-parts inventory</h2><p className="mt-2 text-sm text-muted-foreground">Keep prices, availability and reorder levels accurate before a customer requests a part.</p></div><Button onClick={() => setShowProductForm(value => !value)}><Plus className="mr-2 h-4 w-4" />Add spare part</Button></div>
          {showProductForm && <ProductForm form={productForm} setForm={setProductForm} onCancel={() => setShowProductForm(false)} onSubmit={() => upsertProduct.mutate({ sku: productForm.sku, name: productForm.name, category: productForm.category as "phone_screen", description: productForm.description, compatibility: productForm.compatibility, price: Number(productForm.price), stock: Number(productForm.stock) })} busy={upsertProduct.isPending} />}
          {lowStockProducts.length > 0 && <div className="rounded-2xl border border-violet-300/20 bg-violet-300/10 p-4 text-sm text-violet-100"><strong>{lowStockProducts.length} item{lowStockProducts.length === 1 ? "" : "s"}</strong> need stock attention: {lowStockProducts.map(item => item.name).join(", ")}.</div>}
          <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">{products.isLoading ? <LoadingState label="Loading inventory" /> : products.data?.length ? <div className="divide-y">{products.data.map(product => <ProductRow key={product.id} product={product} onSave={payload => upsertProduct.mutate(payload)} busy={upsertProduct.isPending} />)}</div> : <EmptyState icon={Boxes} title="Inventory is ready for setup" body="Add the first spare part with its SKU, price, stock and compatibility details." />}</div>
        </section>
      )}

      {section === "orders" && (
        <section className="space-y-5"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Fulfillment desk</p><h2 className="mt-2 text-2xl font-semibold">Spare-part order requests</h2><p className="mt-2 text-sm text-muted-foreground">Confirm fit, delivery or collection before moving an order forward.</p></div><div className="space-y-4">{orders.isLoading ? <LoadingState label="Loading order requests" /> : orders.data?.length ? orders.data.map(row => <div key={row.order.id} className="rounded-3xl border bg-card p-5 shadow-sm"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm font-semibold text-primary">{row.order.reference}</span><Badge className={statusTone(row.order.status)}>{statusLabel(row.order.status)}</Badge></div><h3 className="mt-2 font-semibold">{row.customer?.name || "Customer"} · {row.customer?.phone || "No phone"}</h3><p className="mt-1 text-sm text-muted-foreground">{row.order.fulfillment === "delivery" ? `Delivery: ${row.order.deliveryLocation || "Location to confirm"}` : "Collection at Siaya service desk"} · {formatDate(row.order.createdAt)}</p></div><div className="text-left sm:text-right"><p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Order total</p><p className="mt-1 text-xl font-semibold">KES {(row.order.total ?? 0).toLocaleString()}</p></div></div><div className="mt-5 rounded-2xl bg-muted/50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Requested items</p>{row.items.length ? <div className="mt-3 space-y-2">{row.items.map(item => <div key={item.id} className="flex items-center justify-between gap-3 text-sm"><span>{item.productNameSnapshot} <span className="text-xs text-muted-foreground">× {item.quantity}</span></span><span className="font-medium">KES {item.unitPrice.toLocaleString()}</span></div>)}</div> : <p className="mt-2 text-sm text-muted-foreground">No item details were attached to this request.</p>}</div>{row.order.notes && <div className="mt-4 rounded-2xl border border-cyan-300/10 bg-cyan-300/5 p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">Customer notes</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{row.order.notes}</p></div>}<div className="mt-5 flex flex-wrap gap-2">{orderStatuses.map(status => <Button key={status} size="sm" variant={status === row.order.status ? "default" : "outline"} onClick={() => updateOrder.mutate({ id: row.order.id, status })} disabled={updateOrder.isPending}>{statusLabel(status)}</Button>)}</div></div>) : <EmptyState icon={PackagePlus} title="No spare-part orders yet" body="Orders from the public catalog will appear here for confirmation and fulfillment." />}</div></section>
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

function RepairRow({ row, technicians, note, onNoteChange, onUpdate, onAddNote, onHistory, history, historyLoading, busy }: { row: any; technicians: Array<{ id: number; name: string; specialty: string | null }>; note: string; onNoteChange: (value: string) => void; onUpdate: (payload: { status?: typeof repairStatuses[number]; technicianId?: number | null }) => void; onAddNote: () => void; onHistory: () => void; history?: { tickets: any[]; notes: any[] }; historyLoading: boolean; busy: boolean }) {
  const device = row.device;
  return <article className="rounded-3xl border bg-card p-5 shadow-sm"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start"><div className="flex min-w-0 gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">{device?.type === "laptop" ? <Laptop className="h-6 w-6" /> : <Phone className="h-6 w-6" />}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm font-semibold text-primary">{row.ticket.reference}</span><Badge className={statusTone(row.ticket.status)}>{statusLabel(row.ticket.status)}</Badge></div><h3 className="mt-2 text-lg font-semibold">{device ? `${device.brand} ${device.model}` : "Device"}</h3><p className="mt-1 text-sm text-muted-foreground">{row.customer?.name || "Customer"} · {row.customer?.phone || "No phone"} · received {formatDate(row.ticket.receivedAt)}</p><p className="mt-3 max-w-2xl text-sm leading-6">{row.ticket.issue}</p></div></div><div className="flex flex-col gap-2 sm:flex-row lg:flex-col"><label className="text-xs font-medium text-muted-foreground">Stage<select value={row.ticket.status} onChange={event => onUpdate({ status: event.target.value as typeof repairStatuses[number] })} disabled={busy} className="mt-1 h-10 w-full rounded-lg border bg-background px-3 text-sm sm:w-56"><option value="received">Received</option><option value="diagnostics">Diagnostics</option><option value="awaiting_approval">Awaiting approval</option><option value="in_repair">In repair</option><option value="ready">Ready</option><option value="collected">Collected</option><option value="cancelled">Cancelled</option></select></label><label className="text-xs font-medium text-muted-foreground">Technician<select value={row.ticket.technicianId ?? ""} onChange={event => onUpdate({ technicianId: event.target.value ? Number(event.target.value) : null })} disabled={busy} className="mt-1 h-10 w-full rounded-lg border bg-background px-3 text-sm sm:w-56"><option value="">Unassigned</option>{technicians.map(technician => <option key={technician.id} value={technician.id}>{technician.name}{technician.specialty ? ` · ${technician.specialty}` : ""}</option>)}</select></label></div></div><div className="mt-4 flex items-center justify-between gap-3"><button type="button" onClick={onHistory} className="inline-flex items-center gap-2 text-xs font-semibold text-primary"><History className="h-4 w-4" />{history ? "Hide customer history" : "View customer history"}</button>{historyLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}</div>{history && <div className="mt-4 rounded-2xl bg-muted/50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Previous work on this device</p><div className="mt-3 space-y-2">{history.tickets.map(ticketRow => <div key={ticketRow.ticket.id} className="flex flex-col justify-between gap-1 text-sm sm:flex-row"><span><strong>{ticketRow.ticket.reference}</strong> · {statusLabel(ticketRow.ticket.status)}</span><span className="text-xs text-muted-foreground">{formatDate(ticketRow.ticket.createdAt)}{ticketRow.technician ? ` · ${ticketRow.technician.name}` : ""}</span></div>)}</div>{history.notes.length > 0 && <div className="mt-4 border-t pt-3"><p className="text-xs font-semibold text-muted-foreground">Technician notes</p>{history.notes.slice(0, 4).map(noteRow => <p key={noteRow.id} className="mt-2 text-xs leading-5 text-muted-foreground">{noteRow.note}</p>)}</div>}</div>}<div className="mt-5 flex flex-col gap-2 border-t pt-4 sm:flex-row"><Input value={note} onChange={event => onNoteChange(event.target.value)} placeholder="Add an internal technician note" maxLength={4000} /><Button variant="outline" onClick={onAddNote} disabled={busy || !note.trim()}><Plus className="mr-2 h-4 w-4" />Add note</Button></div></article>;
}

function ProductRow({ product, onSave, busy }: { product: any; onSave: (payload: any) => void; busy: boolean }) {
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(String(product.price));
  const [stock, setStock] = useState(String(product.stock));
  const [availability, setAvailability] = useState(product.availability);
  const save = () => onSave({ id: product.id, sku: product.sku, name: product.name, category: product.category, description: product.description ?? undefined, compatibility: product.compatibility ?? undefined, price: Math.max(0, Number(price)), stock: Math.max(0, Number(stock)), availability });
  return <div className="flex flex-col gap-4 p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex min-w-0 items-start gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">{product.category === "laptop_spare" ? <Laptop className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{product.name}</h3><Badge className={statusTone(product.availability)}>{statusLabel(product.availability)}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{product.sku} · {product.compatibility || "Compatibility note not added"}</p></div></div>{!editing && <div className="flex items-center gap-3 text-sm"><span className={`rounded-full px-3 py-1 font-semibold ${product.stock <= product.reorderLevel ? "bg-violet-100 text-violet-800" : "bg-muted text-muted-foreground"}`}>{product.stock} in stock</span><span className="font-semibold">KES {product.price.toLocaleString()}</span><Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit item</Button></div>}</div>{editing && <div className="grid gap-3 rounded-2xl bg-muted/50 p-4 sm:grid-cols-3"><label className="text-xs font-medium text-muted-foreground">Price (KES)<Input type="number" min="0" value={price} onChange={event => setPrice(event.target.value)} /></label><label className="text-xs font-medium text-muted-foreground">Stock<Input type="number" min="0" value={stock} onChange={event => setStock(event.target.value)} /></label><label className="text-xs font-medium text-muted-foreground">Availability<select className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" value={availability} onChange={event => setAvailability(event.target.value)}><option value="in_stock">In stock</option><option value="low_stock">Low stock</option><option value="out_of_stock">Out of stock</option><option value="by_order">By order</option></select></label><div className="flex items-center justify-end gap-2 sm:col-span-3"><Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button><Button size="sm" onClick={() => { save(); setEditing(false); }} disabled={busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}Save changes</Button></div></div>}</div>;
}

function ProductForm({ form, setForm, onCancel, onSubmit, busy }: { form: { sku: string; name: string; category: string; description: string; compatibility: string; price: string; stock: string }; setForm: (value: any) => void; onCancel: () => void; onSubmit: () => void; busy: boolean }) {
  const update = (key: string, value: string) => setForm({ ...form, [key]: value });
  return <div className="rounded-3xl border bg-card p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">New inventory record</p><h3 className="mt-2 text-xl font-semibold">Add a spare part</h3></div><button onClick={onCancel} aria-label="Close product form"><X className="h-5 w-5 text-muted-foreground" /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">SKU<Input className="mt-1" value={form.sku} onChange={event => update("sku", event.target.value)} placeholder="DPH-SCR-001" /></label><label className="text-sm font-medium">Name<Input className="mt-1" value={form.name} onChange={event => update("name", event.target.value)} placeholder="iPhone 11 Screen Assembly" /></label><label className="text-sm font-medium">Category<select className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.category} onChange={event => update("category", event.target.value)}><option value="phone_screen">Phone screen</option><option value="charging_port">Charging port</option><option value="battery">Battery</option><option value="laptop_spare">Laptop spare</option><option value="accessory">Accessory</option><option value="other">Other</option></select></label><label className="text-sm font-medium">Price (KES)<Input className="mt-1" type="number" min="0" value={form.price} onChange={event => update("price", event.target.value)} /></label><label className="text-sm font-medium">Stock quantity<Input className="mt-1" type="number" min="0" value={form.stock} onChange={event => update("stock", event.target.value)} /></label><label className="text-sm font-medium">Compatibility<Input className="mt-1" value={form.compatibility} onChange={event => update("compatibility", event.target.value)} placeholder="Model or fit details" /></label><label className="text-sm font-medium sm:col-span-2">Description<textarea className="mt-1 min-h-24 w-full rounded-md border bg-background p-3 text-sm" value={form.description} onChange={event => update("description", event.target.value)} placeholder="What the customer should know before requesting this part" /></label></div><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={onCancel}>Cancel</Button><Button onClick={onSubmit} disabled={busy || !form.sku || !form.name || !form.price || !form.stock}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}Save part</Button></div></div>;
}
