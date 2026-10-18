# Digital Phone Hub — website audit and release report

**Audit date:** 18 October 2026
**Scope:** public production-site review, selected customer flows, repository/API/auth review, local production-build inspection and a Siaya/Kenya service-site benchmark.

## Executive summary

The site has been materially improved across its real customer and owner workflows. Its public pages now share one warm, restrained Siaya storefront identity, the repair journey exposes less customer information, parts requests distinguish enquiries from paid orders, owner actions report missing/failed writes more honestly, and the generated site contains a branded 404 page. The work preserves the existing app/database stack and the shop's real identity and photos.

This is **not** a claim that every requested third-party journey is complete. There are no configured merchant credentials, customer identity-verification provider or customer messaging channel in the repository/session. Payment, customer sign-in and automated customer notifications therefore remain intentionally unimplemented rather than simulated. The live catalogue also needs owner-supplied product data. A #1 local ranking cannot be guaranteed by code changes alone.

## What the audit found and changed

| Area | Verified issue before changes | Implemented improvement |
|---|---|---|
| Brand and trust | The homepage and Siaya repair page used conflicting visual styles; footer and mobile action text had poor contrast; the fixed phone action rail could cover the final content. | Reworked the shared public shell and phone-repair page around the existing Digital Phone Hub mark, genuine shop imagery, warm ivory/ink surfaces and oxide-red action color. Raised mobile/footer contrast, added visible focus, removed the viewport zoom cap and reserved phone safe-area space. |
| Repair booking and tracking | Public reference lookup returned issue/device/quote information and used timestamp-derived references; retries could create duplicate requests. | Uses an unguessable random request reference that can be reused for a safe retry. Public status responses now contain only the reference, operational status and update time. The repair success path directs customers to tracking. The public lookup is still a bearer-reference mechanism, so customers should keep references private. |
| Schema mismatch | The public form offered an `electronics` type rejected by the deployed database constraint. | The server stores the compatible `other` value and retains the customer-selected category in the device notes. No unverified production schema migration was assumed. |
| Parts and order request | Unknown-price items were recorded as zero-total orders; delivery did not require a location; custom items could be omitted alongside catalogue selections; the basket was lost on reload. | The server resolves active product prices/stock itself, requires a delivery area, blocks stale/unavailable lines, and stores unknown-price requests as unpriced enquiries. Basket selections now survive the tab session and stale lines are called out. The UI does not represent these requests as paid checkouts. |
| Owner portal | Several mutations could report success for missing records; product edits closed before confirmation; removed products could not be restored from the catalogue; the owner email was prefilled; operational “ready/live” labels were static. | Added affected-row checks, awaited product-save feedback, reversible product visibility, a private customer contact-record view, whole-KES quote validation, a neutral login form and more truthful operating states. Owner cookie lifetime now follows the Supabase token and logout clears the owner cookie and attempts provider-side revocation. |
| Search and routes | Unknown paths could serve the homepage with HTTP 200 (soft 404); the viewport prevented user zoom; private owner/status routes needed explicit exclusion. | Added a branded `404.html`, removed the generic Vercel SPA catch-all while retaining API/storage rewrites, preserved route metadata, and marked status/owner paths `noindex`. |
| Configuration honesty | No real analytics ID was configured, while placeholder analytics references remained in the HTML. | Removed invalid placeholders rather than shipping a request to a fake/missing analytics endpoint. Analytics remain unconfigured. |

The initial full source audit also found that related database writes are not wrapped in a database transaction, current owner lists are not fully paginated, and static crawler HTML remains a hand-authored summary rather than a complete server-render of the hydrated React page. These are not described as solved. See the longer-term section below.

## Customer and owner routes

- `/` and `/phone-repair-siaya` — brand-consistent Siaya shop/service discovery, using existing photographs and real contact details already present in the source.
- `/repair` — persisted repair-request flow; uses the deployed-schema-compatible device category and a retry-safe reference.
- `/repair-status` — reference-based, minimal status view; private from search indexing.
- `/spares` — owner-managed live catalogue and server-validated request flow. It is not a payment checkout.
- `/owner-login` and `/admin` — existing Supabase owner authentication and protected operations. The dashboard has a customer-contact directory, not customer account administration.
- Unknown paths — build emits a branded recovery page; production host behavior must still be checked after the release deployment.

No customer signup/OTP, real payment, payment callback, customer SMS/email, or WhatsApp API was added without the account and secret needed to deliver it. The site may continue to offer guest booking/enquiry links while these decisions are pending.

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
- `pnpm test` — passed: 2 files, 12 tests.
- `pnpm run build` — passed; emitted crawler-visible pages and a branded 404.
- Built-route inspection — all seven intended route files had titles/descriptions and expected canonicals; repair-status and owner routes were `noindex`; 404 contained the brand and recovery links.
- Visual review — screenshots of the production build at desktop width and at 390×844 on the homepage and Siaya repair page. The typography, hierarchy, image and mobile rail were visually checked.
- `git diff --check` — passed.
- Initial live read-only audit — `/`, `/repair` and `/spares` were inspected. The catalogue exposed no verified model-specific product/price inventory, so none was invented. No booking, order, login or admin mutation was submitted during the audit.

A non-fatal pnpm configuration warning appears in the environment about the repository's existing `pnpm` manifest settings being ignored; the frozen install, checks and build completed. It was not silently rewritten because an attempted workspace-config migration removed the existing patch/override from the lock graph. This package-manager configuration merits a separate controlled cleanup.

## Owner prerequisites for the remaining flows

1. **M-PESA/payment:** choose and approve a merchant provider—Safaricom Daraja, Paystack or Pesapal are candidates—and configure its sandbox/live app, shortcode/merchant account, callback URL and secrets. Keep payment callbacks server-side, verify the amount/currency/reference, make callbacks idempotent, and only then record `paid`.
2. **Customer accounts:** choose phone OTP or email verification and recovery requirements. Existing `customers` are guest-service contact records, not sign-in accounts; do not let an unauthenticated phone number claim an existing contact record.
3. **Customer notifications:** choose an approved SMS/email/WhatsApp API and confirm which status events may be sent, consent wording and sender identity.
4. **Real inventory:** enter actual products, images, compatibility, price, stock and availability in the owner portal. The public catalogue should remain empty/quote-oriented rather than pretending to stock items.
5. **Local proof:** confirm the exact address/landmark, hours, operating area, delivery terms and warranty policy. Verify the Google Business Profile and copy its real review link.
6. **Measurement:** connect Search Console and, if desired, a legitimate analytics property. Without them there is no evidence of rankings, traffic lift or conversion improvement.

## Remaining engineering work

- Render the public pages and crawlers from one true source of truth (preferably SSR/SSG from page data); the current static HTML is a useful summary but is still independently maintained from the complete React page.
- Wrap customer/device/ticket and order/item writes in database transactions or RPCs; add recovery for failures before all related rows persist.
- Paginate/filter owner record reads and define finance analytics only after real payment and fulfilment records exist.
- Test owner login and external integrations with authorized sandbox credentials; test production read-only pages after deployment. Avoid a live charge or fake customer record during QA.

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
- Safaricom Daraja portal: <https://developer.safaricom.co.ke/>; Paystack Kenya: <https://paystack.com/ke>; Pesapal API: <https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json/api-reference>
