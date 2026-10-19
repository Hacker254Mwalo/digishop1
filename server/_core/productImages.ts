import { Buffer } from "node:buffer";

export type ProductImageMime = "image/jpeg" | "image/png" | "image/webp";

export const MAX_PRODUCT_IMAGE_BYTES = 6 * 1024 * 1024;

export function decodeProductImage(base64: string, mimeType: ProductImageMime): Buffer {
  const source = base64.trim();
  if (!source || source.length > Math.ceil(MAX_PRODUCT_IMAGE_BYTES * 4 / 3) + 4) {
    throw new Error("Product images must be 6 MB or smaller");
  }
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(source) || source.length % 4 === 1) {
    throw new Error("The selected image data is invalid");
  }

  const normalized = source + "=".repeat((4 - source.length % 4) % 4);
  const bytes = Buffer.from(normalized, "base64");
  if (!bytes.length) throw new Error("The selected image is empty");
  if (bytes.length > MAX_PRODUCT_IMAGE_BYTES) throw new Error("Product images must be 6 MB or smaller");
  if (bytes.toString("base64").replace(/=+$/, "") !== source.replace(/=+$/, "")) {
    throw new Error("The selected image data is invalid");
  }

  const isJpeg = mimeType === "image/jpeg" && bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = mimeType === "image/png" && bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp = mimeType === "image/webp" && bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  if (!isJpeg && !isPng && !isWebp) throw new Error("The image content does not match its selected JPG, PNG or WebP type");
  return bytes;
}
