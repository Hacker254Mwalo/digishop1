# Digital Phone Hub — release TODO

## Completed and verified in the prior production release

- [x] Rebuilt the public storefront around the shop's existing brand and photography; improved responsive layouts, contrast, focus, skip navigation and zoom support.
- [x] Preserved guest repair booking, parts requests and item-order tracking; added retry-safe high-entropy references and removed bearer references from URLs and prefilled customer WhatsApp links.
- [x] Kept repair/order status pages private from search, referrers and caches; added route-specific prerendered SEO and a branded 404.
- [x] Improved the owner portal's inventory visibility controls, customer contact directory, validation and mutation feedback.
- [x] Integrated real Daraja STK initiation and provider-query reconciliation code with database-level payment safeguards. It fails closed until merchant credentials and the full payment migration are configured; Production rejects sandbox mode.
- [x] Deployed and verified the order-status and repair-status routes in production. No real customer order or M-PESA prompt was created during QA.

## Optional customer login and sign-up — current follow-up

- [x] Implemented `/account` with a username and Kenyan phone number, Supabase Auth SMS one-time-code sign-up/sign-in support, and a separate customer session that does not alter owner/admin login. Production code delivery remains disabled until real SMS setup is verified.
- [x] Replaced the long two-panel introduction with one compact mobile-first sign-in/create-account form shown immediately. When real phone auth is unavailable, the fields remain visible, code sending is disabled, the reason is brief, and the guest path stays clear.
- [x] Implemented private account profile and account-linked item-request history. Only server-verified, phone-confirmed Supabase identities can use customer account procedures.
- [x] Kept guest purchase/request flows optional. New requests link only when the submitted number matches the verified account phone; older guest requests are never auto-claimed. If account storage is missing, the order request falls back to guest mode.
- [x] Added an additive migration, private route headers/metadata, regression coverage and [`customer-account-setup.md`](docs/customer-account-setup.md). Migration `003_customer_accounts.sql` is now applied to the connected Supabase project; verify it matches Vercel's configured database before enabling sign-in.
- [x] Committed and pushed as `23ff46cf33a4ec6d3c3a029d5b3f6b8ce762fbd8`; Vercel deployed it to Production. Verified `/account` returns HTTP 200 with noindex, no canonical/social URL, no-referrer and no-store protections, and is absent from the sitemap. The auth-config endpoint returned `{"enabled":false}`; no SMS was requested.
- [ ] Configure and verify a real Supabase Auth phone/SMS provider in an isolated Preview project, apply migration 003 there, and set `CUSTOMER_ACCOUNTS_ENABLED=true` only in that Preview environment. Production currently lacks the feature flag and the live config endpoint returns `{"enabled":false}`. Keep Production disabled until Preview passes and the owner approves activation. No simulated OTP may be presented as production authentication.

## Owner prerequisites and remaining operational work

- [ ] **M-PESA activation:** follow [`daraja-setup.md`](docs/daraja-setup.md); apply the complete payment migration, configure the approved Daraja merchant credentials and exact callback in Vercel, verify the database readiness RPC, and test sandbox only in a separate Preview/database. No production STK prompt is enabled without these prerequisites.
- [ ] **Inventory:** enter real product names, images, compatibility, KES prices, stock and availability. The catalogue must remain honest/quote-oriented until the owner supplies verified data.
- [ ] **Local trust:** confirm the exact address/landmark, hours, service area, delivery terms and warranty. Verify the actual Google Business Profile and add only its real review URL.
- [ ] **Measurement:** connect Search Console and, if desired, a legitimate analytics property. No ranking or conversion lift is claimed without measurement.
- [ ] **Customer notifications:** follow-up remains manual via call/WhatsApp; choose an approved messaging provider and consent/event policy before implementing automated notifications.

## Longer-term engineering

- [ ] Derive crawler-visible route output from the same source as hydrated React or adopt true SSR; current prerender is an independently maintained summary.
- [ ] Paginate/filter large owner lists and define reporting metrics from reliable completed orders/payments before presenting sales analytics.
- [ ] Continue live QA with authorized Preview identities and test data; do not create a production customer request or payment as a smoke test.
