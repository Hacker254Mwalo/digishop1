# Digital Phone Hub — release TODO

## Implemented in this release candidate

- [x] Consolidated customer-facing pages around the existing brand mark and real shop imagery; corrected contrast, keyboard focus, mobile navigation, zoom, skip links and fixed-action-rail clearance.
- [x] Unified the Siaya phone-repair page with the storefront without inventing credentials, prices or warranties.
- [x] Replaced predictable timestamp-based public repair/order references with random, retry-safe request IDs. Public repair tracking now returns only reference, status and update time.
- [x] Kept the repair form's `electronics` category compatible with the deployed DB constraint by storing `other` plus the selected category in notes; no unverified migration was assumed.
- [x] Required an area for delivery requests; revalidated active catalogue products and quantities server-side; treated any unpriced line as a quote/availability request rather than a zero-KES sale.
- [x] Added per-tab basket persistence, stale-item protection, clear quote-vs-order wording and stable submission retries; the empty basket now shows “No items selected yet” rather than a KES 0 estimate.
- [x] Added an owner-only contact-record directory (not customer sign-in accounts); included inactive items in owner inventory; added reversible publish/hide controls.
- [x] Made owner mutations check for missing rows, kept product edit forms open until save confirmation, improved whole-KES quote validation and removed static “live/ready” promises.
- [x] Matched owner-session cookie lifetime to Supabase token expiry; clear the owner cookie on logout and attempt provider-side session revocation. Removed the visible default owner email.
- [x] Added a branded build-time 404 output and Vercel unmatched-route handling while retaining API/storage routes; private tracking/owner pages are `noindex`.
- [x] Added the requested review/trust playbook and reusable senior product/engineering prompt under `docs/`.
- [x] Passed TypeScript checks, 21 automated tests and the production build; inspected production-build screenshots at desktop and 390px phone width, including guest order/payment status.

## Release and live verification

- [x] Committed the tested changes to `main` (`d4dae56`; live-QA refinement `7523ef5`).
- [x] Pushed the release; Vercel confirmed the final production deployment for `7523ef5a6314afccb81d4aafc497e4b22b76666d`.
- [x] Checked live public routes, route metadata, sitemap, robots and unknown-route HTTP 404; the rendered homepage, repair intake and catalogue loaded without browser-console output.
- [x] No production customer request, payment or owner mutation was created during QA. The empty repair form was clicked with required fields blank; no customer data was entered.
- [ ] Commit and deploy the new guest Daraja checkout, order-status route and payment safeguards; the previously verified live site does not yet contain this follow-up work.
- [ ] After deployment, verify `/order-status` is live, noindex and has no console errors; use only a random nonexistent reference and do not send an STK request.

## Owner decisions and real data still needed — no mock flows

- [x] **Daraja guest-checkout code:** initiate STK only for an owner-confirmed positively priced order; use server-side order total/phone; persist idempotent attempts; reconcile callback ID, amount, phone and order total with a Daraja status query before marking paid; rate-limit retries and prevent closing orders during unresolved payment.
- [ ] **Payment activation:** apply the payment table migration, configure Daraja merchant credentials, shortcode, passkey, transaction type, environment and callback in Vercel, then test in sandbox. No M-PESA prompt or paid state is enabled without these prerequisites.
- [x] **Guest access and messages:** purchasing does not require customer registration. Current real follow-up is manual call/WhatsApp; no automated customer SMS/email/WhatsApp delivery is claimed.
- [ ] **Catalogue:** add accurate product names, real photos, model compatibility, KES prices, stock and availability in the owner portal. The live public-products API currently returns an empty list; the site shows an honest empty state rather than inventing stock.
- [ ] **Local trust:** verify the exact customer-facing street address/landmark, hours, service/delivery area and warranty terms. Confirm the actual Google Business Profile and only then add its real review URL.

## Remaining longer-term work (not completed)

- [ ] Derive the full static route output from the same source as hydrated React or adopt true SSR. Current crawler output is a useful first-response summary, not a full React server render.
- [ ] Paginate/filter large owner record lists and define reporting metrics from reliable orders/payments before offering sales/revenue analytics.
- [ ] Test account verification, payment callbacks, customer notifications and owner login using authorized sandbox credentials, then perform a safe production smoke test.
- [ ] Monitor Search Console / verified Business Profile performance. The site cannot guarantee a #1 local result; relevance, distance and prominence also matter.
