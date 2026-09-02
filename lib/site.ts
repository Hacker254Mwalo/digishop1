export const site = {
  name: "Digital Phone Hub Repair & Electronics",
  shortName: "Digital Phone Hub",
  location: "Siaya Town, Kenya",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://digishop1.vercel.app",
  tagline: "Phone repair, laptop support and spare parts supplied across Kenya from Siaya.",
  phoneDisplay: process.env.NEXT_PUBLIC_SHOP_PHONE_DISPLAY || "0718 114 009",
  phoneHref: process.env.NEXT_PUBLIC_SHOP_PHONE || "0718114009",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "254718114009",
  address: process.env.NEXT_PUBLIC_SHOP_ADDRESS || "Siaya Town, Siaya County, Kenya",
  mapsQuery: process.env.NEXT_PUBLIC_MAPS_QUERY || "Digital Phone Hub Repair & Electronics, Siaya, Kenya",
  hours: [
    ["Monday – Friday", "8:00 AM – 6:30 PM"],
    ["Saturday", "8:30 AM – 5:00 PM"],
    ["Sunday", "By appointment"],
  ],
  lastUpdated: "2026-09-02",
};

export const gallery = [
  {
    src: "/images/digital-electronics-exterior-sign.jpg",
    alt: "Digital Phone Hub Repair & Electronics storefront sign for phone repair and spare parts in Siaya",
    label: "Storefront",
    title: "The signal outside",
    description: "A clear landmark for the Digital Phone Hub Repair & Electronics service and spares experience in Siaya.",
    className: "gallery-wide",
  },
  {
    src: "/images/technician-counter.jpg",
    alt: "Digital Phone Hub Repair & Electronics technician at the repair and service counter in Siaya",
    label: "Repair operation",
    title: "Where diagnosis begins",
    description: "A working counter for intake, device checks and repair conversations.",
    className: "gallery-tall",
  },
  {
    src: "/images/customer-service-counter.jpg",
    alt: "Digital Phone Hub Repair & Electronics customer service counter with laptop and spare parts",
    label: "Parts selection",
    title: "The parts in reach",
    description: "A practical selection of accessories and replacement parts for everyday devices.",
    className: "gallery-tall",
  },
];

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  tag: string;
  tone: string;
};

export const products: Product[] = [
  {
    id: "screen-iphone-11",
    name: "iPhone 11 Screen Assembly",
    category: "Phone screens",
    price: 5200,
    description: "Quality replacement display assembly with touch and brightness tested before handover.",
    tag: "Popular",
    tone: "blue",
  },
  {
    id: "screen-samsung-a14",
    name: "Samsung A14 Screen",
    category: "Phone screens",
    price: 3400,
    description: "Replacement screen for Samsung A14, fitted and checked by the repair desk.",
    tag: "In stock",
    tone: "indigo",
  },
  {
    id: "charging-port-typec",
    name: "Type-C Charging Port",
    category: "Charging ports",
    price: 850,
    description: "Replacement Type-C port for common Android models. Ask us to confirm compatibility.",
    tag: "Fast fit",
    tone: "cyan",
  },
  {
    id: "battery-iphone-xr",
    name: "iPhone XR Battery",
    category: "Batteries",
    price: 2600,
    description: "Reliable replacement battery for improved daily battery life and stability.",
    tag: "Tested",
    tone: "amber",
  },
  {
    id: "battery-samsung-a12",
    name: "Samsung A12 Battery",
    category: "Batteries",
    price: 1600,
    description: "Replacement battery for Samsung A12 with installation available at the shop.",
    tag: "In stock",
    tone: "green",
  },
  {
    id: "laptop-keyboard-hp",
    name: "HP Laptop Keyboard",
    category: "Laptop spares",
    price: 3200,
    description: "Replacement keyboard for selected HP laptops. Model confirmation required before order.",
    tag: "By order",
    tone: "slate",
  },
  {
    id: "laptop-ssd-256",
    name: "256GB Laptop SSD",
    category: "Laptop spares",
    price: 4200,
    description: "Speed up an older laptop with a practical 256GB solid-state drive upgrade.",
    tag: "Upgrade",
    tone: "violet",
  },
  {
    id: "charger-65w",
    name: "65W Laptop Charger",
    category: "Laptop spares",
    price: 2800,
    description: "Universal 65W laptop charger with interchangeable tips for popular models.",
    tag: "Ready today",
    tone: "orange",
  },
];

export const statusSteps = [
  { id: "received", label: "Received", short: "Intake confirmed" },
  { id: "diagnostics", label: "Under Diagnostics", short: "Technician is checking the fault" },
  { id: "repair", label: "Repair in Progress", short: "Parts and repair work underway" },
  { id: "ready", label: "Ready for Pickup", short: "Your device is ready at the desk" },
] as const;

export type Ticket = {
  ticket: string;
  clientName: string;
  phone: string;
  deviceType: "Phone" | "Laptop";
  fault: string;
  status: (typeof statusSteps)[number]["id"];
  createdAt: string;
};

export const demoTickets: Ticket[] = [
  {
    ticket: "DPH-REP-1049",
    clientName: "Demo customer",
    phone: "",
    deviceType: "Phone",
    fault: "Screen replacement",
    status: "diagnostics",
    createdAt: "2026-09-02T08:00:00.000Z",
  },
  {
    ticket: "DPH-REP-1050",
    clientName: "Demo customer",
    phone: "",
    deviceType: "Laptop",
    fault: "Laptop not charging",
    status: "repair",
    createdAt: "2026-09-02T08:00:00.000Z",
  },
];

export function formatKes(value: number) {
  return `KES ${value.toLocaleString("en-KE")}`;
}

export function createTicketNumber() {
  const seed = Date.now().toString().slice(-4);
  const random = Math.floor(Math.random() * 10).toString();
  return `DPH-REP-${seed}${random}`;
}

export function normalizeKenyanNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.startsWith("254")) return digits;
  return digits;
}

export function getWhatsAppUrl(message: string) {
  const number = normalizeKenyanNumber(site.whatsappNumber);
  const base = number ? `https://wa.me/${number}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(message)}`;
}
