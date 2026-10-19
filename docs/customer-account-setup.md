# Customer accounts and catalogue readiness — Digital Phone Hub

## Current status

The account flow is designed for optional username-and-password access. Signup does not send an SMS. Supabase Auth stores and verifies the password; the application stores the username and normalized Kenyan phone number in `customerAccounts`. Phone ownership is **not verified**, and the phone number must not be described or used as verified identity data.

The implementation uses an internal, non-deliverable Supabase Auth email identifier derived from the username. It is not a customer email address and must never be shown as one. The server creates this Auth identity with the password through the service-role API, then creates the account profile. The service-role key remains server-only. Password reset by phone or email is not available; customers who forget the password will need a future recovery process that does not assume phone ownership.

Migration `003_customer_accounts.sql` is present in the selected Supabase project. The product-catalog migration was applied there as `product_catalog_gallery_contract` on 20 October 2026. Signup protection was applied as `customer_signup_throttle`; it stores only keyed hashes and limits account attempts to 10 per client address and 3 per normalized phone number per hour. The catalog migration adds the condition and five-image gallery fields, widens category support, backfills existing primary photos, and creates the serialized image-append function. The selected project currently has no product rows, so category behavior is covered by code tests rather than a production test listing.

The live account configuration endpoint currently returns `{"enabled":false}`. Keep customer accounts disabled until the owner confirms that Vercel's `SUPABASE_URL` points to the selected project and completes the provider checks below. Guest ordering and repair requests remain available.

## Enablement checklist

1. **Confirm the database target.** In Vercel, confirm the server's `SUPABASE_URL` matches the project where migrations 003, 004, and 005 are recorded. Do not copy production customer data to a Preview project. Apply the tracked migrations to a separate Preview database before testing there.
2. **Enable Supabase password auth.** Enable the Supabase Email/password provider so the client can sign in with a password. No SMS provider is required for this flow. The application uses a reserved `.invalid` internal identifier, not an email address; do not configure customer email delivery or password reset around it.
3. **Keep server keys private.** Set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and server-only `SUPABASE_SECRET_KEY` on the intended Vercel deployment. Never expose the secret key through a `VITE_` variable, browser bundle, public repository, or customer response.
4. **Test in isolation.** In a separate Preview Supabase project, apply the migrations, configure password auth, and set `CUSTOMER_ACCOUNTS_ENABLED=true` only on that Preview deployment. Test account creation, sign-in, private order history, sign-out, duplicate usernames/phone numbers, rate limits, and guest ordering. Use test customer data only.
5. **Enable Production deliberately.** Leave `CUSTOMER_ACCOUNTS_ENABLED` unset or `false` in Production until Preview passes and the owner approves activation. After enabling it, redeploy and check that `/api/customer-auth/config` reports `{"enabled":true}`. If any required key or schema check fails, the account feature should remain closed while guest flows continue.

## Customer behavior and privacy

- Customers may create an account with a username, Kenyan mobile number, and a password of at least 12 characters. No SMS code is sent.
- The phone number is stored as an account contact number but is not verified. Signing up does not prove control of that number.
- Customers sign in with their username and password. The password is handled by Supabase Auth and is not stored in the shop's `customerAccounts` table.
- Only requests created while signed in and submitted with the same account phone number appear in that account's history. Existing guest requests are never automatically claimed by phone-number match.
- Guest checkout and repair requests remain available without an account.
- Signup throttles store keyed hashes, not raw phone numbers or addresses. The database function and table are inaccessible to anonymous and authenticated browser roles; only the server service role can use them.
- Customer account data stays behind Supabase token validation and the account-profile lookup. Private account responses are marked `no-store`. Customer and owner authentication remain separate.
- No payment PIN, card details, SMS code, or real email address is requested or stored by the customer account form.

## Troubleshooting

- **Account setup is unavailable:** confirm `CUSTOMER_ACCOUNTS_ENABLED=true` only in the intended Preview/approved Production deployment, verify Supabase URL and server keys, and check the readiness endpoint. The endpoint intentionally returns no browser auth keys while a gate is closed.
- **Signup is rejected:** check that Supabase password auth is enabled, the phone number is valid, the password has at least 12 characters, and the username and phone number are not already registered.
- **Signup is temporarily rate-limited:** wait for the one-hour window to expire; the current thresholds are 10 attempts per client address and 3 per phone number.
- **Signup succeeds but sign-in fails:** confirm the Supabase Email/password provider accepts password sign-in and that the account row was saved. Do not ask customers to use the hidden internal identifier as an email address.
- **A request is missing from account history:** confirm the customer was signed in when placing it and used the same phone number stored on the account. Guest and older requests are not attached automatically.
- **Customer forgot a password:** do not send a reset link to the internal `.invalid` identifier and do not treat the stored phone as verified. Keep guest service available until a safe recovery process is implemented.
- **Never ask a customer to share an M-PESA PIN, password, or one-time code.**
