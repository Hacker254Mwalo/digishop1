# Highbridge service hub improvement plan

## Product direction

Turn the existing Digital Phone Hub storefront into a clearer Siaya-first service hub for Highbridge: a customer should understand the next step in under 10 seconds, even if they do not know the correct repair or part name.

## Required outcomes

- Add a practical repair triage entry point with common real-world symptoms and prefilled repair requests.
- Make the homepage prioritize booking, tracking, shop, call and WhatsApp actions over decorative messaging.
- Add plain-language trust and expectation-setting: inspect first, explain the fix, no work without approval, timing depends on diagnosis and part availability.
- Keep the shop useful when the live catalogue is empty by making compatibility requests and human-assisted ordering first-class paths.
- Improve mobile conversion with persistent call / WhatsApp / booking actions and accessible labels.
- Add an FAQ focused on actual Siaya customer objections without inventing unsupported prices, turnaround times or warranty claims.
- Keep existing backend, auth, database, admin and repair-status workflows intact.
- Add a route manifest for the current public routes and verify production build, typecheck and tests.

## Implementation approach

- Rework `client/src/pages/Home.tsx` into a service-led homepage with a symptom triage panel, service cards, trust promises, transparent repair journey, FAQ and direct contact CTA.
- Extend `client/src/components/PublicShell.tsx` with WhatsApp and a small-screen fixed action bar.
- Extend `client/src/pages/RepairBooking.tsx` to read `issue` and `device` query parameters so triage clicks arrive with useful context already filled.
- Add `client/public/manus-routes.json` with the actual public and owner routes.
- Preserve the current dark base but reduce decorative gradients and use a warmer, more operational visual hierarchy: cyan for action, orange for shop, emerald for reassurance, violet for guidance.

## Design

### Style options

- **Service-console editorial** — 0.06: clear panels, strong typography and task-first hierarchy inspired by field-service software.
- **Local workshop utility** — 0.08: practical labels, calm surfaces and visible human contact points.
- **Neon gadget showroom** — 0.03: glossy product-first presentation with heavier effects.

### Chosen style: Service-console editorial

- **Design Movement:** service-console editorial; information architecture leads and visual effects support comprehension.
- **Core Principles:** answer first, show the next step, reduce uncertainty, make human help one tap away.
- **Color Philosophy:** cyan marks action and progress, orange marks parts and buying, emerald marks reassurance, violet marks guidance; the near-black base keeps the service desk content legible.
- **Layout Paradigm:** asymmetric task-led sections with one strong decision panel per viewport instead of centered marketing blocks.
- **Signature Elements:** symptom chips, numbered service steps and a persistent action rail on mobile.
- **Interaction Philosophy:** every card either starts a real action or answers a real question; hover is restrained and keyboard focus is obvious.
- **Animation:** short fade-up entrance only; no looping decoration that competes with forms or status information.
- **Typography System:** Manrope for decisive headings and DM Sans for readable labels, forms and body copy.
- **Brand Essence:** a practical local repair desk for people in Siaya who need the right next step, not a sales pitch. Personality: clear, capable, human.
- **Brand Voice:** direct and reassuring. Example lines: “Start with what changed.” / “We inspect first, then tell you what makes sense.”
- **Wordmark & Logo:** preserve the existing service-desk mark and wordmark until the business supplies an approved Highbridge logo asset.
- **Signature Brand Color:** cyan `#67e8f9`, used sparingly for primary action and status focus.

## Project structure

- `client/src/pages/Home.tsx`: public service hub and symptom triage.
- `client/src/pages/RepairBooking.tsx`: repair intake with query-prefilled context.
- `client/src/components/PublicShell.tsx`: shared navigation, footer and mobile action rail.
- `client/public/manus-routes.json`: route declarations for preview and deployment checks.
- `server/routers.ts`, `server/db.ts`, `drizzle/schema.ts`: unchanged shared repair, order and admin foundation.
