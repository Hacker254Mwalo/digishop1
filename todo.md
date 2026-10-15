# Project TODO

- [x] Configure the polished public and owner/admin visual system.
- [x] Add shared database tables for customers, devices, repair tickets, repair stages, technician notes, products, inventory and order requests.
- [x] Apply the database schema through the required migration workflow.
- [x] Add protected owner/admin procedures and role checks.
- [x] Build the owner dashboard for new requests, active repairs, ready-for-collection devices, low-stock items and pending spare-part orders.
- [x] Build repair management for request details, technician assignment, stage updates, notes and customer/device history.
- [x] Build inventory management for adding products, editing prices, stock and availability.
- [x] Build spare-part order management for reviewing and processing customer requests.
- [x] Connect public repair booking to the shared backend.
- [x] Connect public spare-parts ordering to the shared backend.
- [x] Replace browser-local repair and order persistence with server-backed operations.
- [x] Add loading, empty, error and success states across public and owner workflows.
- [x] Add Vitest coverage for authorization, core procedures and critical data flows.
- [x] Validate responsive desktop and mobile views, accessible labels/focus affordances, and local production-build readiness; production publishing remains an owner-controlled Management UI action.
- [x] Save the final checkpoint after all completed items are marked done.
- [x] Add customer and device history queries and views in the admin repair workspace.
- [x] Add editable inventory controls for existing product price and availability.
- [x] Load and display order items and order notes in the admin order workspace.
- [x] Add missing repair-booking success and admin query/mutation error states.
- [x] Expand Vitest coverage for successful repair/order creation and admin repair, product and order mutations.

- [x] Rework the public experience toward a Carlcare-inspired repair-service structure while preserving Digital Phone Hub branding.
- [x] Introduce a richer, coordinated color system and stronger service-category hierarchy across public pages.
- [x] Improve public repair, spare-parts and repair-status journeys with clearer next actions.
- [x] Expand owner/admin controls and summaries to support the upgraded service workflow.
- [x] Validate Carlcare-inspired redesign across desktop/mobile, accessibility, keyboard focus, labels, contrast, tests and production build.
- [x] Save the Carlcare-inspired upgrade checkpoint for owner review.

- [x] Diagnose why digishop1.vercel.app renders raw source files instead of the application.
- [x] Verify Vercel project root, framework preset, build command, output directory and deployment branch.
- [x] Correct any repository/deployment entrypoint mismatch without changing database data.
- [x] Validate the corrected production artifact and provide the redeploy handoff.
- [ ] Register the Express app at a Vercel-recognized root entrypoint and verify `/api/trpc/*` on the live domain.

- [x] Rebuild the public homepage around real repair, tracking, shop and human-contact decisions instead of decorative marketing copy.
- [x] Add symptom-led repair triage that pre-fills the repair request with the device type and customer wording.
- [x] Improve mobile conversion with persistent call, WhatsApp and booking actions.
- [x] Improve spare-part selling with product-detail WhatsApp enquiries, compatibility messaging, by-order inventory support and clear empty-catalogue request paths.
- [x] Improve owner product operations with validated image preview, listing thumbnails and replacement-image uploads for existing products.
- [x] Add the public route manifest and a Vercel catch-all API entrypoint for nested tRPC routes.
- [x] Validate TypeScript, 9 automated tests, production build, local public routes and local `/api/trpc/auth.me` response.
