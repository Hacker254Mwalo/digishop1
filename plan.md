# Digital Phone Hub — production improvement plan

## Product outcome

Make Digital Phone Hub a credible, premium, Siaya-first repair and electronics business online. The site should feel like the actual shop, let a customer understand the next safe step quickly, and keep service, retail and owner operations consistent. Implement real workflows backed by the existing database and services. Never fabricate inventory, prices, reviews, guarantees, authorization, payment status or delivery terms.

The intended experience must be usable by a first-time phone visitor and by the owner managing the work queue. Current source is a Vite/React public application with hand-built crawler HTML, tRPC API routes, a Supabase-backed database and Supabase-backed owner authentication, deployed as a Vercel static build plus serverless API. Keep that architecture unless an exact current limitation makes an extension necessary.

## Confirmed product constraints and unresolved dependencies

For this iteration, assume **Safaricom Daraja / M-PESA** as the single Kenyan payment provider. Customers must be able to submit an order without creating an account; account creation remains optional and must never block checkout. Existing guest repair/parts requests and manual call/WhatsApp follow-up are real, but are not paid checkout or automatic customer notifications. No Daraja merchant credentials are configured and the required payment migration must be applied to Supabase before real checkout can be activated. Do not ship dummy payment controls, send a live STK prompt, or call an order paid until the merchant setup is complete and Safaricom's provider status is verified.

Do not expose additional shop-location, stock, price, repair-time, delivery or warranty claims without owner-verified source data. No verified Google review URL or complete street address has been found; do not invent either. Google does not promise a number-one local ranking.

## Implementation approach

1. **Unify the premium storefront system.** Preserve the real brand mark and the shop/repair photographs already in `client/public/brand`. Apply one intentional visual system across home, repair, repair status and parts. Fix footer and mobile navigation contrast, keyboard focus, selected states, legibility, safe-area clearance, image loading/layout stability and accessible error/success announcements. Remove unnecessary dark/gradient template-like route switches while retaining product-appropriate contrast. Do not replace genuine shop photos with generic generated or stock imagery.

2. **Make repair service reliable and private.** Align the customer-facing device types with the deployed DB schema. Create unguessable repair references, avoid returning device/issue/quote PII through an unverified public lookup, give the customer a direct and clear next step after booking, and preserve retry-safe behavior. Owner updates must check that a row changed and show the resulting status truthfully.

3. **Separate genuine stock orders from quote requests.** Continue showing only owner-managed catalogue records. The server is authoritative for active state, stock, compatibility-related inputs and KES prices. Require location for delivery. A zero-priced/custom item remains a clearly named quote/availability request and must not be described as a priced/paid order. Keep custom enquiries distinct alongside catalogue items. Price and availability changes must produce clear, retryable customer feedback. Do not claim a sale is paid or order accepted until a real provider confirms it.

   Add a guest-first payment path only for an owner-confirmed order with a positive, server-persisted total. The customer starts the M-PESA STK prompt explicitly; the server ignores browser-supplied amounts and phone numbers, stores an idempotent payment attempt, and records success only after matching the persisted checkout ID and reconciling with Daraja. Require the new Supabase migration and all merchant configuration; with any requirement missing, keep payment unavailable and retain manual call/WhatsApp follow-up. Never store PINs or card details.

4. **Improve owner operations.** Preserve the Supabase owner guard; remove hard-coded owner identity from the visible login, make edits await successful writes, provide precise per-record feedback, confirm destructive actions, and return not-found/conflict errors instead of false successes. Keep existing repair, inventory, orders, technician and overview controls real. Add only customer/account management and sales/finance analytics whose definitions and data are actually available.

5. **Repair crawl and routing behavior.** Keep one route registry for the indexable public pages. Align prerendered and hydrated page content/metadata. Serve a genuine branded HTTP 404 for unknown paths while retaining direct routes, `/api/*`, and `/manus-storage/*`. Remove the zoom cap; keep private owner/status pages noindex and maintain a truthful sitemap/robots policy.

6. **Add a reusable AI-assisted implementation brief.** Save a senior-engineering prompt for future changes. It must instruct the next coder to inspect existing flows and real data first, maintain one source of truth, avoid unverified claims, implement genuinely connected behavior, identify secret/integration blockers, and test without writing to production.

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
- `server/_core/ownerAuth.ts`, `context.ts` — Supabase owner session and server-side role checks.
- `server/_core/notification.ts`, `server/_core/env.ts` — existing owner notification and server-only Daraja integration configuration.
- `vercel.json`, `api/handler.js` build output — static route, API and object storage routing.
- `docs/` — reusable senior product/engineering prompt, cited audit notes and Daraja activation procedure.
