# Digital Phone Hub — production improvement plan

## Product outcome

Make Digital Phone Hub a credible, premium, Siaya-first repair and electronics business online. The site should feel like the actual shop, let a customer understand the next safe step quickly, and keep service, retail and owner operations consistent. Implement real workflows backed by the existing database and services. Never fabricate inventory, prices, reviews, guarantees, authorization, payment status or delivery terms.

The intended experience must be usable by a first-time phone visitor and by the owner managing the work queue. Current source is a Vite/React public application with hand-built crawler HTML, tRPC API routes, a Supabase-backed database and Supabase-backed owner authentication, deployed as a Vercel static build plus serverless API. Keep that architecture unless an exact current limitation makes an extension necessary.

## Confirmed product constraints and unresolved dependencies

For this iteration, assume **Safaricom Daraja / M-PESA** as the single Kenyan payment provider. Customers must be able to submit an order without creating an account; account creation remains optional and must never block checkout. The customer account uses a unique username, Kenyan phone number and password, with no SMS step. The phone is an unverified contact number, never proof of identity; passwords are handled by Supabase Auth and are not stored by the shop. Private requests are tied to the authenticated Supabase user and are never auto-claimed from guest history by phone match. The public signup route has database-backed per-address and per-phone rate limits. Existing guest repair/parts requests and manual call/WhatsApp follow-up are real, but are not paid checkout or automatic customer notifications. Keep customer accounts fail-closed until the owner verifies the Vercel/Supabase project match, auth provider settings, required secrets and Preview testing. No Daraja merchant credentials are configured and the required payment migration must be applied to Supabase before real checkout can be activated. Do not ship dummy account/payment success states, send a live STK prompt, or call an order paid until the relevant integrations and migrations are ready.

Do not expose additional shop-location, stock, price, repair-time, delivery or warranty claims without owner-verified source data. No verified Google review URL or complete street address has been found; do not invent either. Google does not promise a number-one local ranking.

## Implementation approach

1. **Unify the premium storefront system.** Preserve the real brand mark and the shop/repair photographs already in `client/public/brand`. Apply one intentional visual system across home, repair, repair status and parts. Fix footer and mobile navigation contrast, keyboard focus, selected states, legibility, safe-area clearance, image loading/layout stability and accessible error/success announcements. Remove unnecessary dark/gradient template-like route switches while retaining product-appropriate contrast. Do not replace genuine shop photos with generic generated or stock imagery.

2. **Make repair service reliable and private.** Align the customer-facing device types with the deployed DB schema. Create unguessable repair references, avoid returning device/issue/quote PII through an unverified public lookup, give the customer a direct and clear next step after booking, and preserve retry-safe behavior. Owner updates must check that a row changed and show the resulting status truthfully.

3. **Keep the admin catalogue and customer shop in sync.** An owner-created phone/product must persist and render its title, KES price or honest quote state, customer-facing category (including owner-defined values such as iPhone, Samsung and Accessories), condition, up to five product photos, stock status and description. Store the customer-facing category and structured condition with the product; derive filter options from published product records so a newly entered category is immediately filterable without maintaining a second list. Validate image bytes server-side and keep a new listing hidden until its chosen photos have uploaded; never silently publish a partial upload. Derive availability consistently from stock, reorder level and explicit by-order/out-of-stock settings. Keep stock, active/published status and price server-authoritative; never fabricate inventory, prices, images or availability. A zero-priced/custom item remains a clearly named quote/availability request and must not be described as a priced/paid order.

   Continue showing only owner-managed catalogue records. Require location for delivery and keep custom enquiries distinct alongside catalogue items. Do not claim a sale is paid or order accepted until a real provider confirms it.

   Add a guest-first payment path only for an owner-confirmed order with a positive, server-persisted total. The customer starts the M-PESA STK prompt explicitly; the server ignores browser-supplied amounts and phone numbers, stores an idempotent payment attempt, and records success only after matching the persisted checkout ID and reconciling with Daraja. Require the new Supabase migration and all merchant configuration; with any requirement missing, keep payment unavailable and retain manual call/WhatsApp follow-up. Never store PINs or card details.

4. **Offer optional customer accounts without adding checkout friction.** Keep username/password sign-in and account creation directly accessible in a compact mobile-first layout; no SMS or email verification is part of the temporary signup flow. The server creates the Supabase Auth password identity and a private profile; an internal reserved `.invalid` identifier is never shown as a customer email, and the phone remains unverified. If the account gate is closed, keep guest ordering available and avoid implying account access is active. Authenticated users may see only requests explicitly linked to their account and matching profile; never auto-claim old guest requests solely by matching phone number. Use database uniqueness, row-level security, server-verified Supabase sessions and signup throttling; do not store passwords in application tables or expose account data through public reference routes.

5. **Improve owner operations.** Preserve the Supabase owner guard; make product create/edit forms cover the fields shown in the customer shop, validate category/condition/price/stock/images, make edits await successful writes, and show precise per-record feedback. Keep the Supabase migration history complete for every product field used by runtime code. Remove hard-coded owner identity from visible login, confirm destructive actions, and return not-found/conflict errors instead of false successes. Keep existing repair, inventory, orders, technician and overview controls real. Add only customer/account management and sales/finance analytics whose definitions and data are actually available.

6. **Repair crawl and routing behavior.** Keep one route registry for the indexable public pages. Align prerendered and hydrated page content/metadata. Serve a genuine branded HTTP 404 for unknown paths while retaining direct routes, `/api/*`, and `/manus-storage/*`. Remove the zoom cap; keep private owner/status/account pages noindex and maintain a truthful sitemap/robots policy.

7. **Add a reusable AI-assisted implementation brief.** Save a senior-engineering prompt for future changes. It must instruct the next coder to inspect existing flows and real data first, maintain one source of truth, avoid unverified claims, implement genuinely connected behavior, identify secret/integration blockers, and test without writing to production.

## Design system

- **Design movement:** premium workshop editorial — precise, calm and grounded in a real Siaya service counter.
- **Core principles:** operational clarity; human trust backed by real details; a single system across routes; transparent decisions before commitment.
- **Color philosophy:** retain warm parchment and ink as the main canvas, the existing red-orange for primary action, and restrained teal for confirmations. Avoid low-contrast slate text on white, neon accents, and decorative gradients that compete with photos or forms.
- **Layout paradigm:** asymmetric editorial storytelling with visible next actions, useful side panels on wide screens, and simple stacked task panels on narrow screens.
- **Signature elements:** restrained shop-inspired red-orange rule/label; clear numbered service progress; real local photography with stable aspect ratios.
- **Interaction philosophy:** every CTA starts a real route/action, every state is announced, no action reports success before the server confirms it, and every input has a visible label and focus state.
- **Animation:** short and optional; no perpetual motion; respect reduced-motion preference.
- **Typography:** Manrope headings with DM Sans body/UI; establish readable body/label sizes and a consistent heading scale.
- **Brand essence:** the practical, human device-care desk for Siaya — clear, local, capable.
- **Brand voice:** direct and reassuring, without exaggerated trust/ranking claims. Examples: “Start with what changed.” “We will confirm the price before you decide.”
- **Wordmark & logo:** preserve the owner’s current mark/wordmark; do not generate a replacement identity.
- **Signature brand color:** existing oxide red-orange `#d94b2b`, reserved for clear action and accent.

## Project structure

- `client/src/pages/` — public home, repair booking/status, guest order/payment status, parts, owner login and admin workspaces.
- `client/src/components/PublicShell.tsx` — shared navigation, mobile action rail, footer and global customer-contact affordances.
- `client/src/components/SeoHead.tsx` and `scripts/prerender-public-pages.mjs` — per-route client/static content and metadata; keep their route data consistent.
- `server/routers.ts` — typed tRPC public/admin API contracts and validation.
- `server/db.ts`, `server/_core/daraja.ts`, `drizzle/schema.ts`, `supabase/migrations/` — persistent customer, repair, catalogue, order, idempotent payment-attempt and owner data.
- `shared/productCatalog.ts` — canonical category suggestions/normalization, condition labels, gallery handling and stock-state rules shared by admin, customer shop and server.
- `client/src/pages/Account.tsx`, `client/src/lib/customerAuth.ts`, `server/_core/customerAuth.ts` — optional username/password account flow, browser session, server identity verification and unverified contact phone.
- `server/_core/ownerAuth.ts`, `context.ts` — separate Supabase owner session and server-side role checks.
- `server/_core/notification.ts`, `server/_core/env.ts` — existing owner notification and server-only Daraja integration configuration.
- `vercel.json`, `api/handler.js` build output — static route, API and object storage routing.
- `docs/` — reusable senior product/engineering prompt, cited audit notes and Daraja activation procedure.
