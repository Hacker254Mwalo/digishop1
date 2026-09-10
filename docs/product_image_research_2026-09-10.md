# Product image and catalogue research — 10 September 2026

## Sources

- [Supabase Standard Uploads](https://supabase.com/docs/guides/storage/uploads/standard-uploads)
- [Supabase Storage File Limits](https://supabase.com/docs/guides/storage/uploads/file-limits)
- [Baymard Product Page UX 2026](https://baymard.com/blog/current-state-ecommerce-product-page-ux)
- [Adobe Guide to Effective Product Photography](https://business.adobe.com/blog/basics/guide-effective-product-photography)

## Findings applied to Digital Phone Hub

Supabase documents standard uploads as appropriate for small files up to about 6 MB, with explicit content types and unique paths recommended to avoid stale CDN content. For a small electronics catalogue, product images should therefore be restricted to common image MIME types, capped below the storage service limit, and stored under unique product-oriented paths rather than overwritten in place.

Supabase also supports per-bucket file-type and file-size restrictions. The application should still validate client-side for fast feedback and server-side or storage-policy enforcement for security. The admin UI should show a preview and an upload error before the product is published.

Baymard’s product-page research emphasizes that product pages are central to purchase decisions and that mobile product-page UX commonly underperforms. For parts, the public card/modal should make the image, product name, price, availability, compatibility, and add-to-basket action visible without requiring guesswork.

Adobe’s ecommerce photography guidance recommends consistent, clean product images, neutral backgrounds, detail shots where needed, scale/context images when useful, and optimized files for faster page loading. For LCDs and spare parts, the practical minimum is one clean hero image plus accurate model/compatibility text; additional detail images can be added later.

## Implementation boundary

Do not copy third-party product prices, inventory claims, or images from dharmaspares.com or other retailers into the production catalogue without confirmed ownership and current availability. Use owner-uploaded images and owner-entered verified product data. Keep existing order snapshots intact when a product image is replaced or a product is deactivated.
