# Safaricom Daraja M-PESA setup — Digital Phone Hub

## Current state

The repository now contains a **real, guest-first Daraja STK Push integration**, not a simulated payment. Customer account creation is not required to request or pay for an order. Checkout remains **disabled** until the merchant credentials are configured in the Vercel server environment and the payment-attempt migration has been applied to the production Supabase database. Those operations were not possible from this sandbox: no Daraja secrets, Vercel token/project link or Supabase CLI credentials are available.

No live payment was initiated during development or QA. Do not interpret an STK prompt acceptance as a successful payment; only the verified server-side state can mark an order paid.

## Before enabling checkout

1. In Safaricom's Daraja portal, create/authorize the M-PESA Express (STK Push) application for the intended environment. Obtain the shortcode and passkey for the correct PayBill or Buy Goods product. Select the matching transaction type; do not guess between `CustomerPayBillOnline` and `CustomerBuyGoodsOnline`.
2. Apply the **entire** [`supabase/migrations/002_daraja_payment_attempts.sql`](../supabase/migrations/002_daraja_payment_attempts.sql) to the correct Supabase project using the Supabase SQL editor or an authorized migration runner; do not create only the table by hand. In the SQL editor, verify `select public.daraja_payment_ready();` returns `true`. This readiness check verifies the tables, RPCs and database triggers needed for the safe flow. The payment and minimal callback-inbox tables have row-level security and no anonymous/authenticated policies; server access uses the existing Supabase service-role key.
3. In the Vercel project's server-side environment variables, set all of the following. Never put these in client/Vite variables, source files, GitHub commits, customer-visible responses or chat:

   - `MPESA_DARAJA_ENV` — `sandbox` for testing, or `production` only after merchant go-live approval.
   - `MPESA_DARAJA_CONSUMER_KEY`
   - `MPESA_DARAJA_CONSUMER_SECRET`
   - `MPESA_DARAJA_SHORTCODE` — the approved 5–7 digit shortcode for the merchant product.
   - `MPESA_DARAJA_PASSKEY`
   - `MPESA_DARAJA_TRANSACTION_TYPE` — `CustomerPayBillOnline` or `CustomerBuyGoodsOnline`, matching the shortcode.
   - `MPESA_DARAJA_CALLBACK_URL` — exactly `https://digitalelectronics.tech/api/mpesa/callback`.

4. Deploy/restart the serverless API after setting the environment variables. The server intentionally rejects a callback URL on another origin, any callback path other than `/api/mpesa/callback`, an invalid environment, or a mismatched transaction type.
5. Test in **sandbox first** with Safaricom's supported sandbox credentials, simulated phone/payment and the real public HTTPS callback. Verify success, cancellation, timeout/ambiguous result, retry, duplicate callback, wrong amount/phone and service-desk order status. Do not send a production STK prompt as a smoke test.
6. Only after the merchant confirms the production shortcode, settlement configuration and onboarding, set the production credentials/environment and repeat a controlled owner-approved end-to-end test with a low-value transaction. Confirm the settlement independently in the merchant account before treating the launch as complete.

## Implemented safeguards and operating rules

- A customer must enter the high-entropy guest order reference. No account, PIN or card details are requested.
- The customer may request an STK prompt only for an **owner-confirmed** order with a positive, persisted server total and priced catalogue lines. The server retrieves the phone/amount from the saved order; the browser cannot submit or override either value.
- Payment attempts have a unique idempotency key, one initiating/pending/review/paid attempt per order and an atomic maximum of three initiation attempts per order per ten minutes. The database serializes attempt creation against order changes; a pending, paid or review-needed attempt prevents another prompt.
- Checkout refuses to activate unless the migration readiness RPC verifies the tables, critical triggers and payment-recording function. With a missing/incomplete migration or merchant configuration, no M-PESA request is sent. When payment environment variables are set, an order status change also fails closed if the migration is incomplete.
- Treat the entire callback body as untrusted; it is only a reconciliation trigger. Both callback request IDs must match the IDs saved from Safaricom's authenticated STK initiation response. The backend queries Daraja for that exact checkout ID, then an atomic database function locks and rechecks the saved order total, customer phone, priced items and competing attempts before marking `paid`. Only that function may set `paid`; direct table updates cannot do so. The callback-supplied receipt is deliberately not stored because it is unsigned; reconcile receipts and settlement against the merchant's Safaricom records.
- A callback that arrives before the STK response IDs are saved is placed in a bounded, access-controlled inbox and correlated after initiation completes. Duplicate callbacks are throttled; queued data is minimized to request IDs and result code/description, not customer metadata. Inbox cleanup is opportunistic, so it is not a substitute for the merchant's financial records.
- The callback route is bounded to a 64 KB JSON body. The status route is `noindex` and exposes only order stage and payment data, not customer contact details.
- Owner cancellation is blocked while a payment is initiating, pending, under review or already verified. Refunds are **not automated**; resolve any refund through the merchant's approved Safaricom procedure and business records.
- A displayed confirmed total is the amount the service desk stored on the order. The customer should approve the prompt only if it matches the agreed amount.

## Official references

- Safaricom Daraja Developer Portal: <https://developer.safaricom.co.ke/>
- Daraja M-PESA Express (STK Push) API: <https://developer.safaricom.co.ke/apis/MpesaExpressSimulate>
- Daraja STK Push query API: <https://developer.safaricom.co.ke/apis/MpesaExpressQuery>
