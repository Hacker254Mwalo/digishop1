# Manus Continuation Guide — Digital Phone Hub / Highbridge

_Last updated: 2026-10-17_

This file is the durable handoff for any future Manus session continuing the Digital Phone Hub / Highbridge phone, laptop and electronics repair-and-commerce platform.

## Mission

Build a trustworthy Siaya-first service desk and online shop. The platform must help visitors solve real device problems, request repairs, find compatible parts and accessories, place assisted orders, and give the owner a simple operating system for inventory, repairs and orders.

Do not copy Carlcare branding, wording or layout. Use the business’s own identity, real workshop/storefront imagery, clear Kenyan customer language, practical actions and human confirmation.

## Repository and deployment

- GitHub repository: `Hacker254Mwalo/digishop1`
- Working directory: `/home/ubuntu/digishop1`
- Main branch: `main`
- Vercel project: `digishop1`
- Vercel project ID: `prj_dBWA6FO9f0uedNevNrvb5DqoKhCQ`
- Production aliases include `https://digishop1.vercel.app` and the configured `digitalelectronics.tech` domains.
- Git identity used for Vercel Hobby compatibility: `Hacker254Mwalo <albastuz3dtech@gmail.com>`

Always begin a continuation with:

```bash
cd /home/ubuntu/digishop1
git status --short --branch
git log -5 --oneline
```

Never overwrite unrelated user changes. Inspect the current diff before editing.

## What is already implemented

### Public customer platform

- Service-and-commerce homepage focused on repair, parts, accessories and local contact.
- Public shell with persistent call/WhatsApp/contact actions.
- Repair booking, repair status lookup, shop catalogue, order request flow and route manifest.
- Siaya-local language and practical human-confirmation copy.
- Real brand/workshop/storefront images are used selectively instead of repeated decorative image cards.
- Shop product image presentation, product detail view, stock/request states and assisted product enquiry.
- Admin product image upload supports validation, preview, free browser-side background removal, centering/cropping and lighting preparation.
- Existing product images can be replaced from the owner dashboard.

### Owner operations

- Admin dashboard for overview, inventory, repairs and orders.
- Product creation and editing, by-order catalogue listings, stock and reorder levels.
- Inventory search, reorder attention, CSV export and image replacement.
- Repair quote entry, customer quote visibility and approval conversation path.
- Owner copilot is read-only: it can summarize inventory, repair queue and order follow-up, but must never mutate records or expose customer contact data.

### AI features

- Customer repair helper inside the repair booking journey.
- AI product advisor in the shop: customers describe a device/model/need in normal language and receive catalogue SKU suggestions.
- Owner operations copilot for inventory, repairs and new orders.
- Safe deterministic fallbacks are retained for when the model is unavailable.
- AI calls use structured output for repair intake and product recommendations.
- GPT-5 requests use `max_completion_tokens` and minimal reasoning so reasoning does not consume the entire visible response budget.
- Supported provider environment variables:
  - `BUILT_IN_FORGE_API_KEY`
  - optional `BUILT_IN_FORGE_API_URL`
  - `OPENAI_API_KEY`
  - optional `OPENAI_API_BASE`
  - `AI_MODEL` (production has been set to `gpt-5-mini`)
- Provider selection is safe: Forge is preferred only when its key exists; otherwise OpenAI-compatible credentials are used. Never send an OpenAI key to a Forge URL.

## Current important commits

- `caaf105` — Activate AI responses and add shop advisor
- `d777cca` — Make dual AI provider selection safe

The latest code was pushed to `origin/main`. Vercel accepted the deployment for `d777cca` and reported `READY`.

## Current live AI limitation

The production app currently returns `aiPowered: false` because Vercel has no provider credential configured. The application code is ready and was tested locally with a real model response (`aiPowered: true`). Do not falsely claim live AI is active until this endpoint confirms it:

```bash
curl -sS -X POST 'https://digishop1.vercel.app/api/trpc/public.repairHelper?batch=1' \
  -H 'content-type: application/json' \
  --data-raw '{"0":{"json":{"deviceType":"phone","brand":"Samsung","model":"A14","issue":"The phone charges slowly and stops after a few minutes"}}}'
```

Expected activation result includes:

```json
"aiPowered":true
```

A provider key must be added to Vercel Production by the account owner. Do not put a key in GitHub, source code, a markdown file, chat, or browser screenshots. If the owner has no provider account/key yet, guide them to create one securely. Do not invent or copy sandbox-only credentials into Vercel.

## Verification commands

Run before every push:

```bash
pnpm check
pnpm test -- --run
pnpm build
git diff --check
git status --short --branch
```

The build may show existing warnings about missing optional Umami variables and large image/background-removal chunks. Do not treat those warnings as failures unless the user specifically asks to optimize bundle size or analytics.

After pushing, inspect Vercel deployment status. Confirm the deployment commit SHA matches `origin/main`, state is `READY`, and aliases are attached. Then test at least:

```bash
curl -I https://digishop1.vercel.app/
curl -I https://digishop1.vercel.app/spares
curl -sS https://digishop1.vercel.app/api/trpc/auth.me?batch=1
```

## Browser continuation state

The previous browser task opened:

`https://platform.openai.com/api-keys`

It redirected to the OpenAI login page. The user asked to log in and have the AI key configured. The sandbox browser is not the user’s local browser, and My Browser was not enabled for the session. If continuing browser work:

1. Do not ask the user to send a secret in chat.
2. Navigate to the provider login/API-key page.
3. Use browser takeover for the user’s login or manual secret entry when required.
4. Never read, print, screenshot, relay or commit the secret.
5. If the user creates an OpenAI key, they should add it directly to Vercel Project Settings → Environment Variables with target `Production`, or complete the secure form if a supported browser flow is available.
6. Redeploy after the environment variable is saved; environment-variable changes do not automatically update an existing deployment unless Vercel triggers a new deployment.
7. Verify the live repair helper returns `aiPowered: true`.

## Product and design rules

- Do not make random visual changes just to create a “vibe.” Inspect the rendered route first.
- Keep typography proportionate; avoid oversized hero headings and busy first-viewport artwork.
- Use a real image only when it supports the decision the visitor is making. Prefer a restrained background/hero treatment with readable contrast.
- Do not use placeholder product images as if they are real catalogue stock.
- Every sellable product must have a clear name, category, price, availability, compatibility guidance and image where appropriate.
- Keep out-of-stock and by-order products honest; never show “Add to basket” when the owner must confirm availability.
- Repair diagnosis and pricing must remain subject to inspection.
- AI may assist, summarize and recommend. It must not promise diagnosis, price, stock, compatibility or repair completion without owner confirmation.

## Suggested next work after AI activation

Prioritize measurable business outcomes, not more decorative UI:

1. Add an owner-visible AI health indicator showing provider availability and last successful model call without exposing credentials.
2. Add product analytics with privacy-safe events: search, advisor request, product detail view, order request and repair booking start.
3. Improve product catalogue data quality: compatibility aliases, clean SKUs, condition, warranty/return notes and delivery/collection options.
4. Add customer notification templates for received request, quote ready, order confirmation and collection readiness.
5. Add local SEO pages for Siaya service intent: phone screen repair, laptop repair, phone accessories and device diagnostics.
6. Add rate limits, abuse protection and request logging with no unnecessary customer PII.
7. Optimize the background-removal dependency through lazy loading/code splitting only if the user experiences a real performance problem.

## Safe continuation protocol

When the context is nearly full or the user says “continue”:

1. Read this file first.
2. Inspect `git status`, latest commits and Vercel status.
3. Read only the specific source files relevant to the next task.
4. Do not repeat completed redesigns or re-research already captured here.
5. Make one coherent change set.
6. Run check, tests, build and diff check.
7. Commit with a specific message and push `main`.
8. Verify Vercel and the relevant live route.
9. Update this file with the new commit, completed work and remaining blocker.

## Final user-facing handoff format

When reporting progress, state plainly:

- What changed.
- What was tested.
- Git commit and deployment state.
- Any real blocker, especially missing credentials or unavailable integrations.
- The single next action required from the user, if any.

Never claim that production AI works until the live endpoint reports `aiPowered: true`.
