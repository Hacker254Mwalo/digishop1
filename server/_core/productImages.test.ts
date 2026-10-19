import { describe, expect, it } from "vitest";
import { Buffer } from "node:buffer";
import { decodeProductImage, MAX_PRODUCT_IMAGE_BYTES } from "./productImages";

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00]);
const webp = Buffer.from("RIFF0000WEBPVP8 ", "ascii");

describe("product image validation", () => {
  it("accepts matching JPEG, PNG and WebP signatures", () => {
    expect(decodeProductImage(jpeg.toString("base64"), "image/jpeg").equals(jpeg)).toBe(true);
    expect(decodeProductImage(png.toString("base64"), "image/png").equals(png)).toBe(true);
    expect(decodeProductImage(webp.toString("base64"), "image/webp").equals(webp)).toBe(true);
  });

  it("rejects MIME spoofing and malformed data", () => {
    expect(() => decodeProductImage(jpeg.toString("base64"), "image/png")).toThrow("does not match");
    expect(() => decodeProductImage(Buffer.from("not an image").toString("base64"), "image/jpeg")).toThrow("does not match");
    expect(() => decodeProductImage("abc$", "image/jpeg")).toThrow("data is invalid");
  });

  it("rejects zero-byte and over-limit images", () => {
    expect(() => decodeProductImage("", "image/jpeg")).toThrow("6 MB or smaller");
    const tooLarge = Buffer.alloc(MAX_PRODUCT_IMAGE_BYTES + 1, 0);
    expect(() => decodeProductImage(tooLarge.toString("base64"), "image/jpeg")).toThrow("6 MB or smaller");
  });
});
