# TECHPLOYX migration control — AppDeploy to GitHub / Netlify / Supabase

Status: NETLIFY-READY CODE / SITE CREATION BLOCKED. Project: TECHPLOYX (INTERNAL). Production remains on AppDeploy until independent release passes validation.

## Verified starting evidence (2026-10-30)
- GitHub repository maxmaq-admin/TECHPLOYX exists; main README describes the dashboard.
- main/package.json and main/netlify.toml returned 404. The repository is not yet verified as deployable source.
- No TECHPLOYX Netlify site appeared in the searched site listing.
- AppDeploy app techployx-e8bfd0 reported deployment ready; app's custom domains techployx.com and www.techployx.com reported active.
- These platform states do NOT prove that admin, SMTP Zoho, or customer workflows are working.
- 13 pending notifications must remain held. Do not replay before verified SMTP success and deduplication.

## Required migration sequence
1. Obtain exact current AppDeploy source snapshot in authorized manner; compare it to the GitHub main branch and preserve all routes, assets, functions and build configuration.
2. Inventory Supabase project, schemas, RLS, auth redirects, webhooks, cron, storage and secret-name references. Preserve project isolation.
3. Map AppDeploy backend functions, outgoing e-mail and integrations to Netlify Functions or Supabase Edge Functions. Choose a single owner for every workflow.
4. Configure Netlify site and GitHub deploy integration; provision secret values through approved secrets storage, never the repository or chat.
5. Release staging URL, prove home/admin/auth/prospects/leads/follow-up routes, backend health, event idempotency, and controlled single test mail reception.
6. Back up database and configuration, document rollback, then switch DNS/domain only after staging acceptance.
7. Reconcile the 13 held notifications individually, with explicit safeguards against duplicate sends; release only after independent approval/validation.

## Other projects
Architecture is reusable, but each project needs its own repo, Supabase boundary, secrets, deployment and acceptance criteria. Do not migrate MAXMAQ, INSURANCE SALES SYSTEM 1, GarageFlow or MedicalVan in this TECHPLOYX change.

## Current blocker
The AppDeploy source has been recovered and the migration branch builds successfully in GitHub Actions. The remaining deployment blocker is Netlify site creation: the connected Netlify account/team can be read, but `create project` returns HTTP 403. No DNS, secrets, customer data, or production delivery changes are authorized until an isolated TECHPLOYX Netlify site exists.


## Progress update — 2026-10-30
- AppDeploy source snapshot has been recovered into this branch.
- Browser API calls have been decoupled from @appdeploy/client via src/platform-api.ts.
- Netlify Functions migration code is present under netlify/functions/ and Netlify build configuration is present in netlify.toml.
- AppDeploy production remains untouched; DNS/domain has not been switched.
- Supabase remains the data/automation source of truth; Amazon S3 remains the document-storage target architecture.
- Zoho mail continues through the protected Supabase mail function; the 13 held notifications remain blocked.
- Netlify account and team are reachable, but creating a new TECHPLOYX project through the current connector returned HTTP 403. Existing MAXMAQ and MedicalVan Netlify sites are not to be reused or repurposed.
- Next gate: obtain one-time Netlify write authorization sufficient to create an isolated TECHPLOYX site, then configure env vars, staging deploy and smoke tests before any DNS change.


## Validation update — 2026-11-01
- GitHub Actions migration build completed successfully after cleanup of conflicting artifacts.
- Obsolete AppDeploy backend code and conflicting Vercel migration files were removed from the migration branch.
- No active source file in the migration branch references @appdeploy/client, @appdeploy/sdk, or APPDEPLOY_*; only this historical migration document contains the AppDeploy name for audit context.
- Required Netlify runtime secret names currently referenced by code: TECHPLOYX_ACCESS_PIN, SUPABASE_SERVICE_ROLE_KEY, TECHPLOYX_AI_MODEL, ZOHO_MAIL_APP_PASSWORD, ZOHO_MAIL_USER.
- Amazon S3 is part of the target architecture but is not yet wired into this migration branch; S3 credentials must not be created or copied until the storage route is implemented and validated.
