# TECHPLOYX mail transport — P1 validation gate

Scope: TECHPLOYX only. No cross-project secrets or data.

## Verified
- Supabase project `wkfmdtfhvdeyhhxatfll`.
- `ZOHO_MAIL_APP_PASSWORD` exists in Supabase Edge Function Secrets.
- `techployx-mail-status` GET responded HTTP 200 and reported `can_test:true`.
- POST through dashboard returned HTTP 403 because the application requires the service-role identity for POST.
- `techployx_ops.notification_outbox` has 13 blocked messages; do not replay until transport and idempotency are validated.

## Gate A — identity
Use a server-side authorized executor only (Supabase service-role environment credential). Never paste keys into chat, code, workflow files or browser automation output. Dashboard user's JWT is not a substitute for service-role authorization.

## Gate B — SMTP
One controlled test addressed to `hello@techployx.com`, from configured `notifications@techployx.com`; record acceptance ID without revealing secrets. Verify actual receipt in Zoho. Use Zoho's documented SMTP hostname for the account region/plan, not a guessed endpoint. No bulk dispatch on this gate.

## Gate C — queue
After Gate B, inspect 13 blocked entries for recency, destination, and duplicate alert keys. Claim transactionally; assign idempotency keys; update `sent` only upon provider acceptance and distinguish delivery confirmation. Make retry exponential and bounded, preserve errors, and prevent double sends.

## Gate D — completion
Evidence: authorized POST success, acceptance ID, receiving inbox confirmation, successful isolated retry test, safe replay report, 0 unexplained blocked entries.

Do not weaken Edge Function authorization or expose `ZOHO_MAIL_APP_PASSWORD` or `SUPABASE_SERVICE_ROLE_KEY`.
