# Digital Phone Hub — release TODO

## Completed and verified in the prior production release

- [x] Rebuilt the public storefront around the shop's existing brand and photography; improved responsive layouts, contrast, focus, skip navigation and zoom support.
- [x] Preserved guest repair booking, parts requests and item-order tracking; added retry-safe high-entropy references and removed bearer references from URLs and prefilled customer WhatsApp links.
- [x] Kept repair/order status pages private from search, referrers and caches; added route-specific prerendered SEO and a branded 404.
- [x] Improved the owner portal's inventory visibility controls, customer contact directory, validation and mutation feedback.
- [x] Integrated real Daraja STK initiation and provider-query reconciliation code with database-level payment safeguards. It fails closed until merchant credentials and the full payment migration are configured; Production rejects sandbox mode.
- [x] Deployed and verified the order-status and repair-status routes in production. No real customer order or M-PESA prompt was created during QA.

## Admin product upload → customer shop

- [x] Admin product create/edit and shop-card rendering use the same fields: title, KES price or honest quote state, category, structured condition, up to five uploaded photos, stock status and description. New physical listings require an owner-selected condition; missing legacy condition is shown as not stated. No mock inventory or fake defaults are added.
- [x] Shop filter options derive from published product categories, so newly entered categories such as iPhone, Samsung and Accessories appear without a second hard-coded filter list. Unit tests cover capitalization, aliases and duplicate categories.
- [x] Product photo bytes, stock and price inputs are validated. New listings remain hidden until selected photos upload successfully; customer stock labels and server request rules share one availability contract.
- [ ] Run a true Admin → Shop upload in an isolated Preview database with owner-approved test products for iPhone and Samsung, then verify the cards and automatic filters in a browser. The selected production catalogue currently has zero products, so no synthetic production listing was created for QA.

## Optional customer login and sign-up

- [x] Implemented optional username/password sign-up and sign-in without SMS. The Kenyan phone number is stored as an unverified contact number, never treated as identity proof; passwords remain in Supabase Auth.
- [x] Kept a compact account form directly accessible, with guest ordering still available when the account gate is closed.
- [x] Implemented private account profile and account-linked request history behind validated Supabase sessions and the account-profile lookup; private responses are no-store and customer auth remains separate from owner/admin auth.
- [x] Added signup throttles keyed by hashes (10 attempts per client address and 3 per normalized phone number per hour), cross-origin protection, regression tests and [`customer-account-setup.md`](docs/customer-account-setup.md).
- [x] Applied Supabase migrations `003_customer_accounts`, `product_catalog_gallery_contract` (catalogue/gallery) and `customer_signup_throttle` to the selected project. Confirm Vercel's `SUPABASE_URL` points to this project before enabling the feature.
- [x] Live `/api/customer-auth/config` returned `{"enabled":false}` on 20 October. Production account access remains fail-closed; the new SMS-free code must be deployed and Preview-tested before any production activation.
- [ ] In a separate Preview project, configure Supabase Email/password auth, apply migrations 003–005, set `CUSTOMER_ACCOUNTS_ENABLED=true` only in Preview, and test signup, sign-in, private request history, duplicate details, rate limits, sign-out and guest ordering. Keep Production disabled until Preview passes and the owner approves activation.

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
