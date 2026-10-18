# Digital Phone Hub — website audit and release report

**Audit date:** 18 October 2026
**Scope:** public production-site review, selected customer flows, repository/API/auth review, local production-build inspection and a Siaya/Kenya service-site benchmark.

## Executive summary

The site has been materially improved across its real customer and owner workflows. Its public pages now share one warm, restrained Siaya storefront identity, the repair journey exposes less customer information, parts requests distinguish enquiries from paid orders, owner actions report missing/failed writes more honestly, and the generated site contains a branded 404 page. The work preserves the existing app/database stack and the shop's real identity and photos.

This is **not** a claim that every requested third-party journey is live. The real Safaricom Daraja guest-checkout backend and order-status route are implemented, but no merchant credentials are configured and the Supabase payment migration has not been applied; checkout therefore remains disabled rather than simulated. The migration includes atomic order/attempt guards, one-open-or-paid enforcement, a bounded minimal callback inbox, a readiness check and an RPC-only paid transition. Callback content is treated as untrusted; a successful query for the saved checkout ID and database-side rechecks are required, and an unsigned receipt is not stored. Optional username-and-phone customer sign-up/sign-in and private account-linked item history are now implemented in the code, but production OTP/account use remains blocked until the owner applies the account migration, configures a real Supabase Auth SMS provider, and explicitly enables the server-side `CUSTOMER_ACCOUNTS_ENABLED` gate. Accounts are never required to purchase, and automated notifications are not implemented. The live catalogue also needs owner-supplied product data. A #1 local ranking cannot be guaranteed by code changes alone.

## What the audit found and changed

| Area | Verified issue before changes | Implemented improvement |
|---|---|---|
| Brand and trust | The homepage and Siaya repair page used conflicting visual styles; footer and mobile action text had poor contrast; the fixed phone action rail could cover the final content. | Reworked the shared public shell and phone-repair page around the existing Digital Phone Hub mark, genuine shop imagery, warm ivory/ink surfaces and oxide-red action color. Raised mobile/footer contrast, added visible focus, removed the viewport zoom cap and reserved phone safe-area space. |
| Repair booking and tracking | Public reference lookup returned issue/device/quote information and used timestamp-derived references; retries could create duplicate requests. | Uses an unguessable random request reference that can be reused for a safe retry. Public status responses now contain only the reference, operational status and update time. The repair success path passes the reference through a one-time same-tab session handoff rather than a URL; legacy query references are removed from browser history. Public customer-facing WhatsApp follow-up links do not prefill the bearer reference. Tracking has `noindex`, `no-referrer` and `no-store` response headers. Customers should still keep references private. |
| Schema mismatch | The public form offered an `electronics` type rejected by the deployed database constraint. | The server stores the compatible `other` value and retains the customer-selected category in the device notes. No unverified production schema migration was assumed. |
| Parts and order request | Unknown-price items were recorded as zero-total orders; delivery did not require a location; custom items could be omitted alongside catalogue selections; the basket was lost on reload. | The server resolves active product prices/stock itself, requires a delivery area, blocks stale/unavailable lines, and stores unknown-price requests as unpriced enquiries. Basket selections now survive the tab session and stale lines are called out. The UI does not represent these requests as paid checkouts; when no items are selected it now says so instead of showing a KES 0 estimate. Added guest-first Daraja STK initiation only for an owner-confirmed, positively priced order. The reference reaches public status tracking through a one-time same-tab session handoff and is omitted from customer-facing WhatsApp URL text. The database now serializes attempt creation against order changes, caps initiation attempts atomically, blocks cancellation/closure during payment, records early callbacks in a bounded minimal inbox and permits `paid` only through a locked provider-reconciliation RPC. The callback body is not treated as payment proof, and no unsigned receipt is stored. It stays disabled until merchant configuration and the complete migration are present; Vercel Production rejects sandbox mode, Preview rejects production credentials, and local/development deployments cannot enable checkout. |
| Owner portal | Several mutations could report success for missing records; product edits closed before confirmation; removed products could not be restored from the catalogue; the owner email was prefilled; operational “ready/live” labels were static. | Added affected-row checks, awaited product-save feedback, reversible product visibility, a private customer contact-record view, whole-KES quote validation, a neutral login form and more truthful operating states. Owner cookie lifetime now follows the Supabase token and logout clears the owner cookie and attempts provider-side revocation. |
| Search and routes | Unknown paths could serve the homepage with HTTP 200 (soft 404); the viewport prevented user zoom; private owner/status routes needed explicit exclusion. | Added a branded `404.html`, removed the generic Vercel SPA catch-all while retaining API/storage rewrites, preserved route metadata, and marked status/owner paths `noindex`. |
| Configuration honesty | No real analytics ID was configured, while placeholder analytics references remained in the HTML. | Removed invalid placeholders rather than shipping a request to a fake/missing analytics endpoint. Analytics remain unconfigured. |

The initial full source audit also found that related database writes are not wrapped in a database transaction, current owner lists are not fully paginated, and static crawler HTML remains a hand-authored summary rather than a complete server-render of the hydrated React page. These are not described as solved. See the longer-term section below.

## Customer and owner routes

- `/` and `/phone-repair-siaya` — brand-consistent Siaya shop/service discovery, using existing photographs and real contact details already present in the source.
- `/repair` — persisted repair-request flow; uses the deployed-schema-compatible device category and a retry-safe reference.
- `/repair-status` — reference-based, minimal status view; private from search indexing, referrers and caches.
- `/spares` — owner-managed live catalogue and server-validated request flow. It is not a payment checkout.
- `/order-status` — no-login order/payment status and gated M-PESA initiation for a guest reference; `noindex` and excludes customer contact details.
- `/account` — optional username-plus-verified-phone customer sign-in and account-linked order history; `noindex`, no canonical URL, `no-referrer` and `no-store`. Live use awaits Supabase phone/SMS setup and migration 003.
- `/owner-login` and `/admin` — existing Supabase owner authentication and protected operations. The dashboard has a customer-contact directory, not customer account administration.
- Unknown paths — live verification confirmed HTTP 404 with a branded recovery page and recovery links.

Customer OTP calls use the real Supabase Auth phone provider when configured; no code is simulated or claimed delivered. New item requests are linked only when the server verifies a confirmed Auth phone, the account profile exists and the submitted number matches. Existing guest requests are never auto-claimed. Automated customer SMS/email/WhatsApp notifications were not added; manual call/WhatsApp follow-up remains available. Daraja initiation/callback code is real but cannot send a prompt or mark a payment paid until the payment migration and merchant credentials are configured.

## Competitor and customer-expectation benchmark

These are researched website/listing patterns—not an independently measured ranking study. Public pages, search snippets and social posts do not prove a business is the best, fully available, certified or ranked first in Siaya.

| Comparator | Relevant observed pattern | Safe lesson for Digital Phone Hub |
|---|---|---|
| Pro-Logic Technologies / Yala-facing public post | Advertises broader electronics/TV repair and quote-first service. The local post and site are the business's own statements, not independent performance proof. | Make the exact repair scope and next quote/diagnosis step clear; do not imply OEM accreditation or warranties without owner evidence. |
| Gulf Phone Repair, Siaya-facing public post | Mentions phone/laptop/electronics repair and related sales. Exact address, availability and quality were not independently confirmed. | Ensure the site states a verified desk location/landmark and real hours once the owner confirms them. |
| BusinessClaud electronics-in-Siaya listing | Organizes a broad local electronics category and makes delivery/satisfaction claims. The claims were not independently verified. | Differentiate through transparent compatibility, price/stock and fulfilment details rather than unsubstantiated “best” or “fastest” claims. |
| Carlcare Kenya | Manufacturer-backed service locator, brand/service eligibility, booking guidance and estimates. | Show model/brand eligibility and explain estimates clearly, but never claim authorized-service status without proof. |
| Global Electronics Kenya | Browseable devices with model-specific KES prices. | A useful retail expectation: use real model names and prices when the owner enters reliable data; keep an unpriced item clearly quote-only. |
| Mzuri repair directory | Town discovery, shop contact information and quote-oriented repair information. | Local customers need exact location, contact, hours and a plain explanation of diagnosis/quote—not just a polished hero. |

### Local-search reality

Google describes local ranking as mainly influenced by **relevance, distance and prominence**. It recommends accurate, complete Business Profile details, current hours, photos and review responses; it does not offer a way to pay/request a better rank. A website cannot guarantee position #1, especially for customers physically closer to another service.

The current shop site does not establish a verified full street address/landmark, Business Profile review URL or Search Console data. Those must come from the owner and real profile. Do not create a fake review link or add a map pin for an unconfirmed location.

## Reviews and trust incentives

Use the companion [`customer trust and review-request playbook`](customer-trust-playbook.md). Its templates ask customers neutrally after a genuine visit. **Do not reward a review** with money, airtime, discounts, free items, an extended warranty or service benefit; do not ask only satisfied customers or request a particular rating. Separate loyalty/referral benefits from public reviews and publish exact terms only after the owner confirms they can honour them.

## Verification performed

- `pnpm run check` — passed.
- `pnpm test` — passed: 4 files, 34 tests, including guest API validation/fallback, verified-phone account context and order linking, the account kill switch, Kenyan phone normalization, sandbox/production deployment-stage restrictions, ignored/spoofed callback metadata, early callback queuing with no customer metadata, merchant-ID checks, callback throttling, provider-confirmed failures, disabled-config behavior and requiring a successful Daraja query before the atomic `paid` RPC.
- `pnpm run check` and `pnpm run build` — passed after account implementation; build emitted nine crawler-visible route files and a branded 404.
- Payment migration — PostgreSQL parser accepted all 46 statements. This is a syntax check only; no production Supabase database was available to execute the migration.
- Customer-account migration — PostgreSQL parser accepted all 12 statements. This is a syntax check only; no production Supabase database was available to execute it.
- Built-route inspection — account, order/payment and repair tracking are `noindex,nofollow`, omit canonical/Open Graph URLs and do not enter the sitemap; account responses are configured `no-referrer` and private `no-store`; 404 contains the brand and recovery links.
- Visual review — screenshots of the production build at desktop width and phone width on the homepage, Siaya repair page and guest order/payment status page. The final page uses the shared header/footer, remains readable at 390px and does not require sign-in.
- Local API callback smoke test — malformed callback returned JSON HTTP 400; a 70 KB JSON payload exceeded the dedicated 64 KB route limit and returned HTTP 413. No provider request or payment was made.
- `git diff --check` — passed.
- Initial live read-only audit — `/`, `/repair` and `/spares` were inspected. The catalogue exposed no verified model-specific product/price inventory, so none was invented. No booking, order, login or admin mutation was submitted during the audit.
- Production deployment — Vercel confirmed final commit `2a23eff119b1ffb8a019806383021da5cd0a1c49` deployed successfully.
- Live HTTP check — `/`, `/phone-repair-siaya`, `/repair`, `/repair-status`, `/spares`, `/order-status`, `/owner-login` and `/admin` returned HTTP 200; a unique unknown path returned HTTP 404 with brand/recovery links; `/robots.txt` and `/sitemap.xml` returned HTTP 200. Both private status routes returned `noindex,nofollow`, `Referrer-Policy: no-referrer` and `Cache-Control: private, no-store`; neither was listed in the sitemap.
- Live rendered QA — homepage, repair intake, catalogue and the deployed guest order-status page rendered in the browser. The order-status page shows the reference lookup form without requiring sign-in. The public products API returned an empty list; the catalogue presents an honest empty state, and the parts summary says “No items selected yet” without showing a zero-KES estimate. No customer details were entered and no request/payment/admin mutation was created during the live check.

A non-fatal pnpm configuration warning appears in the environment about the repository's existing `pnpm` manifest settings being ignored; the frozen install, checks and build completed. It was not silently rewritten because an attempted workspace-config migration removed the existing patch/override from the lock graph. This package-manager configuration merits a separate controlled cleanup.

## Owner prerequisites for the remaining flows

1. **M-PESA activation:** Safaricom Daraja has been selected as the assumed provider. Apply the entire `supabase/migrations/002_daraja_payment_attempts.sql` and verify `select public.daraja_payment_ready();` returns `true`, then configure the server-only Daraja sandbox credentials and matching callback in Vercel. Follow [`daraja-setup.md`](daraja-setup.md) and test only in sandbox before production credentials are considered. Do not use the unsigned callback's receipt as settlement evidence; reconcile the receipt through Safaricom's merchant records.
2. **Customer accounts:** apply the full `supabase/migrations/003_customer_accounts.sql`, configure Supabase Auth phone sign-in and a real SMS delivery provider, and deploy the server-side `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`. The account service also checks that the profile and order-link columns are visible, and rejects customer sessions unless `CUSTOMER_ACCOUNTS_ENABLED=true`. Follow [`customer-account-setup.md`](customer-account-setup.md); enable it on an isolated Preview project first and leave Production disabled until tested. The app does not generate fake codes; guest purchase remains available. Existing `customers` are guest-service contact records, not sign-in accounts.
3. **Customer notifications:** follow-up remains manual via the published call/WhatsApp links. If automated messaging is later desired, select an approved service and confirm events, consent wording and sender identity.
4. **Real inventory:** enter actual products, images, compatibility, price, stock and availability in the owner portal. The public catalogue should remain empty/quote-oriented rather than pretending to stock items.
5. **Local proof:** confirm the exact address/landmark, hours, operating area, delivery terms and warranty policy. Verify the Google Business Profile and copy its real review link.
6. **Measurement:** connect Search Console and, if desired, a legitimate analytics property. Without them there is no evidence of rankings, traffic lift or conversion improvement.

## Remaining engineering work

- Render the public pages and crawlers from one true source of truth (preferably SSR/SSG from page data); the current static HTML is a useful summary but is still independently maintained from the complete React page.
- Wrap customer/device/ticket and order/item writes in database transactions or RPCs; add recovery for failures before all related rows persist.
- Paginate/filter owner record reads and define finance analytics only after real payment and fulfilment records exist.
- With authorized sandbox credentials and the migration applied, test STK initiation, callback/query reconciliation, duplicate/out-of-order callbacks, cancellations, rate limiting and owner payment visibility. Do not use a live charge or fake customer record as QA.

## Sources

- Google local ranking guidance: <https://support.google.com/business/answer/7091?hl=en>
- Google Maps review and prohibited-content policy: <https://support.google.com/contributionpolicy/answer/7400114?hl=en>
- Google Business Profile representation guidelines: <https://support.google.com/business/answer/3038177?hl=en>
- Share an actual Business Profile review link/QR: <https://support.google.com/business/answer/3474122?hl=en>
- Vercel custom 404 guide: <https://vercel.com/kb/guide/custom-404-page>
- Pro-Logic Technologies: <https://prologictechnologies.co.ke/>; local Yala mention: <https://www.facebook.com/tvrepairnairobi/videos/television-repair-at-yala-township-siaya-county-pro-logic-technologies-072376317/1137288401461293/>
- Gulf Phone Repair Siaya-facing post: <https://www.facebook.com/100082498960795/posts/the-shop-is-open-dealers-inphone-repairs-and-services-sub-hoofers-repair-and-ser/1102485065844782/>
- BusinessClaud electronics category: <https://businessclaud.co.ke/categories/electronics-in-siaya>
- Carlcare Kenya: <https://www.carlcare.com/ke/> and <https://www.carlcare.com/ke/tips-detail/Who-fixes-phones-near-me/>
- Global Electronics Kenya: <https://globalelectronicskenya.co.ke/>
- Mzuri repair directory: <https://mzuri.co.ke/repairs>
- Safaricom Daraja portal: <https://developer.safaricom.co.ke/>; STK Push: <https://developer.safaricom.co.ke/apis/MpesaExpressSimulate>; STK query: <https://developer.safaricom.co.ke/apis/MpesaExpressQuery>
- Daraja activation instructions and exact server environment variable names: [`daraja-setup.md`](daraja-setup.md).
