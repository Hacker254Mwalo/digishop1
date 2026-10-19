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
  Download,
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
} from "lucide-react";
import { useEffect, useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import AdminCopilot from "@/components/AdminCopilot";
import {
  deriveProductAvailability,
  getProductCategoryOptions,
  getProductImageUrls,
  normalizeProductCategory,
  productAvailabilityLabel,
  productCategoryKey,
  PRODUCT_CATEGORY_SUGGESTIONS,
  PRODUCT_CONDITIONS,
  PRODUCT_CONDITION_LABELS,
  type CatalogProduct,
  type ProductCondition,
  type ProductType,
} from "@shared/productCatalog";

type Section = "overview" | "repairs" | "inventory" | "orders" | "customers" | "team";
const dashboardSections = ["overview", "repairs", "inventory", "orders", "customers", "team"] as const satisfies readonly Section[];
const repairStatuses = ["received", "diagnostics", "awaiting_approval", "in_repair", "ready", "collected", "cancelled"] as const;
const orderStatuses = ["new", "confirmed", "fulfilled", "cancelled"] as const;
const productTypeLabels: Record<string, string> = { part: "Part", device: "Device", accessory: "Accessory", service: "Service" };

type ProductFormState = {
  sku: string;
  name: string;
  category: string;
  productType: string;
  condition: string;
  description: string;
  compatibility: string;
  price: string;
  stock: string;
  reorderLevel: string;
  availabilityMode: "auto" | "out_of_stock" | "by_order";
  externalUrl: string;
};

const createEmptyProductForm = (): ProductFormState => ({
  sku: "", name: "", category: "", productType: "", condition: "", description: "",
  compatibility: "", price: "", stock: "", reorderLevel: "2", availabilityMode: "auto", externalUrl: "",
});

type ProductUpsertPayload = {
  id?: number;
  sku?: string;
  name: string;
  category: string;
  productType: ProductType;
  condition: ProductCondition;
  description?: string;
  compatibility?: string;
  imageUrl?: string;
  externalUrl?: string;
  price: number;
  stock: number;
  reorderLevel?: number;
  availability?: "by_order" | "out_of_stock";
};

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" });
}

function greetingForNow() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
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

function productImageError(file: File | undefined): string | null {
  if (!file) return "Choose a JPG, PNG or WebP image.";
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return "Use a JPG, PNG or WebP image.";
  if (file.size > 6 * 1024 * 1024) return "Each product photo must be 6 MB or smaller.";
  return null;
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
    return requested && ["overview", "repairs", "inventory", "orders", "customers", "team"].includes(requested) ? requested : "overview";
  });
  useEffect(() => {
    const syncSection = () => {
      const requested = new URLSearchParams(window.location.search).get("section") as Section | null;
      setSection(requested && ["overview", "repairs", "inventory", "orders", "customers", "team"].includes(requested) ? requested : "overview");
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
  const [customerSearch, setCustomerSearch] = useState("");
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryFilter, setInventoryFilter] = useState("all");
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState<ProductFormState>(createEmptyProductForm);
  const [productImages, setProductImages] = useState<File[]>([]);
  const [pendingProductId, setPendingProductId] = useState<number | null>(null);
  const [uploadedPhotoCount, setUploadedPhotoCount] = useState(0);
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
  const customers = trpc.admin.customers.useQuery(undefined, { enabled: isAdmin });
  const technicians = trpc.admin.technicians.useQuery(undefined, { enabled: isAdmin });
  const allTechnicians = trpc.admin.allTechnicians.useQuery(undefined, { enabled: isAdmin });
  const productCategories = useMemo(() => getProductCategoryOptions(products.data ?? []), [products.data]);
  const categorySuggestions = useMemo(() => Array.from(new Set([...PRODUCT_CATEGORY_SUGGESTIONS, ...productCategories])), [productCategories]);
  const updateRepair = trpc.admin.updateRepair.useMutation({ onSuccess: () => utils.admin.repairs.invalidate().then(() => utils.admin.summary.invalidate()) });
  const addNote = trpc.admin.addNote.useMutation({ onSuccess: (_, variables) => { setNoteDrafts(current => ({ ...current, [variables.ticketId]: "" })); return utils.admin.repairs.invalidate(); } });
  const upsertProduct = trpc.admin.upsertProduct.useMutation({ onSuccess: () => Promise.all([utils.admin.products.invalidate(), utils.admin.summary.invalidate(), utils.public.products.invalidate()]) });
  const uploadProductImage = trpc.admin.uploadProductImage.useMutation({ onSuccess: () => Promise.all([utils.admin.products.invalidate(), utils.public.products.invalidate()]) });
  const removeProduct = trpc.admin.removeProduct.useMutation({ onSuccess: () => Promise.all([utils.admin.products.invalidate(), utils.admin.summary.invalidate(), utils.public.products.invalidate()]) });
  const setProductActive = trpc.admin.setProductActive.useMutation({ onSuccess: () => Promise.all([utils.admin.products.invalidate(), utils.admin.summary.invalidate(), utils.public.products.invalidate()]) });
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
  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLocaleLowerCase("en-KE");
    return customers.data?.filter(customer => !query || [customer.name, customer.phone, customer.email, customer.location].filter(Boolean).join(" ").toLocaleLowerCase("en-KE").includes(query)) ?? [];
  }, [customers.data, customerSearch]);
  const filteredProducts = useMemo(() => {
    const query = inventorySearch.trim().toLowerCase();
    return products.data?.filter(product => {
      const haystack = [product.sku, product.name, product.category, product.productType, product.condition, product.description, product.compatibility].filter(Boolean).join(" ").toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      const matchesVisibility = inventoryFilter !== "hidden" || product.active === false;
      const availability = deriveProductAvailability({ stock: product.stock, reorderLevel: product.reorderLevel, productType: product.productType, availability: product.availability });
      const matchesFilter = inventoryFilter === "all" || inventoryFilter === "hidden" || (inventoryFilter === "attention" ? product.active !== false && ["low_stock", "out_of_stock"].includes(availability) : inventoryFilter.startsWith("category:") && productCategoryKey(product.category) === inventoryFilter.slice("category:".length));
      return matchesSearch && matchesVisibility && matchesFilter;
    }).sort((a, b) => a.name.localeCompare(b.name)) ?? [];
  }, [products.data, inventorySearch, inventoryFilter]);
  const lowStockProducts = useMemo(() => products.data?.filter(product => {
    if (product.active === false) return false;
    const availability = deriveProductAvailability({ stock: product.stock, reorderLevel: product.reorderLevel, productType: product.productType, availability: product.availability });
    return availability === "low_stock" || availability === "out_of_stock";
  }) ?? [], [products.data]);
  const historyInput = useMemo(() => historyFor ?? { customerId: 0, deviceId: 0 }, [historyFor]);
  const history = trpc.admin.customerHistory.useQuery(historyInput, { enabled: isAdmin && Boolean(historyFor) });
  const queryError = summary.error || repairs.error || products.error || orders.error || customers.error || technicians.error || allTechnicians.error || history.error;
  const mutationError = updateRepair.error || addNote.error || upsertProduct.error || uploadProductImage.error || removeProduct.error || setProductActive.error || updateOrder.error || upsertTechnician.error;

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

  const refreshAll = () => Promise.all([summary.refetch(), repairs.refetch(), products.refetch(), orders.refetch(), customers.refetch(), technicians.refetch()]);
  const resetProductForm = () => {
    setProductForm(createEmptyProductForm());
    setProductImages([]);
    setPendingProductId(null);
    setUploadedPhotoCount(0);
    setShowProductForm(false);
  };
  const saveNewProduct = async () => {
    const productType = productForm.productType as ProductType;
    const condition = (productType === "service" ? "not_applicable" : productForm.condition) as ProductCondition;
    const price = Number(productForm.price);
    const stock = Number(productForm.stock);
    const reorderLevel = Number(productForm.reorderLevel);
    if (!Number.isSafeInteger(price) || !Number.isSafeInteger(stock) || !Number.isSafeInteger(reorderLevel)) throw new Error("Enter whole KES and stock values before saving.");
    if (productType !== "service" && productImages.length === 0) throw new Error("Add at least one product photo before publishing.");

    let productId = pendingProductId;
    const result = await upsertProduct.mutateAsync({
      ...(productId ? { id: productId } : {}),
      sku: productForm.sku.trim() || undefined,
      name: productForm.name.trim(),
      category: normalizeProductCategory(productForm.category),
      productType,
      condition,
      description: productForm.description.trim(),
      compatibility: productForm.compatibility.trim() || undefined,
      externalUrl: productForm.externalUrl.trim() || undefined,
      price,
      stock,
      reorderLevel,
      availability: productForm.availabilityMode === "auto" ? undefined : productForm.availabilityMode,
    });
    productId = result.id;
    if (!pendingProductId) setPendingProductId(productId);

    for (let index = uploadedPhotoCount; index < productImages.length; index += 1) {
      const file = productImages[index];
      try {
        const base64 = await readImageAsBase64(file);
        await uploadProductImage.mutateAsync({ id: productId, fileName: file.name, mimeType: file.type as "image/jpeg" | "image/png" | "image/webp", base64 });
        setUploadedPhotoCount(index + 1);
      } catch {
        throw new Error("The product is saved as a hidden draft. A photo did not upload; retry to continue. It will not appear in the shop yet.");
      }
    }

    try {
      await setProductActive.mutateAsync({ id: productId, active: true });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "The product remains hidden. Complete the required details and try again.");
    }
    resetProductForm();
  };
  const addProductImage = async (id: number, file: File) => {
    const base64 = await readImageAsBase64(file);
    await uploadProductImage.mutateAsync({ id, fileName: file.name, mimeType: file.type as "image/jpeg" | "image/png" | "image/webp", base64 });
  };
  const exportInventory = () => {
    const rows = (products.data ?? []).map(product => [product.sku, product.name, product.category, product.productType, product.condition ?? "", product.price, product.stock, product.reorderLevel, productAvailabilityLabel(product), getProductImageUrls(product).length, product.description ?? "", product.compatibility ?? ""]);
    const csv = [["SKU", "Name", "Category", "Type", "Condition", "Price KES", "Stock", "Reorder level", "Availability", "Photo count", "Description", "Compatibility"], ...rows].map(row => row.map(value => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `digital-phone-hub-inventory-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-7xl animate-fade-up space-y-7 px-1 pb-10 text-slate-100 sm:px-0">
      <header className="premium-panel relative overflow-hidden rounded-[2rem] p-5 sm:p-7"><div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" /><div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Owner operations</div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-white sm:text-5xl">{greetingForNow()}, {user?.name?.split(" ")[0] || "owner"}.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">One workspace for repair intake, devices in the workshop, spare-parts stock and customer requests.</p><div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400"><span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">Owner workspace</span><span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">Siaya service desk · Mon–Sat</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refreshAll()} disabled={summary.isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${summary.isFetching ? "animate-spin" : ""}`} />Refresh</Button>
          <Button size="sm" onClick={() => selectSection("repairs")}><ClipboardList className="mr-2 h-4 w-4" />Open queue</Button>
        </div>
      </div></header>

      <nav className="premium-panel flex flex-wrap gap-2 rounded-2xl p-2" aria-label="Owner sections">
        {dashboardSections.map(item => (
          <button key={item} onClick={() => selectSection(item)} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition ${section === item ? "bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-400/10" : "text-slate-400 hover:bg-white/[0.07] hover:text-white"}`}>{statusLabel(item)}</button>
        ))}
      </nav>

      {(queryError || mutationError) && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-300/20 bg-rose-300/[0.08] p-4 text-sm text-rose-100 shadow-lg shadow-rose-950/10"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /><div><strong>Something needs attention.</strong><p className="mt-1">The latest operation did not complete. Check the affected record, refresh the workspace, and retry only if the change is not already visible.</p></div></div>}

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
          <AdminCopilot />
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
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Commerce desk</p><h2 className="mt-2 text-2xl font-semibold">Shop catalogue</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Create a listing once; its saved details and category appear in the customer shop automatically.</p></div><div className="flex flex-wrap gap-2"><Button onClick={() => { setProductForm(createEmptyProductForm()); setProductImages([]); setPendingProductId(null); setUploadedPhotoCount(0); setShowProductForm(true); }}><Plus className="mr-2 h-4 w-4" />Add product</Button><Button variant="outline" onClick={exportInventory} disabled={!products.data?.length}><Download className="mr-2 h-4 w-4" />Export CSV</Button></div></div>
          <div className="premium-panel flex flex-col gap-3 rounded-2xl p-3 sm:flex-row"><label className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={inventorySearch} onChange={event => setInventorySearch(event.target.value)} placeholder="Search SKU, product, model or category" className="pl-9" aria-label="Search inventory" /></label><select value={inventoryFilter} onChange={event => setInventoryFilter(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm sm:w-56" aria-label="Filter inventory"><option value="all">All listings</option><option value="attention">Stock attention</option><option value="hidden">Hidden drafts</option>{productCategories.map(label => <option key={label} value={`category:${productCategoryKey(label)}`}>{label}</option>)}</select></div>
          {showProductForm && <ProductForm form={productForm} setForm={setProductForm} images={productImages} setImages={setProductImages} pendingProductId={pendingProductId} uploadedPhotoCount={uploadedPhotoCount} categorySuggestions={categorySuggestions} onCancel={() => { if (pendingProductId && !window.confirm("This listing is saved as a hidden draft. Close the form and finish it later from Hidden drafts?")) return; resetProductForm(); }} onSubmit={saveNewProduct} busy={upsertProduct.isPending || uploadProductImage.isPending || setProductActive.isPending} />}
          {lowStockProducts.length > 0 && <div className="rounded-2xl border border-violet-300/20 bg-violet-300/10 p-4 text-sm text-violet-100"><strong>{lowStockProducts.length} item{lowStockProducts.length === 1 ? "" : "s"}</strong> need stock attention: {lowStockProducts.map(item => item.name).join(", ")}.</div>}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="premium-panel rounded-2xl p-4"><p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Live listings</p><p className="mt-2 text-2xl font-bold text-white">{products.data?.filter(product => product.active !== false).length ?? 0}</p><p className="mt-1 text-xs text-slate-500">Visible in the public shop</p></div>
            <div className="premium-panel rounded-2xl p-4"><p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Low stock</p><p className="mt-2 text-2xl font-bold text-violet-200">{lowStockProducts.length}</p><p className="mt-1 text-xs text-slate-500">Review before promising</p></div>
            <div className="premium-panel rounded-2xl p-4"><p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Catalogue</p><p className="mt-2 text-2xl font-bold text-emerald-200">{products.data?.length ? "Maintained" : "Needs setup"}</p><p className="mt-1 text-xs text-slate-500">Keep price, stock and fit details current</p></div>
          </div>
          <div className="premium-panel overflow-hidden rounded-3xl">{products.isLoading ? <LoadingState label="Loading inventory" /> : filteredProducts.length ? <div className="divide-y">{filteredProducts.map(product => <ProductRow key={product.id} product={product} onSave={async payload => { await upsertProduct.mutateAsync(payload); }} onUpload={addProductImage} onRemove={() => { if (window.confirm(`Hide ${product.name} from the public shop? Existing order history and stock levels will be kept.`)) removeProduct.mutate({ id: product.id }); }} onToggleActive={active => setProductActive.mutateAsync({ id: product.id, active })} busy={upsertProduct.isPending || uploadProductImage.isPending || removeProduct.isPending || setProductActive.isPending} categorySuggestions={categorySuggestions} />)}</div> : <EmptyState icon={Boxes} title={products.data?.length ? "No listings match this view" : "Your shop is ready for setup"} body={products.data?.length ? "Try another search or filter." : "Add the first real product with its category, condition, price, stock and photos."} />}</div>
        </section>
      )}

      {section === "orders" && (
        <section className="space-y-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Fulfillment desk</p><h2 className="mt-2 text-2xl font-semibold">Shop item requests</h2><p className="mt-2 text-sm text-muted-foreground">Confirm compatibility, final price, and collection or delivery before treating an enquiry as an order.</p></div><label className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={orderSearch} onChange={event => setOrderSearch(event.target.value)} placeholder="Search requests" className="pl-9 sm:w-56" aria-label="Search item requests" /></label></div>
          <div className="space-y-4">{orders.isLoading ? <LoadingState label="Loading item requests" /> : filteredOrders.length ? filteredOrders.map(row => <OrderRequestCard key={row.order.id} row={row} busy={updateOrder.isPending} onStatusChange={status => { if (status === "fulfilled" && !window.confirm(`Mark request ${row.order.reference} as fulfilled? Confirm the customer handoff first.`)) return; if (status === "cancelled" && !window.confirm(`Cancel request ${row.order.reference}?`)) return; updateOrder.mutate({ id: row.order.id, status }); }} />) : <EmptyState icon={PackagePlus} title="No item requests yet" body="Customer enquiries from the published catalogue will appear here for the service desk to confirm." />}</div>
        </section>
      )}

      {section === "customers" && (
        <section className="space-y-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Service desk</p><h2 className="mt-2 text-2xl font-semibold">Customer contacts</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">These contact records come from real repair and parts requests. They are not customer login accounts; messages remain manual.</p></div><label className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={customerSearch} onChange={event => setCustomerSearch(event.target.value)} placeholder="Search name, phone or email" className="pl-9 sm:w-72" aria-label="Search customer contact records" /></label></div>
          <div className="premium-panel overflow-hidden rounded-3xl">{customers.isLoading ? <LoadingState label="Loading customer contacts" /> : filteredCustomers.length ? <div className="divide-y">{filteredCustomers.map(customer => { const digits = customer.phone.replace(/\D/g, ""); const whatsapp = digits.startsWith("0") ? `254${digits.slice(1)}` : digits.length === 9 ? `254${digits}` : digits; return <article key={customer.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-200"><UserRound className="h-5 w-5" /></span><div className="min-w-0"><h3 className="truncate font-semibold">{customer.name}</h3><p className="mt-1 text-sm text-muted-foreground">{customer.phone}{customer.email ? ` · ${customer.email}` : " · No email recorded"}</p><p className="mt-1 text-xs text-muted-foreground">{customer.location || "No location recorded"} · Record updated {formatDate(customer.updatedAt)}</p></div></div><div className="flex flex-wrap gap-2">{customer.phone && <a href={`tel:${customer.phone.replace(/[^+\d]/g, "")}`} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-cyan-300/30 hover:text-cyan-200"><PhoneCall className="h-3.5 w-3.5" />Call</a>}{whatsapp && <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-emerald-300/30 hover:text-emerald-200"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</a>}{customer.email && <a href={`mailto:${customer.email}`} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-violet-300/30 hover:text-violet-200"><Mail className="h-3.5 w-3.5" />Email</a>}</div></article>; })}</div> : <EmptyState icon={Users} title="No customer contacts yet" body="Contacts will appear after a real repair or parts request is saved." />}</div>
        </section>
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

function OrderRequestCard({ row, busy, onStatusChange }: { row: any; busy: boolean; onStatusChange: (status: typeof orderStatuses[number]) => void }) {
  const quoteRequired = row.order.total == null || row.items.some((item: any) => item.unitPrice <= 0);
  return (
    <article className="premium-panel premium-panel-hover rounded-3xl p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm font-semibold text-primary">{row.order.reference}</span><Badge className={statusTone(row.order.status)}>{statusLabel(row.order.status)}</Badge></div><h3 className="mt-2 font-semibold">{row.customer?.name || "Customer"} · {row.customer?.phone || "No phone"}</h3><p className="mt-1 text-sm text-muted-foreground">{row.order.fulfillment === "delivery" ? `Delivery enquiry: ${row.order.deliveryLocation || "Area to confirm"}` : "Collection enquiry · Siaya service desk"} · {formatDate(row.order.createdAt)}</p></div>
        <div className="text-left sm:text-right"><p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Request estimate</p><p className="mt-1 text-xl font-semibold">{quoteRequired ? "Quote required" : `KES ${Number(row.order.total).toLocaleString("en-KE")}`}</p><p className="mt-1 text-xs text-muted-foreground">No payment was collected through this form.</p><p className="mt-2 text-xs text-muted-foreground">M-PESA: {!row.paymentStorageAvailable ? "payment migration required" : row.payment ? row.payment.status === "paid" ? `verified · ${row.payment.mpesaReceiptNumber || "receipt saved"}` : row.payment.status === "pending" || row.payment.status === "initiating" ? "prompt pending" : row.payment.status === "review" ? "service-desk review required" : "not completed" : "no online attempt"}</p></div>
      </div>
      <div className="mt-5 rounded-2xl bg-muted/50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Requested items</p>{row.items.length ? <div className="mt-3 space-y-2">{row.items.map((item: any) => <div key={item.id} className="flex items-center justify-between gap-3 text-sm"><span>{item.productNameSnapshot} <span className="text-xs text-muted-foreground">× {item.quantity}</span></span><span className="font-medium">{item.unitPrice > 0 ? `KES ${Number(item.unitPrice).toLocaleString("en-KE")}` : "Price to confirm"}</span></div>)}</div> : <p className="mt-2 text-sm text-muted-foreground">No item details were attached to this request.</p>}</div>
      {row.order.notes && <div className="mt-4 rounded-2xl border border-cyan-300/10 bg-cyan-300/5 p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">Customer notes</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{row.order.notes}</p></div>}
      <div className="mt-5 flex flex-col gap-3 border-t pt-4"><CustomerActions phone={row.customer?.phone} email={row.customer?.email} reference={row.order.reference} /><div className="flex flex-wrap gap-2">{orderStatuses.map(status => <Button key={status} size="sm" variant={status === row.order.status ? "default" : "outline"} onClick={() => onStatusChange(status)} disabled={busy}>{statusLabel(status)}</Button>)}</div></div>
    </article>
  );
}

function RepairRow({ row, technicians, note, onNoteChange, onUpdate, onAddNote, onHistory, history, historyLoading, busy }: { row: any; technicians: Array<{ id: number; name: string; specialty: string | null }>; note: string; onNoteChange: (value: string) => void; onUpdate: (payload: { status?: typeof repairStatuses[number]; technicianId?: number | null; quotedAmount?: number | null }) => void; onAddNote: () => void; onHistory: () => void; history?: { tickets: any[]; notes: any[] }; historyLoading: boolean; busy: boolean }) {
  const device = row.device;
  const [quoteDraft, setQuoteDraft] = useState(row.ticket.quotedAmount == null ? "" : String(row.ticket.quotedAmount));
  const [quoteError, setQuoteError] = useState("");
  const deviceType = device?.notes?.includes("Customer selected electronics") ? "Electronics" : statusLabel(device?.type ?? "Device");
  const saveQuote = () => {
    const value = quoteDraft.trim();
    if (value && (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)))) {
      setQuoteError("Enter a whole-shilling KES amount before saving the repair quote.");
      return;
    }
    setQuoteError("");
    onUpdate({ quotedAmount: value ? Number(value) : null, status: value ? "awaiting_approval" : undefined });
  };
  return (
    <article className="premium-panel premium-panel-hover rounded-3xl p-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">{device?.type === "laptop" ? <Laptop className="h-6 w-6" /> : <Phone className="h-6 w-6" />}</div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm font-semibold text-primary">{row.ticket.reference}</span><Badge className={statusTone(row.ticket.status)}>{statusLabel(row.ticket.status)}</Badge><Badge variant="outline">{deviceType}</Badge></div>
            <h3 className="mt-2 text-lg font-semibold">{device ? `${device.brand} ${device.model}` : "Device"}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{row.customer?.name || "Customer"} · {row.customer?.phone || "No phone"} · received {formatDate(row.ticket.receivedAt)}</p>
            <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-6">{row.ticket.issue}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <label className="text-xs font-medium text-muted-foreground">Stage<select value={row.ticket.status} onChange={event => onUpdate({ status: event.target.value as typeof repairStatuses[number] })} disabled={busy} className="mt-1 h-10 w-full rounded-lg border bg-background px-3 text-sm sm:w-56"><option value="received">Received</option><option value="diagnostics">Diagnostics</option><option value="awaiting_approval">Awaiting approval</option><option value="in_repair">In repair</option><option value="ready">Ready</option><option value="collected">Collected</option><option value="cancelled">Cancelled</option></select></label>
          <label className="text-xs font-medium text-muted-foreground">Technician<select value={row.ticket.technicianId ?? ""} onChange={event => onUpdate({ technicianId: event.target.value ? Number(event.target.value) : null })} disabled={busy} className="mt-1 h-10 w-full rounded-lg border bg-background px-3 text-sm sm:w-56"><option value="">Unassigned</option>{technicians.map(technician => <option key={technician.id} value={technician.id}>{technician.name}{technician.specialty ? ` · ${technician.specialty}` : ""}</option>)}</select></label>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.05] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="max-w-xs text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">Repair quote (KES)<Input type="number" min="0" step="1" value={quoteDraft} onChange={event => { setQuoteDraft(event.target.value); setQuoteError(""); }} placeholder="Enter amount after diagnosis" aria-invalid={Boolean(quoteError)} className="mt-2 bg-background text-sm normal-case tracking-normal" /></label>
          <Button type="button" variant="outline" onClick={saveQuote} disabled={busy}>{quoteDraft.trim() ? "Save quote & request approval" : "Clear quote"}</Button>
        </div>
        {quoteError && <p role="alert" className="mt-3 text-sm text-rose-200">{quoteError}</p>}
      </div>
      <div className="mt-4 flex flex-col justify-between gap-3 border-t pt-4 sm:flex-row sm:items-center"><button type="button" onClick={onHistory} className="inline-flex items-center gap-2 text-xs font-semibold text-primary"><History className="h-4 w-4" />{history ? "Hide customer history" : "View customer history"}</button><CustomerActions phone={row.customer?.phone} email={row.customer?.email} reference={row.ticket.reference} />{historyLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}</div>
      {history && <div className="mt-4 rounded-2xl bg-muted/50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Previous work on this device</p><div className="mt-3 space-y-2">{history.tickets.map(ticketRow => <div key={ticketRow.ticket.id} className="flex flex-col justify-between gap-1 text-sm sm:flex-row"><span><strong>{ticketRow.ticket.reference}</strong> · {statusLabel(ticketRow.ticket.status)}</span><span className="text-xs text-muted-foreground">{formatDate(ticketRow.ticket.createdAt)}{ticketRow.technician ? ` · ${ticketRow.technician.name}` : ""}</span></div>)}</div>{history.notes.length > 0 && <div className="mt-4 border-t pt-3"><p className="text-xs font-semibold text-muted-foreground">Technician notes</p>{history.notes.slice(0, 4).map(noteRow => <p key={noteRow.id} className="mt-2 text-xs leading-5 text-muted-foreground">{noteRow.note}</p>)}</div>}</div>}
      <div className="mt-5 flex flex-col gap-2 border-t pt-4 sm:flex-row"><Input value={note} onChange={event => onNoteChange(event.target.value)} placeholder="Add an internal technician note" maxLength={4000} /><Button variant="outline" onClick={onAddNote} disabled={busy || !note.trim()}><Plus className="mr-2 h-4 w-4" />Add note</Button></div>
    </article>
  );
}

type ProductAvailabilityMode = "auto" | "out_of_stock" | "by_order";

type ProductRowProps = {
  product: CatalogProduct;
  onSave: (payload: ProductUpsertPayload) => Promise<unknown>;
  onUpload: (id: number, file: File) => Promise<void>;
  onRemove: () => void;
  onToggleActive: (active: boolean) => Promise<unknown>;
  busy: boolean;
  categorySuggestions: string[];
};

function ProductRow({ product, onSave, onUpload, onRemove, onToggleActive, busy, categorySuggestions }: ProductRowProps) {
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [draft, setDraft] = useState({
    name: product.name,
    category: product.category,
    productType: product.productType ?? "part",
    condition: product.condition ?? "",
    description: product.description ?? "",
    compatibility: product.compatibility ?? "",
    price: String(product.price),
    stock: String(product.stock),
    availabilityMode: (product.availability === "by_order" || product.availability === "out_of_stock" ? product.availability : "auto") as ProductAvailabilityMode,
    reorderLevel: String(product.reorderLevel ?? 2),
    externalUrl: product.externalUrl ?? "",
  });
  const images = getProductImageUrls(product);
  const active = product.active !== false;
  const availability = productAvailabilityLabel(product);

  useEffect(() => {
    setDraft({
      name: product.name,
      category: product.category,
      productType: product.productType ?? "part",
      condition: product.condition ?? "",
      description: product.description ?? "",
      compatibility: product.compatibility ?? "",
      price: String(product.price),
      stock: String(product.stock),
      availabilityMode: (product.availability === "by_order" || product.availability === "out_of_stock" ? product.availability : "auto"),
      reorderLevel: String(product.reorderLevel ?? 2),
      externalUrl: product.externalUrl ?? "",
    });
  }, [product.id, product.name, product.category, product.productType, product.condition, product.description, product.compatibility, product.price, product.stock, product.reorderLevel, product.availability, product.externalUrl]);

  const update = (key: string, value: string) => setDraft(current => ({ ...current, [key]: value }));
  const save = async () => {
    setSaveError("");
    const price = Number(draft.price);
    const stock = Number(draft.stock);
    const reorderLevel = Number(draft.reorderLevel);
    if (![price, stock, reorderLevel].every(value => Number.isSafeInteger(value) && value >= 0 && value <= 2147483647)) {
      setSaveError("Enter whole, non-negative KES and stock values before saving.");
      return;
    }
    if (!draft.category.trim() || draft.category.trim().length > 64) {
      setSaveError("Enter a category from 1 to 64 characters.");
      return;
    }
    if (!draft.condition) {
      setSaveError("Choose the item condition before saving.");
      return;
    }
    try {
      await onSave({
        id: product.id,
        sku: product.sku,
        name: draft.name,
        category: normalizeProductCategory(draft.category),
        productType: draft.productType,
        condition: (draft.productType === "service" ? "not_applicable" : draft.condition) as ProductCondition,
        description: draft.description.trim() || undefined,
        compatibility: draft.compatibility.trim() || undefined,
        externalUrl: draft.externalUrl.trim() || undefined,
        price,
        stock,
        availability: draft.availabilityMode === "auto" ? undefined : draft.availabilityMode,
        reorderLevel,
      });
      setEditing(false);
    } catch {
      setSaveError("The change was not confirmed. Your edits remain open; check the listing before retrying.");
    }
  };

  const addPhotos = async (files: File[]) => {
    if (images.length + files.length > 5) {
      setSaveError("A listing can have up to five photos.");
      return;
    }
    for (const file of files) {
      const error = productImageError(file);
      if (error) { setSaveError(error); return; }
    }
    setUploading(true);
    setSaveError("");
    let saved = 0;
    try {
      for (const file of files) {
        await onUpload(product.id, file);
        saved += 1;
      }
    } catch {
      setSaveError(saved ? `${saved} photo${saved === 1 ? " was" : "s were"} saved. Select the remaining photo${saved === 1 ? "" : "s"} to continue.` : "The photo could not be saved. The listing itself was not changed.");
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (next: boolean) => {
    setSaveError("");
    try {
      await onToggleActive(next);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "The listing status could not be updated.");
    }
  };

  return <article className="flex flex-col gap-4 p-5">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white/90">
          {images[0] ? <img src={images[0]} alt={`${product.name} main photo`} className="h-full w-full object-contain p-1" /> : draft.productType === "device" ? <Smartphone className="h-6 w-6 text-primary" /> : <Boxes className="h-6 w-6 text-primary" />}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{product.name}</h3>
            <Badge className="border-cyan-300/20 bg-cyan-300/10 text-cyan-200">{productTypeLabels[product.productType] ?? "Product"}</Badge>
            <Badge variant="outline">{normalizeProductCategory(product.category)}</Badge>
            <Badge className={active ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200" : "border-amber-300/20 bg-amber-300/10 text-amber-100"}>{active ? "Live in shop" : "Hidden draft"}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{product.sku} · {product.condition ? PRODUCT_CONDITION_LABELS[product.condition] : "Condition not stated"}</p>
          <p className="mt-2 max-w-3xl text-sm leading-5 text-slate-300">{product.description?.trim() || "No product description has been provided."}</p>
          {product.compatibility && <p className="mt-1 text-xs text-muted-foreground">Compatibility: {product.compatibility}</p>}
          {product.externalUrl && <a href={product.externalUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">External destination <ArrowUpRight className="h-3.5 w-3.5" /></a>}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className={`inline-flex items-center gap-2 text-xs font-semibold ${images.length >= 5 ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer text-cyan-200"}`}>
              <UploadCloud className="h-3.5 w-3.5" />{uploading ? "Uploading photos…" : images.length >= 5 ? "Five photos added" : "Add photos"}
              <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading || busy || images.length >= 5} onChange={event => { const files = Array.from(event.currentTarget.files ?? []); event.currentTarget.value = ""; void addPhotos(files); }} />
            </label>
            <span className="text-xs text-muted-foreground">{images.length} / 5 photos</span>
          </div>
          {images.length > 0 && <div className="mt-2 flex gap-2" aria-label={`${product.name} product photos`}>
            {images.map((image, index) => <img key={`${image}-${index}`} src={image} alt={`${product.name} photo ${index + 1}`} className="h-12 w-12 rounded-lg border border-white/10 bg-white object-contain p-1" loading="lazy" />)}
          </div>}
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
        <div className="text-left sm:text-right"><p className="text-lg font-bold">{product.price > 0 ? `KES ${Number(product.price).toLocaleString("en-KE")}` : "Price to confirm"}</p><p className={`mt-1 text-xs ${product.availability === "out_of_stock" ? "text-rose-200" : product.availability === "low_stock" ? "text-amber-200" : "text-emerald-200"}`}>{availability}{product.productType !== "service" ? ` · ${product.stock} unit${product.stock === 1 ? "" : "s"}` : ""}</p></div>
        {!editing && <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => { setSaveError(""); setEditing(true); }}>Edit listing</Button>
          {active ? <Button variant="outline" size="sm" onClick={onRemove} disabled={busy || uploading} className="text-rose-200 hover:text-rose-100"><Trash2 className="mr-1.5 h-3.5 w-3.5" />Hide</Button> : <Button variant="outline" size="sm" onClick={() => void toggleActive(true)} disabled={busy || uploading}>Publish</Button>}
        </div>}
      </div>
    </div>
    {saveError && <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-xs leading-5 text-rose-100">{saveError}</p>}
    {editing && <div className="grid gap-3 rounded-2xl bg-muted/50 p-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className="text-xs font-medium text-muted-foreground">Title<Input value={draft.name} onChange={event => update("name", event.target.value)} maxLength={180} /></label>
      <label className="text-xs font-medium text-muted-foreground">Listing type<select className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" value={draft.productType} onChange={event => { const productType = event.target.value as ProductType; setDraft(current => ({ ...current, productType, condition: productType === "service" ? "not_applicable" : current.condition === "not_applicable" ? "" : current.condition })); }}><option value="part">Spare part</option><option value="device">Phone / device</option><option value="accessory">Accessory</option><option value="service">Service</option></select></label>
      <label className="text-xs font-medium text-muted-foreground">Category<input list={`product-categories-${product.id}`} value={draft.category} onChange={event => update("category", event.target.value)} maxLength={64} className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" /><datalist id={`product-categories-${product.id}`}>{categorySuggestions.map(label => <option key={label} value={label} />)}</datalist></label>
      <label className="text-xs font-medium text-muted-foreground">Condition<select className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" value={draft.condition} disabled={draft.productType === "service"} onChange={event => update("condition", event.target.value)}><option value="">Choose condition</option>{PRODUCT_CONDITIONS.filter(value => draft.productType === "service" ? value === "not_applicable" : value !== "not_applicable").map(value => <option key={value} value={value}>{PRODUCT_CONDITION_LABELS[value]}</option>)}</select></label>
      <label className="text-xs font-medium text-muted-foreground">Price (KES)<Input type="number" min="0" max="2147483647" step="1" value={draft.price} onChange={event => update("price", event.target.value)} /></label>
      <label className="text-xs font-medium text-muted-foreground">Stock quantity<Input type="number" min="0" max="2147483647" step="1" value={draft.stock} onChange={event => update("stock", event.target.value)} /></label>
      <label className="text-xs font-medium text-muted-foreground">Reorder alert at<Input type="number" min="0" max="2147483647" step="1" value={draft.reorderLevel} onChange={event => update("reorderLevel", event.target.value)} /></label>
      <label className="text-xs font-medium text-muted-foreground">Availability override<select className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" value={draft.availabilityMode} onChange={event => update("availabilityMode", event.target.value)}><option value="auto">Automatic from stock</option><option value="out_of_stock">Out of stock</option><option value="by_order">Available by order</option></select></label>
      <label className="text-xs font-medium text-muted-foreground">Model / compatibility<Input value={draft.compatibility} onChange={event => update("compatibility", event.target.value)} maxLength={2000} /></label>
      <label className="text-xs font-medium text-muted-foreground lg:col-span-3">Description<textarea className="mt-1 min-h-20 w-full rounded-md border bg-background p-3 text-sm" value={draft.description} onChange={event => update("description", event.target.value)} maxLength={2000} /></label>
      <label className="text-xs font-medium text-muted-foreground lg:col-span-3">External seller URL (optional)<Input type="url" value={draft.externalUrl} onChange={event => update("externalUrl", event.target.value)} maxLength={512} /></label>
      <div className="flex items-center justify-end gap-2 lg:col-span-3"><Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button><Button type="button" size="sm" onClick={() => void save()} disabled={busy || uploading}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}Save changes</Button></div>
    </div>}
  </article>;
}

function ProductForm({ form, setForm, images, setImages, pendingProductId, uploadedPhotoCount, categorySuggestions, onCancel, onSubmit, busy }: {
  form: ProductFormState;
  setForm: Dispatch<SetStateAction<ProductFormState>>;
  images: File[];
  setImages: React.Dispatch<React.SetStateAction<File[]>>;
  pendingProductId: number | null;
  uploadedPhotoCount: number;
  categorySuggestions: string[];
  onCancel: () => void;
  onSubmit: () => Promise<void>;
  busy: boolean;
}) {
  const [error, setError] = useState("");
  const previews = useMemo(() => images.map(file => URL.createObjectURL(file)), [images]);
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);
  const physical = form.productType !== "service";
  const update = (key: keyof ProductFormState, value: string) => setForm(current => ({ ...current, [key]: value } as ProductFormState));
  const choosePhotos = (files: File[]) => {
    setError("");
    if (pendingProductId) { setError("Finish or close this saved draft before changing its photo list."); return; }
    if (images.length + files.length > 5) { setError("Choose up to five photos for one product."); return; }
    for (const file of files) {
      const reason = productImageError(file);
      if (reason) { setError(reason); return; }
    }
    setImages(current => [...current, ...files]);
  };
  const validate = () => {
    if (!form.name.trim() || form.name.trim().length < 2) return "Enter the product title.";
    if (!form.category.trim()) return "Choose or enter a category.";
    if (!form.productType) return "Choose a listing type.";
    if (physical && !form.condition) return "Choose the item's condition.";
    if (form.price === "" || !/^\d+$/.test(form.price) || !Number.isSafeInteger(Number(form.price)) || Number(form.price) > 2147483647) return "Enter a whole-shilling KES price. Use 0 only when the shop will confirm a quote.";
    if (form.stock === "" || !/^\d+$/.test(form.stock) || !Number.isSafeInteger(Number(form.stock)) || Number(form.stock) > 2147483647) return "Enter the actual whole-unit stock count.";
    if (form.reorderLevel === "" || !/^\d+$/.test(form.reorderLevel) || !Number.isSafeInteger(Number(form.reorderLevel)) || Number(form.reorderLevel) > 2147483647) return "Enter a whole-unit reorder alert level.";
    if (form.description.trim().length < 10) return "Add a clear product description of at least 10 characters.";
    if (physical && images.length === 0) return "Add at least one product photo before publishing.";
    return "";
  };
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError("");
    try { await onSubmit(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "The listing could not be saved. It remains hidden until the required steps succeed."); }
  };
  const changeType = (productType: string) => setForm(current => ({ ...current, productType, condition: productType === "service" ? "not_applicable" : current.condition === "not_applicable" ? "" : current.condition }));

  return <form onSubmit={save} className="premium-panel premium-panel-hover rounded-3xl p-5 sm:p-6">
    <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">New shop listing</p><h3 className="mt-2 text-xl font-semibold">Product details</h3><p className="mt-1 text-sm text-muted-foreground">Only real product information is published.</p></div>
      <button type="button" onClick={onCancel} aria-label="Close product form" className="rounded-lg p-2 text-muted-foreground hover:bg-white/5"><X className="h-5 w-5" /></button>
    </div>
    {pendingProductId && <p role="status" className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">Hidden draft saved · {uploadedPhotoCount} of {images.length} photos uploaded. It will not appear in the shop until complete.</p>}
    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className="text-sm font-medium">Title<Input required minLength={2} maxLength={180} className="mt-1" value={form.name} onChange={event => update("name", event.target.value)} placeholder="e.g. iPhone 11 64 GB" /></label>
      <label className="text-sm font-medium">Listing type<select required className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.productType} onChange={event => changeType(event.target.value)}><option value="">Choose type</option><option value="device">Phone / device</option><option value="part">Spare part</option><option value="accessory">Accessory</option><option value="service">Service</option></select></label>
      <label className="text-sm font-medium">Shop category<input required list="product-category-suggestions" maxLength={64} className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.category} onChange={event => update("category", event.target.value)} placeholder="e.g. iPhone, Samsung, Accessories" /><datalist id="product-category-suggestions">{categorySuggestions.map(label => <option key={label} value={label} />)}</datalist></label>
      <label className="text-sm font-medium">Condition<select required={physical} disabled={form.productType === "service"} className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-70" value={form.condition} onChange={event => update("condition", event.target.value)}><option value="">Choose condition</option>{PRODUCT_CONDITIONS.filter(value => physical ? value !== "not_applicable" : value === "not_applicable").map(value => <option key={value} value={value}>{PRODUCT_CONDITION_LABELS[value]}</option>)}</select></label>
      <label className="text-sm font-medium">Price (KES)<Input required type="number" min="0" max="2147483647" step="1" className="mt-1" value={form.price} onChange={event => update("price", event.target.value)} placeholder="0 = confirm price" /><span className="mt-1 block text-xs text-muted-foreground">Enter the actual price; 0 means price to confirm.</span></label>
      <label className="text-sm font-medium">Stock quantity<Input required type="number" min="0" max="2147483647" step="1" className="mt-1" value={form.stock} onChange={event => update("stock", event.target.value)} placeholder="Actual quantity" /></label>
      <label className="text-sm font-medium">Availability override<select className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.availabilityMode} onChange={event => update("availabilityMode", event.target.value)}><option value="auto">Automatic from stock</option><option value="out_of_stock">Out of stock</option><option value="by_order">Available by order</option></select></label>
      <label className="text-sm font-medium">Reorder alert at<Input required type="number" min="0" max="2147483647" step="1" className="mt-1" value={form.reorderLevel} onChange={event => update("reorderLevel", event.target.value)} /></label>
      <label className="text-sm font-medium">Model / compatibility<Input maxLength={2000} className="mt-1" value={form.compatibility} onChange={event => update("compatibility", event.target.value)} placeholder="Exact model or fit details" /></label>
      <label className="text-sm font-medium">SKU (optional)<Input maxLength={80} className="mt-1" value={form.sku} onChange={event => update("sku", event.target.value)} placeholder="Assigned automatically if blank" /></label>
      <label className="text-sm font-medium lg:col-span-3">Description<textarea required minLength={10} maxLength={2000} className="mt-1 min-h-24 w-full rounded-md border bg-background p-3 text-sm" value={form.description} onChange={event => update("description", event.target.value)} placeholder="Describe the real item, included accessories, known wear, warranty or service details." /></label>
      <label className="text-sm font-medium lg:col-span-3">External seller URL (optional)<Input type="url" maxLength={512} className="mt-1" value={form.externalUrl} onChange={event => update("externalUrl", event.target.value)} placeholder="https://" /></label>
      <fieldset className="rounded-2xl border border-dashed border-cyan-300/25 bg-cyan-300/[0.04] p-4 sm:col-span-2 lg:col-span-3" disabled={busy || Boolean(pendingProductId)}>
        <legend className="px-1 text-sm font-semibold text-cyan-100">Product photos {physical ? "(required)" : "(optional for services)"}</legend>
        <p className="text-xs text-muted-foreground">JPG, PNG or WebP · up to five photos · 6 MB each. Photos upload as selected; no automatic edits are applied.</p>
        <input className="mt-3 block w-full text-sm text-slate-300 file:mr-3 file:rounded-full file:border-0 file:bg-cyan-300 file:px-4 file:py-2 file:font-semibold file:text-slate-950" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={event => { const files = Array.from(event.currentTarget.files ?? []); event.currentTarget.value = ""; choosePhotos(files); }} />
        {images.length > 0 && <div className="mt-4 flex flex-wrap gap-3">{images.map((file, index) => <div key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/10 p-2"><img src={previews[index]} alt={`Preview of ${file.name}`} className="h-14 w-14 rounded-lg bg-white object-contain p-1" /><span className="max-w-36 truncate text-xs text-slate-300">{file.name}</span></div>)}</div>}
      </fieldset>
    </div>
    {error && <p role="alert" className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-sm leading-5 text-rose-100">{error}</p>}
    <div className="mt-5 flex flex-col-reverse justify-between gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center"><p className="text-xs leading-5 text-muted-foreground">New items stay hidden until required details and photos are saved.</p><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel} disabled={busy}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}{pendingProductId ? "Finish hidden draft" : "Publish to shop"}</Button></div></div>
  </form>;
}
