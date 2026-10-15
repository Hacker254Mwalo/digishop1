# Highbridge / Digital Phone Hub platform growth roadmap

## The real objective

The website should become a **local device-care engine**, not only a brochure:

1. A visitor understands what to do in under 10 seconds.
2. A visitor can buy a real item or request one that is not listed.
3. A repair customer can submit a useful request, receive a reference and understand the next stage.
4. The owner can run inventory, quotations, customer follow-up and repeat sales from one calm workspace.
5. Every important interaction produces measurable learning without making the customer feel tracked.

The business has two revenue engines:

- **Immediate revenue:** chargers, cables, covers, screen protectors, batteries, screens, laptop accessories, refurbished devices and other products.
- **Higher-value service revenue:** diagnostics, repair labour, laptop support, data-transfer help and recurring device care.

The shop should not wait for repair traffic. The product catalogue must be treated as the first customer-acquisition engine.

## Priority 0 — make the shop sell real items

This is the highest-value next step because the production catalogue was previously empty. A beautiful shop with zero products cannot generate product sales.

### Owner actions

- Publish the first 25–50 real listings before adding more features.
- Start with fast-moving, easy-to-understand items:
  - USB-C and Micro-USB cables
  - Fast chargers and power adapters
  - Earphones and Bluetooth accessories
  - Phone covers for the most common local models
  - Screen protectors
  - Power banks
  - Laptop chargers
  - Common batteries and screens, marked as **by order** when not held in stock
- Use one clean photo per item, a short honest description, compatibility, price in KES, stock state and fulfilment method.
- Use **by order** for items that can be sourced after customer confirmation. Never show an item as in stock when it is not physically available.
- Add a small warranty/condition note when applicable. Do not invent warranty terms.
- Add product photos from the owner portal and verify the same photo appears publicly before advertising the listing.

### Product listing standard

Every product should answer five questions:

1. What is it?
2. Which device or model does it fit?
3. What is included?
4. What is the price and availability?
5. How will I receive it—collection, delivery or assisted confirmation?

## Priority 1 — improve the visitor funnel

The homepage should route people into four clear jobs:

- **I need a repair** → symptom helper → pre-filled repair request.
- **I want to buy something** → shop → product detail → basket or WhatsApp.
- **I need a part that is not listed** → part request → human confirmation.
- **I already submitted a repair** → track by reference.

### Add next

- A visible “What do you need today?” chooser near the top of the homepage.
- A “Shop by device” path: Samsung, iPhone, Tecno, Infinix, Redmi, HP, Lenovo and other real local demand categories, only when inventory supports them.
- A “Popular in Siaya” section driven by actual sales or enquiries, not invented popularity.
- A “Need help choosing?” product comparison path for chargers, cables, covers and batteries.
- A persistent trust strip: **Siaya service desk · human confirmation · approval before repair · collection or delivery**.
- A real contact card with opening hours, location, phone, WhatsApp and Google Maps once the business profile is ready.

### Conversion rules

- One primary action per viewport.
- Avoid sending a customer to a dead-end informational page.
- Every unavailable product must offer “Request this item” or WhatsApp, not only a disabled button.
- Keep forms short. Ask for technical detail only when it changes the next action.
- Do not publish guessed repair prices. Publish the process and explain that diagnosis comes first.

## Priority 2 — make repair service feel dependable

The existing repair foundation is good. The next stage is to make it operationally complete.

### Customer-facing repair improvements

- Add a clear repair timeline:
  - Request received
  - Device checked
  - Quote waiting for approval
  - Repair in progress
  - Ready for collection
  - Collected
- Let the owner add a plain-language diagnosis and quote to a ticket.
- Add customer approval for the quote before the status can move to **in repair**.
- Add optional before/after photos for the repair record.
- Add pickup/delivery preference and preferred contact channel.
- Add a repair completion note: what was done, what was tested and any care advice.
- Add a limited, owner-configurable service warranty field rather than hard-coding a promise.
- Let the customer download or receive a simple receipt/reference summary.

### Owner workflow improvements

- Add a “Today” queue ordered by urgency and promised next action.
- Add filters for awaiting approval, ready for collection and overdue follow-up.
- Add one-click WhatsApp templates for received, quote ready, repair ready and collection reminder.
- Add customer history by phone number and device model.
- Add a follow-up task after collection: “How is the device working?”

## Priority 3 — build the local visitor engine

Visitors will not arrive consistently from the homepage alone. Build discoverable local pages that answer specific intent.

### Pages to create

- Phone repair in Siaya
- Laptop repair in Siaya
- Screen replacement in Siaya
- Phone battery replacement in Siaya
- Charging port repair in Siaya
- Laptop charger and accessories in Siaya
- Phone covers and screen protectors in Siaya
- Device diagnostics in Siaya
- Product pages for every real high-demand listing

Each page should have:

- One clear search intent.
- Original useful wording, not repeated city-name swaps.
- A real CTA to book, shop or WhatsApp.
- FAQ answers based on actual service policy.
- `LocalBusiness`, `Product`, `Offer` and `FAQPage` structured data only when the information is true.
- Canonical URL, title, description, Open Graph image, breadcrumbs and internal links.

### Local trust distribution

- Complete and maintain the Google Business Profile.
- Add correct address, hours, phone, service area and shop photos.
- Ask real customers for reviews after a completed repair or sale.
- Reply to every review professionally.
- Add the Google profile, WhatsApp and map link consistently across the site.
- Use real workshop and storefront photos. Avoid generic AI imagery for trust-critical sections.

## Priority 4 — add smart features that solve real problems

“Smart” should mean **safer decisions and less owner work**, not a chatbot that invents repair advice.

### Smart compatibility assistant

A customer selects or types a brand/model and the system checks the actual catalogue:

- Compatible product found → show the product and why it fits.
- Possible match → ask one clarifying question.
- No verified match → create a part request or WhatsApp message.
- Never claim compatibility from a free-form guess.

The assistant must be constrained by the product database and clearly label uncertainty.

### Smart stock and sales support

- Low-stock alerts based on sales velocity, not only a fixed reorder number.
- “Frequently bought together” based on real order data.
- Margin and cost fields for the owner, hidden from customers.
- Supplier/source note and expected restock date.
- Product enquiry log, so repeated requests become future catalogue entries.
- Abandoned basket follow-up only with consent and a clear opt-out.

### Smart repair support

- Symptom classifier that suggests the correct intake path, not a diagnosis.
- Duplicate-device detection from phone/model history.
- Suggested internal checklist based on device type and symptom.
- Automatic reminder when a quote has not been approved.
- Automatic collection reminder when a repair is ready.

## Priority 5 — improve the data model before the platform becomes busy

The current schema supports users, customers, devices, repair tickets, products, orders and notes. The next schema additions should be deliberate.

### Recommended tables/fields

- `productImages`: multiple images, sort order, alt text, primary image.
- `productSlugs`: stable SEO-friendly product URLs.
- `productVariants`: model/colour/storage/condition where one listing needs variants.
- `inventoryMovements`: received, sold, reserved, adjusted and returned quantities.
- `suppliers`: supplier name, contact and source notes.
- `productCost`: private owner-only cost and margin fields.
- `partRequests`: requests for products not currently listed.
- `repairQuotes`: amount, explanation, approval state, sent/approved timestamps.
- `repairPhotos`: before, during and after images with consent.
- `customerConsents`: WhatsApp/SMS/email permission and opt-out state.
- `customerFollowUps`: reminders and completed follow-up actions.
- `analyticsEvents`: anonymous funnel events with no sensitive data.

Do not add these all at once. Add the smallest table required for the next proven workflow.

## Priority 6 — measure what actually works

Install privacy-conscious analytics and track outcomes, not vanity numbers.

### Essential events

- `view_home`
- `click_book_repair`
- `start_repair_form`
- `submit_repair_request`
- `view_shop`
- `search_product`
- `view_product`
- `add_to_basket`
- `start_checkout`
- `submit_order_request`
- `click_whatsapp`
- `click_call`
- `track_repair`
- `part_request_submitted`

### Weekly owner dashboard

- Visitors by source.
- Repair requests received.
- Orders submitted and fulfilled.
- Top viewed products.
- Top requested products not in stock.
- Quote approval rate.
- Average time from request to first response.
- Repairs ready but not collected.
- Repeat customers.

The most important KPI is not page views. It is **qualified local enquiries and completed sales per week**.

## Priority 7 — security and platform resilience

The repository is currently public to satisfy Vercel Hobby deployment restrictions. That solved deployment, but public source code increases exposure.

Before adding secrets or private business logic:

- Keep all database credentials, storage keys and OAuth secrets in Vercel environment variables only.
- Search the repository for accidentally committed secrets.
- Do not place Supabase service-role keys in client code.
- Add rate limiting and abuse protection to public repair/order endpoints.
- Validate and sanitize uploaded images server-side, not only in the browser.
- Add upload dimensions, file signature and content-size checks.
- Add audit logs for owner changes to products, stock, quotes and repair status.
- Prefer reconnecting the private repository to the Vercel GitHub account when the owner can access Vercel settings. The long-term secure state is **private repository + correctly connected Vercel GitHub owner**.
- Back up the database and document how to restore the product catalogue and repair records.

## What not to build yet

Do not spend the next phase on:

- A generic AI chatbot with no catalogue grounding.
- Complex online payments before order fulfilment is reliable.
- Loyalty points before repeat customers and purchase history exist.
- Dozens of animations or generated images.
- A large mobile app before the mobile website converts.
- Fake ratings, fake stock counts, fake urgency or invented turnaround times.
- A full marketplace with multiple sellers before one shop’s inventory process is stable.

## Recommended delivery sequence

### Sprint 1 — revenue foundation

- Publish real catalogue listings.
- Seed product photos and compatibility.
- Add part-request capture for unavailable products.
- Add product slugs and shareable product pages.
- Add owner stock and enquiry visibility.

### Sprint 2 — repair reliability

- Add quote records and customer approval.
- Add repair timeline and owner follow-up queue.
- Add WhatsApp message templates.
- Add collection reminders and completion notes.

### Sprint 3 — local acquisition

- Complete service/location SEO pages.
- Connect Google Business Profile and Maps.
- Add reviews workflow.
- Add analytics events and a weekly KPI view.

### Sprint 4 — smart operations

- Add compatibility assistant grounded in catalogue data.
- Add inventory movement history and supplier notes.
- Add demand insights from unavailable-item requests.
- Add customer history and consent-based follow-up.

## Definition of “perfect enough to grow”

The platform is ready for serious growth when:

- A visitor can buy a real product or request one in under two minutes.
- A customer can submit a repair without knowing technical language.
- The owner can see every new repair, order, quote and follow-up in one queue.
- A customer can tell what is happening without calling repeatedly.
- Product photos, prices and stock states match reality.
- Local search pages produce measurable enquiries.
- Smart assistance never invents compatibility, prices or promises.
- The business can operate safely even when the owner is busy in the workshop.
