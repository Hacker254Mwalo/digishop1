import { describe, expect, it } from "vitest";
import {
  PRODUCT_CONDITION_LABELS,
  canRequestProduct,
  deriveProductAvailability,
  getProductCategoryOptions,
  getProductImageUrls,
  normalizeProductCategory,
  productAvailabilityLabel,
  productCategoryKey,
} from "../shared/productCatalog";

describe("shared product catalog contract", () => {
  it("normalizes legacy categories and common owner-entered labels", () => {
    expect(normalizeProductCategory("phone_screen")).toBe("Phone screens");
    expect(normalizeProductCategory(" accessories ")).toBe("Accessories");
    expect(normalizeProductCategory("IPHONE")).toBe("iPhone");
    expect(normalizeProductCategory("Siaya Chargers")).toBe("Siaya Chargers");
  });

  it("derives one filter category for every published category without duplicate aliases", () => {
    expect(getProductCategoryOptions([
      { category: "iphone" },
      { category: "iPhone" },
      { category: "Samsung" },
      { category: "accessory" },
      { category: "Accessories" },
      { category: "  " },
      { category: null },
    ])).toEqual(["Accessories", "iPhone", "Samsung"]);
    expect(productCategoryKey("accessory")).toBe(productCategoryKey("Accessories"));
  });

  it("returns a deduplicated maximum-five image gallery with legacy primary fallback", () => {
    expect(getProductImageUrls({ imageUrl: "/manus-storage/primary.jpg" })).toEqual([
      "/manus-storage/primary.jpg",
    ]);
    expect(getProductImageUrls({
      imageUrl: "/manus-storage/one.jpg",
      imageUrls: ["/manus-storage/one.jpg", "/manus-storage/two.jpg", "javascript:alert(1)", "https://cdn.example/three.jpg", "/four.jpg", "/five.jpg", "/six.jpg"],
    })).toEqual([
      "/manus-storage/one.jpg",
      "/manus-storage/two.jpg",
      "https://cdn.example/three.jpg",
      "/four.jpg",
      "/five.jpg",
    ]);
  });

  it("derives availability from stock/reorder level and honors explicit states", () => {
    expect(deriveProductAvailability({ stock: 8, reorderLevel: 2, productType: "device" })).toBe("in_stock");
    expect(deriveProductAvailability({ stock: 2, reorderLevel: 2, productType: "part" })).toBe("low_stock");
    expect(deriveProductAvailability({ stock: 0, reorderLevel: 2, productType: "part" })).toBe("out_of_stock");
    expect(deriveProductAvailability({ stock: 0, reorderLevel: 2, productType: "part", availability: "by_order" })).toBe("by_order");
    expect(deriveProductAvailability({ stock: 10, reorderLevel: 2, productType: "part", availability: "out_of_stock" })).toBe("out_of_stock");
    expect(deriveProductAvailability({ stock: 0, reorderLevel: 0, productType: "service" })).toBe("by_order");
  });

  it("shows accurate public stock labels and keeps request eligibility aligned", () => {
    expect(productAvailabilityLabel({ stock: 4, availability: "in_stock", productType: "device" })).toBe("In stock");
    expect(productAvailabilityLabel({ stock: 1, availability: "low_stock", productType: "part" })).toBe("Low stock");
    expect(productAvailabilityLabel({ stock: 0, availability: "out_of_stock", productType: "part" })).toBe("Out of stock");
    expect(productAvailabilityLabel({ stock: 0, availability: "by_order", productType: "device" })).toBe("Available by order");
    expect(productAvailabilityLabel({ stock: 0, availability: "out_of_stock", productType: "service" })).toBe("Service by request");
    expect(productAvailabilityLabel({ stock: 2, availability: "in_stock", productType: "device", externalUrl: "https://seller.example" })).toBe("Sold by external seller");
    expect(canRequestProduct({ stock: 2, availability: "in_stock", productType: "device" })).toBe(true);
    expect(canRequestProduct({ stock: 0, availability: "out_of_stock", productType: "part" })).toBe(false);
    expect(canRequestProduct({ stock: 0, availability: "by_order", productType: "part" })).toBe(true);
    expect(canRequestProduct({ stock: 0, availability: "out_of_stock", productType: "service" })).toBe(true);
    expect(canRequestProduct({ stock: 2, availability: "in_stock", productType: "device", externalUrl: "https://seller.example" })).toBe(false);
  });

  it("uses an honest condition label vocabulary", () => {
    expect(PRODUCT_CONDITION_LABELS.new).toBe("New");
    expect(PRODUCT_CONDITION_LABELS.used).toBe("Used");
    expect(PRODUCT_CONDITION_LABELS.not_applicable).toBe("Not applicable");
  });
});
