# Digital Phone Hub — release TODO

## Implemented in this release candidate

- [x] Consolidated customer-facing pages around the existing brand mark and real shop imagery; corrected contrast, keyboard focus, mobile navigation, zoom, skip links and fixed-action-rail clearance.
- [x] Unified the Siaya phone-repair page with the storefront without inventing credentials, prices or warranties.
- [x] Replaced predictable timestamp-based public repair/order references with random, retry-safe request IDs. Public repair tracking now returns only reference, status and update time.
- [x] Kept the repair form's `electronics` category compatible with the deployed DB constraint by storing `other` plus the selected category in notes; no unverified migration was assumed.
- [x] Required an area for delivery requests; revalidated active catalogue products and quantities server-side; treated any unpriced line as a quote/availability request rather than a zero-KES sale.
- [x] Added per-tab basket persistence, stale-item protection, clear quote-vs-order wording and stable submission retries.
- [x] Added an owner-only contact-record directory (not customer sign-in accounts); included inactive items in owner inventory; added reversible publish/hide controls.
- [x] Made owner mutations check for missing rows, kept product edit forms open until save confirmation, improved whole-KES quote validation and removed static “live/ready” promises.
- [x] Matched owner-session cookie lifetime to Supabase token expiry; clear the owner cookie on logout and attempt provider-side session revocation. Removed the visible default owner email.
- [x] Added a branded build-time 404 output and Vercel unmatched-route handling while retaining API/storage routes; private tracking/owner pages are `noindex`.
- [x] Added the requested review/trust playbook and reusable senior product/engineering prompt under `docs/`.
- [x] Passed TypeScript checks, 12 automated tests and the production build; inspected production-build screenshots at desktop and 390px phone width.

## Release and live verification

- [ ] Review and commit the tested changes on `main`.
- [ ] Push the authorized release and verify its Vercel deployment.
- [ ] Recheck public routes, route metadata, sitemap and unknown-route HTTP status on the live site after deployment.
- [ ] Do not submit a production repair request, parts order, payment or owner mutation during QA.

## Owner decisions and real data still needed — no mock flows

- [ ] **Payments:** choose a merchant provider (Safaricom Daraja, Paystack or Pesapal) and authorize/configure its sandbox/live credentials and callback settings through the approved secret process. There is no payment checkout or “paid” state until this exists.
- [ ] **Customer registration/login:** choose a verified identity channel (for example, phone OTP or email), recovery flow and actual customer-account requirements. Existing customer entries are guest-service contact records, not login accounts.
- [ ] **Customer notifications:** choose and configure an authorized email/SMS/WhatsApp API provider and approve which customer events should be sent. Current integration is owner-facing; it does not send customer confirmations.
- [ ] **Catalogue:** add accurate product names, real photos, model compatibility, KES prices, stock and availability in the owner portal. The live catalogue currently has no verifiable model-specific listings/prices, so none were invented.
- [ ] **Local trust:** verify the exact customer-facing street address/landmark, hours, service/delivery area and warranty terms. Confirm the actual Google Business Profile and only then add its real review URL.

## Remaining longer-term work (not completed)

- [ ] Derive the full static route output from the same source as hydrated React or adopt true SSR. Current crawler output is a useful first-response summary, not a full React server render.
- [ ] Paginate/filter large owner record lists and define reporting metrics from reliable orders/payments before offering sales/revenue analytics.
- [ ] Test account verification, payment callbacks, customer notifications and owner login using authorized sandbox credentials, then perform a safe production smoke test.
- [ ] Monitor Search Console / verified Business Profile performance. The site cannot guarantee a #1 local result; relevance, distance and prominence also matter.
