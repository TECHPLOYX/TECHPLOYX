# TECHPLOYX — Migration contract: Next.js + Vercel

Status: PLANNED / STAGING ONLY
Branch: migration/appdeploy-to-netlify
Current production: AppDeploy (keep unchanged)
Domain: techployx.com (do not change)
Notification queue: 13 held notifications (do not release)

## Target architecture

- GitHub: source control and preview branches.
- Next.js: frontend, admin panel, and server-side API routes.
- Vercel: preview/staging and later production deployment.
- Supabase project: wkfmdtfhvdeyhhxatfll (reuse; no schema reset).
- Supabase Edge Function: techployx-mail-status (reuse; verify_jwt remains enabled).
- Amazon S3: files and backups, project-isolated.
- Zoho SMTP: preserve existing delivery route.
- AppDeploy: rollback/reference only until acceptance is complete.

## Current AppDeploy surface to replace

- Public routes: / and /es/
- Admin route: /admin.html (target: /admin)
- API operations:
  - POST /api/chat
  - POST /api/admin/login
  - POST /api/admin/data
  - PUT /api/admin/lead/:id
  - POST /api/admin/mail-test
  - GET /api/_healthcheck
- Supabase tables used:
  - leads
  - lead_events
  - lead_notifications
  - chat_sessions
  - chat_messages
  - sales_prospects
  - admin_users

## Required secret names

Configure only in Vercel encrypted environment variables. Never commit values:

- SUPABASE_URL
- SUPABASE_PUBLISHABLE_KEY
- SUPABASE_SERVICE_ROLE_KEY
- TECHPLOYX_ACCESS_PIN
- ZOHO_MAIL_APP_PASSWORD
- S3 credentials/bucket values, when the S3 route is implemented
- AI provider secret, only if the approved chat provider requires one

The service-role key and SMTP password must never be exposed to browser code.

## Implementation rules

1. Remove all imports from @appdeploy/client and @appdeploy/sdk.
2. Use Next.js Route Handlers or server actions for privileged operations.
3. Keep service-role and Zoho credentials server-side only.
4. Keep the current Supabase project and table contracts unless a reviewed migration is approved.
5. Do not send or retry existing notifications during staging.
6. Add idempotency protection before any notification release.
7. Preserve the current AppDeploy deployment as rollback.
8. Use Vercel Preview deployments for all acceptance testing.
9. Do not change DNS until staging acceptance is signed off.

## Acceptance gates

- Build succeeds in CI and Vercel Preview.
- Public English and Spanish pages load.
- Admin login succeeds with a staging test account.
- Admin data reads and status updates work against Supabase.
- Chat works without exposing privileged credentials.
- One explicitly controlled test email is accepted by Zoho and recorded correctly.
- Healthcheck reports database, function, and secret-name readiness without sending mail.
- S3 test object can be written and read in the isolated project path.
- Existing AppDeploy URL remains available as rollback.
- The 13 held notifications remain unchanged and unreleased.

## Cutover sequence

1. Developer opens a Vercel Preview from this branch.
2. Run all acceptance gates above.
3. Record deployed commit, environment names, logs, and rollback URL.
4. Obtain explicit approval for DNS change.
5. Point staging/custom domain only after approval.
6. Monitor the new deployment while AppDeploy remains available.
7. Reconcile the 13 notifications individually only after independent approval and deduplication checks.
