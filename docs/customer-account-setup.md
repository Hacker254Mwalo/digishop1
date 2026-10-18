# Optional customer accounts — Digital Phone Hub

## Status

The website now includes an optional customer account route at `/account`. A customer chooses a username and Kenyan mobile number, verifies ownership with a real one-time SMS code through Supabase Auth, and can sign in with the same username and phone. Account sign-in is not required to request parts or pay for an owner-confirmed order as a guest.

The code fails closed when the owner-controlled account switch is off, the Supabase keys are missing, or the server cannot see the required customer-profile and order-link columns from migration 003. No OTP is simulated or claimed as delivered by the website. The account feature is **not ready for production use** until the owner completes the setup below and tests it in an isolated Preview project.

## Owner setup prerequisites

1. **Apply the schema migration.** Apply the migrations in order to the intended Supabase project, including [`003_customer_accounts.sql`](../supabase/migrations/003_customer_accounts.sql). The migration creates the private `customerAccounts` table, unique username/phone constraints, RLS with no direct public/authenticated table policies, and a nullable account link on item requests. Use a separate nonproduction Supabase project for Preview testing. Do not manually create only part of the migration.
2. **Enable verified phone sign-in.** In the Supabase project, enable the Auth phone provider and configure a supported production SMS provider, sender identity and rate limits. Require phone confirmation. Configure and test the provider in the isolated Preview project first. Production sign-in must use real provider delivery; do not substitute fake or shared OTPs.
3. **Set server-side Vercel environment variables.** The server requires the project's existing `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`. The publishable key is returned by a no-store endpoint for browser OTP only. The secret key must remain server-side and must never be added to a `VITE_` variable, browser bundle, public repository, issue, or customer response. Keep `CUSTOMER_ACCOUNTS_ENABLED` unset or `false` until the migration and real SMS provider are ready; this server-side kill switch gates both the browser configuration and customer API identity.
4. **Deploy after configuration.** On the isolated Preview project, set `CUSTOMER_ACCOUNTS_ENABLED=true` only after applying migration 003 and configuring the real SMS provider. The Vercel API then exposes `/api/customer-auth/config` with only the Supabase URL and publishable key. Redeploy after adding environment variables, then confirm the account page can request and verify a real SMS code on Preview. Do not test by sending unsolicited production messages. Leave the Production flag disabled until the Preview flow has passed and the owner intentionally approves activation.
5. **Confirm guest fallback and ownership rules.** With account configuration unavailable, `/spares` must still accept a guest request. A new order is linked only when the server verifies the Supabase JWT, the Auth phone is confirmed, an account profile exists, and the submitted order phone matches that verified phone. If any of these checks do not hold, the order remains a guest request and the confirmation says so.

## Customer privacy and behavior

- No password, payment PIN or card details are collected. The username identifies the account; possession of the verified phone is the account authentication factor.
- Customer Supabase sessions are kept in browser `sessionStorage` for the current tab. This is distinct from the shop owner's login and role system.
- Account profile and order-history queries require a server-verified, phone-confirmed Supabase access token. Customer history is limited to account-linked item requests; repair records and customer contact-directory data are not exposed in this account page.
- Existing guest orders are **never auto-claimed** by matching a phone number. A guest reference remains the way to track them.
- New item requests are linked only when their submitted phone matches the verified account phone. If a customer enters a different contact number, the request is accepted as a guest request instead of being silently attached to the account.
- The migration enables RLS and grants table access only to the server's `service_role`; customer code never receives that service-role key. The server derives account ownership from the validated Auth user ID rather than an ID submitted in the request.
- The account route is `noindex,nofollow`, has no canonical URL, and sends `no-referrer` and private `no-store` headers.

## Troubleshooting

- **No “Send verification code” button:** check that `CUSTOMER_ACCOUNTS_ENABLED=true`, all required Supabase server keys are set, and the server can see `customerAccounts` plus `orderRequests.accountUserId` in the intended project. The endpoint intentionally returns no browser credentials until these checks pass.
- **Code request fails:** verify the Supabase phone provider, SMS provider credentials, delivery configuration, phone format and provider rate limits. The website intentionally shows a generic error and does not claim SMS delivery.
- **Phone verifies but profile cannot be saved:** check that `003_customer_accounts.sql` was successfully applied to the same Supabase project used by the server. The page keeps guest ordering available.
- **New request does not appear in account history:** check that the customer was signed in, the profile migration is present, and the order's submitted phone exactly normalizes to the verified account phone. Guest and older orders are not attached automatically.
- **Do not ask customers to share the verification code or M-PESA PIN.** Shop staff should not request either over WhatsApp or phone.
