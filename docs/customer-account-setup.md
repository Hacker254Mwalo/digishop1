# Optional customer accounts — Digital Phone Hub

## Current status

`/account` now presents the sign-in and create-account form directly. The form accepts a username and Kenyan phone number, but **Send verification code is disabled in Production**. The site does not fake SMS delivery or create a session without verified Supabase Auth.

The additive migration `003_customer_accounts.sql` has been applied to the connected Supabase project containing the shop's customer and order tables. Confirm that this is the same project referenced by Vercel before enabling the feature. Vercel does not currently list `CUSTOMER_ACCOUNTS_ENABLED`; the live configuration endpoint returned `{"enabled":false}`. Phone/SMS provider readiness has not been verified. The feature must stay disabled until a real SMS provider is configured and the flow is tested safely in an isolated Preview project.

Guests can still request parts and track orders without creating an account.

## Owner setup

1. **Confirm the database target.** Verify that the Supabase project receiving migration 003 is the same project referenced by the app's Vercel `SUPABASE_URL`. Apply migration 003 separately to any nonproduction Preview project used for testing. Do not copy production customer data into Preview.
2. **Configure real phone verification.** Enable the Supabase Auth phone provider, choose and configure a supported production SMS provider, sender identity and rate limits, and require phone confirmation. Configure/test this in Preview first. Never use fake, shared or simulated OTPs.
3. **Keep server keys private.** Vercel must have the intended project's `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and server-only `SUPABASE_SECRET_KEY`. The browser receives only the URL and publishable key from a no-store endpoint; never expose the secret key in a `VITE_` variable, browser bundle, public repo or customer response.
4. **Test in isolation.** Use a separate Preview Supabase project and real SMS provider configuration. Set `CUSTOMER_ACCOUNTS_ENABLED=true` only on that Preview deployment after its migration and keys are ready. Confirm a real code arrives, verification succeeds, profile creation works, sign-in works, and account-linked requests appear only for that account. Do not send unsolicited messages to customers.
5. **Enable Production only after approval.** Leave `CUSTOMER_ACCOUNTS_ENABLED` unset or `false` in Production until Preview passes and the owner explicitly approves activation. Recheck the live endpoint returns `{"enabled":true}` only when every server/database gate is ready. Redeploy after changing environment variables.

## What customers can do

- Create an account with a username and Kenyan phone number, then verify phone ownership by SMS code.
- Sign in later with the same username and verified phone number.
- View only item requests created while signed in and submitted with the verified account phone.
- Continue as a guest if they do not want an account.

No password, payment PIN or card details are collected. Customer authentication is separate from owner/admin authentication. The account profile is protected by RLS; only the server, after validating the Supabase Auth token and confirmed phone, accesses it. Existing guest requests are never auto-claimed by phone-number match. If a customer submits a different contact number, that request stays a guest request.

## Troubleshooting

- **The code button is disabled or sign-in is unavailable:** confirm `CUSTOMER_ACCOUNTS_ENABLED=true` only in the intended Preview environment, verify the project URL matches the database where migration 003 was applied, ensure the server has its required Supabase keys, and check that the database exposes `customerAccounts` plus `orderRequests.accountUserId`. The configuration endpoint intentionally returns no browser keys while any gate is closed.
- **Code request fails:** verify the Supabase phone provider, SMS-provider credentials, sender/delivery settings, phone format and provider rate limits. The website does not claim an SMS was sent when the provider rejects it.
- **Profile cannot be saved after phone verification:** confirm migration 003 is applied to the same Supabase project used by the server.
- **A new request is missing from account history:** confirm the customer was signed in, the profile exists, and the submitted phone matches the verified account phone. Guest and older requests are never attached automatically.
- **Never ask a customer to share an SMS code or M-PESA PIN.**
