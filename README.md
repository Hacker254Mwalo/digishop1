# Digital Electronics — Siaya

A fast Next.js customer experience for Digital Electronics: phone repair, laptop solutions, spares and accessories in Siaya, Kenya.

## Included

- Corporate blue-and-white service brand with real Digital Electronics imagery.
- Homepage hero featuring the exterior Digital Electronics sign.
- Repair booking at `/book` with a unique `DE-REP-####` ticket, local ticket persistence and formatted WhatsApp handoff.
- Repair tracker at `/track` with four stages: Received, Under Diagnostics, Repair in Progress and Ready for Pickup.
- Spares catalog at `/shop` with category filters, cart drawer and no-payment WhatsApp order fulfillment.
- Contact page at `/contact` with identified photo gallery, operating hours, call/WhatsApp actions and Google Maps embed.

## Run locally

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

## Before launch

Replace the placeholder values in `.env.local` with the shop’s verified phone number, WhatsApp number and exact address. The UI intentionally avoids inventing contact information. The site then enables direct call and technician WhatsApp handoffs automatically.

## Photo identification

- `public/images/digital-electronics-exterior-sign.jpg`: the exterior DIGITAL ELECTRONICS illuminated sign.
- `public/images/technician-counter.jpg`: the repair technician seated at the counter with the accessory wall behind him.
- `public/images/customer-service-counter.jpg`: the customer service counter with laptop and display cabinets.

## Notes

The demo tracker includes `DE-REP-1049` and `DE-REP-1050` so the interaction can be previewed immediately. New bookings are stored in the browser’s local storage. For a multi-device production deployment, connect these forms to the shop’s preferred backend or CRM and preserve the same ticket/status interface.
