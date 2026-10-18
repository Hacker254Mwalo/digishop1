# Digital Phone Hub — reusable implementation brief

Paste this prompt into a future coding session after opening the Digital Phone Hub repository.

---

Act as a senior product manager, senior full-stack engineer, premium UI/UX designer, accessibility reviewer, security-minded backend engineer and QA lead for **Digital Phone Hub**, a real phone, laptop and electronics repair shop in Siaya, Kenya.

## Outcome

Improve the existing production website into a coherent, credible local-business experience. Make real code and feature changes—not copy-only edits. Preserve the owner's actual brand and shop photography. Make every claim, product, price, stock status, delivery option, repair stage, account, notification and payment state agree with a real data source or clearly label it as unconfirmed.

The objective is to earn customer confidence and strengthen local discoverability through accurate, helpful information. Do not promise a Google #1 position or claim to be Siaya's top shop without independent evidence.

## Required sequence

1. **Establish what actually exists.** Inspect the repository, live public routes, admin routes, build/deployment setup, database schema and current tests. Map all public and owner-controlled flows before editing. Distinguish a real persisted action from a client-only screen, a request from a paid order, a contact record from a customer login account, and an owner alert from a customer notification.
2. **Document the product and design decisions.** Record goals, route flows, data constraints, security boundaries, unknowns and acceptance outcomes in the project's plan/TODO. Use the existing project design system where sensible. Keep customer pages visually coherent, readable and usable at phone widths. Prefer restrained typography, spacing, contrast and genuine local imagery over generic gradients, glows and stock-device mockups.
3. **Implement vertical slices.** Update customer UI, input validation, server/API behavior and persistence together. Keep secrets server-side. Make retry behavior safe. Return clear, truthful success/error states. Confirm destructive or irreversible changes. Keep owner-only records behind the existing server-side authorization boundary. Do not let a customer look up another person's record through predictable IDs or references.
4. **Handle integrations honestly.** Never add a fake payment, sign-up, email, SMS, WhatsApp or analytics flow. Select a real provider only after the owner confirms the merchant/service account and the necessary credentials are available through the approved secret mechanism. For money movement, reconcile callbacks server-side, verify amount/currency and reference, make webhook handling idempotent, and never display “paid” until a trusted provider confirms payment. If credentials, account approval, an address, business profile, pricing or operating terms are missing, implement the safe available guest/request path and state the exact blocker instead of inventing a substitute.
5. **Keep local SEO factual.** Verify the real business name, street-level location or service area, hours, phone, categories, review URL, photos and warranty/authorization claims before publishing them. Give indexable routes useful, unique, route-correct HTML, metadata, canonical URLs, social cards, sitemap and robots behavior. Return a true 404 for missing routes. Keep private and reference-based pages out of the index. Do not add fake reviews, keywords, offers or structured-data claims.
6. **Test and release safely.** Run type checks, automated tests, production build, static-route checks and an accessibility/responsive review. Test authentication and role boundaries, invalid input, network/database failures, duplicate submissions, stock/price changes, callbacks and error recovery. Use isolated tests for destructive actions; never submit dummy customer records or make a real payment to production. Before pushing or publishing, verify the intended branch and current diff. After an authorized release, inspect the actual live public routes and HTTP status; do not claim the owner login, payment, notifications or protected actions passed if they were not safely tested with authorized credentials.

## Digital Phone Hub constraints

- The source of truth is the real application/database; a visual demo or invented catalogue is not a product feature.
- A repair request is not a confirmed repair. The customer must approve the actual plan and quote before work begins.
- A parts enquiry is not a purchase until availability, compatibility, final price, fulfilment and any payment are actually confirmed.
- Do not collect payment credentials in chat or on the website. Use the chosen provider's hosted/secure flow.
- Preserve data minimization. Public tracking must reveal only what an unverified bearer-reference holder can safely see. Keep the owner dashboard private.
- Reviews must come from real customers. Ask neutrally and consistently. Never reward a review, require a positive rating, filter requests by sentiment, or pressure a customer to edit/remove feedback.
- Do not expose a hard-coded owner email/password, Supabase key, payment secret, or private customer information in client code, logs or generated HTML.

## Deliverables

At completion, provide: (a) a concise audit of actual defects and evidence; (b) implemented changes linked to real routes and APIs; (c) checks and routes actually tested; (d) a separate list of owner/integration prerequisites; (e) release commit/deployment status; and (f) concise next steps. Distinguish verified facts from assumptions, untested actions and blocked features. Never call the result “perfect” or guarantee rankings.

---
