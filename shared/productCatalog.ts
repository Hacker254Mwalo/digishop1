export const PRODUCT_CONDITIONS = [
  "new",
  "used",
  "refurbished",
  "open_box",
  "for_parts",
  "not_applicable",
] as const;

export type ProductCondition = (typeof PRODUCT_CONDITIONS)[number];
export type ProductAvailability = "in_stock" | "low_stock" | "out_of_stock" | "by_order";
export type ProductType = "part" | "device" | "accessory" | "service";

export type CatalogProduct = {
  id: number;
  sku: string;
  name: string;
  category: string;
  productType: ProductType;
  condition: ProductCondition | null;
  description: string | null;
  compatibility: string | null;
  imageUrl: string | null;
  imageUrls: unknown;
  externalUrl: string | null;
  price: number;
  stock: number;
  reorderLevel: number;
  availability: ProductAvailability;
  active: boolean;
};

export const PRODUCT_CONDITION_LABELS: Record<ProductCondition, string> = {
  new: "New",
  used: "Used",
  refurbished: "Refurbished",
  open_box: "Open box",
  for_parts: "For parts / repair",
  not_applicable: "Not applicable",
};

export const PRODUCT_CATEGORY_SUGGESTIONS = [
  "iPhone",
  "Samsung",
  "Android phones",
  "Tablets",
  "Laptops",
  "Accessories",
  "Phone screens",
  "Batteries",
  "Charging",
  "Laptop parts",
  "Other electronics",
  "Services",
] as const;

const CATEGORY_ALIASES: Record<string, string> = {
  iphone: "iPhone",
  "apple iphone": "iPhone",
  samsung: "Samsung",
  "android phone": "Android phones",
  "android phones": "Android phones",
  tablet: "Tablets",
  tablets: "Tablets",
  laptop: "Laptops",
  laptops: "Laptops",
  accessory: "Accessories",
  accessories: "Accessories",
  phone_screen: "Phone screens",
  "phone screen": "Phone screens",
  screens: "Phone screens",
  "phone screens": "Phone screens",
  battery: "Batteries",
  batteries: "Batteries",
  charging_port: "Charging",
  charging: "Charging",
  laptop_spare: "Laptop parts",
  "laptop spare": "Laptop parts",
  "laptop parts": "Laptop parts",
  other: "Other electronics",
  electronics: "Other electronics",
  "other electronics": "Other electronics",
  service: "Services",
  services: "Services",
};

export function normalizeProductCategory(value: string | null | undefined): string {
  const cleaned = (value ?? "").normalize("NFKC").trim().replace(/\s+/g, " ");
  if (!cleaned) return "";
  return CATEGORY_ALIASES[cleaned.toLocaleLowerCase("en-KE")] ?? cleaned;
}

export function productCategoryKey(value: string | null | undefined): string {
  return normalizeProductCategory(value).toLocaleLowerCase("en-KE");
}

export function getProductCategoryOptions(products: Array<{ category?: string | null }>): string[] {
  const categories = new Map<string, string>();
  for (const product of products) {
    const label = normalizeProductCategory(product.category);
    const key = productCategoryKey(label);
    if (key && !categories.has(key)) categories.set(key, label);
  }
  return Array.from(categories.values()).sort((a, b) => a.localeCompare(b, "en-KE"));
}

export function getProductImageUrls(product: { imageUrl?: string | null; imageUrls?: unknown }): string[] {
  const gallery = Array.isArray(product.imageUrls) ? product.imageUrls : [];
  const candidates = [...gallery, product.imageUrl]
    .filter((value): value is string => typeof value === "string")
    .map(value => value.trim())
    .filter(value => value.length > 0 && (value.startsWith("/") || /^https?:\/\//i.test(value)));
  return Array.from(new Set(candidates)).slice(0, 5);
}

export function deriveProductAvailability(input: {
  stock: number;
  reorderLevel: number;
  productType: ProductType;
  availability?: ProductAvailability | null;
}): ProductAvailability {
  if (input.productType === "service") return "by_order";
  if (input.availability === "by_order") return "by_order";
  if (input.availability === "out_of_stock" || input.stock <= 0) return "out_of_stock";
  if (input.availability === "low_stock" || input.stock <= input.reorderLevel) return "low_stock";
  return "in_stock";
}

export function productAvailabilityLabel(product: {
  externalUrl?: string | null;
  productType: ProductType;
  stock: number;
  availability: ProductAvailability;
}): string {
  if (product.externalUrl) return "Sold by external seller";
  if (product.productType === "service") return "Service by request";
  if (product.availability === "by_order") return "Available by order";
  if (product.availability === "out_of_stock" || product.stock <= 0) return "Out of stock";
  if (product.availability === "low_stock") return "Low stock";
  return "In stock";
}

export function canRequestProduct(product: {
  externalUrl?: string | null;
  productType: ProductType;
  stock: number;
  availability: ProductAvailability;
}): boolean {
  if (product.externalUrl) return false;
  if (product.productType === "service") return true;
  return product.availability !== "out_of_stock" && (product.stock > 0 || product.availability === "by_order");
}
