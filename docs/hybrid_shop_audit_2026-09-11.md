# Hybrid shop production audit — 2026-09-11

## Live customer shop

Public URL checked: https://www.digitalelectronics.tech/spares

The page loads successfully and exposes search, category filters, basket controls, delivery or collection options, customer details, and order submission. The public products query was called from the live browser:

`GET /api/trpc/public.products?batch=1&input={"0":{"json":null}}`

It returned HTTP 200 with:

`[{"result":{"data":{"json":[]}}}]`

Therefore the catalogue is not failing at the API layer; the production `products` table currently contains zero rows, so the storefront correctly falls back to “More ways to shop” request cards. The production Supabase query verified this directly:

`select id, sku, name, category, price, stock, availability, active, "imageUrl" from products order by id desc limit 100;`

Result: `[]`.

## Existing capabilities

The current admin portal has a product creation form with SKU, name, category, description, compatibility, price, stock, and JPG/PNG/WebP image upload. It supports a one-way soft removal action, price/stock/availability editing, and customer order requests with delivery or collection. Public products are filtered to `active = true`.

## Confirmed gaps against the requested hybrid shop

The product schema currently supports categories including phone screens, charging ports, batteries, laptop spares, accessories, and other, but it does not distinguish a spare part from a device such as a laptop. It also has no optional external purchase URL, so an admin cannot publish a laptop or electronics listing that sends the customer to another website. The admin edit row only changes price, stock, and availability; it does not edit name, description, compatibility, image, product type, or destination. The product form’s wording is spare-part-specific and the public card always assumes the item should be added to the basket.

## Production schema change applied for the fix

Applied successfully to Supabase project `rondcgvtgbzjcyhtywrh`:

`alter table products add column if not exists "productType" varchar(24) not null default 'part', add column if not exists "externalUrl" varchar(512);`

The intended product types are `part`, `device`, `accessory`, and `service`. The optional `externalUrl` will allow a customer-facing “Visit website” path for products sold or fulfilled elsewhere, while normal listings continue through the existing order-request basket.
