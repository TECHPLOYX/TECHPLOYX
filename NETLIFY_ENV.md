# TECHPLOYX Netlify environment manifest

Values must be stored only in Netlify encrypted environment variables or another approved secret store. Never commit values.

## Required for current staging runtime
- TECHPLOYX_ACCESS_PIN
- SUPABASE_SERVICE_ROLE_KEY
- TECHPLOYX_AI_MODEL
- ZOHO_MAIL_APP_PASSWORD
- ZOHO_MAIL_USER

## Public/non-secret configuration
- Supabase project URL is currently fixed in server code and is not a secret.
- Supabase publishable key is used by the public browser flow and is not a service-role secret.

## Not yet provisioned in Netlify
Amazon S3 is part of the target architecture, but no S3 runtime path is active in this branch yet. Do not add AWS keys speculatively.

## Deployment gate
Do not switch techployx.com until:
1. Netlify staging site exists.
2. Build is green.
3. /, /es/, /admin.html and /api/_healthcheck pass.
4. Admin login and protected Supabase reads work.
5. Chat works.
6. One controlled Zoho test succeeds.
7. The 13 held notifications remain blocked until explicit reconciliation.
