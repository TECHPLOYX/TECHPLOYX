# TECHPLOYX — Phase 6 encrypted offsite S3 backup: authorization and recovery runbook

Status: **PREPARED / NOT DEPLOYED / NOT VERIFIED** (2026-11-09). This is a gated pilot, not an active scheduled backup.

## Verified baseline

- Corporate repo: `TECHPLOYX/TECHPLOYX`.
- Existing encryption + isolated application-schema restore workflow: `.github/workflows/techployx-postgres-backup.yml`.
- Daily scheduled Nov 8 run `42486582544`: SUCCESS for `backup` and `restore_isolated`.
- Latest verified artifact: `techployx-encrypted-pg-42486582544`; expires 2026-11-15. Its GitHub artifact digest is **not** a substitute for checksuming its enclosed `postgres.dump.enc`.
- GitHub Actions repository secret names: `TECHPLOYX_POSTGRES_URL`, `TECHPLOYX_BACKUP_PASSPHRASE`. No AWS backup role/region/bucket variables or AWS-specific secrets were found; no connected AWS administration tool was verified.
- Existing restoration validates ONLY `public`, `techployx_ops`, `techployx_finance` on disposable PostgreSQL 17, with placeholder Supabase Auth function signatures. Full Supabase Auth, Storage objects, managed roles/extensions, and operational RPO/RTO remain **NOT VERIFIED**.
- Keep `TECHPLOYX` state `AT_RISK` until complete independent recovery is demonstrated.

## Prepared mechanism

`.github/workflows/techployx-offsite-s3-copy.yml` is a **workflow_dispatch-only**, explicit-input transfer procedure. It:

1. Validates `source_run_id` references a successful real TECHPLOYX encrypted PostgreSQL backup workflow executed on main.
2. Downloads only the previously encrypted GitHub Actions artifact using GitHub's scoped token; never exports a plaintext database to S3 or logs.
3. Verifies enclosed SHA256SUMS before network upload.
4. Uses GitHub OpenID Connect (OIDC) and a project-specific IAM role, not a long-lived AWS key.
5. Requires a **dedicated private TECHPLOYX bucket**, all four S3 Block Public Access flags enabled.
6. Uploads `postgres.dump.enc` and `SHA256SUMS` into `techployx/postgres/<run-id>/`, adds SSE-S3 on top of existing client-side encryption, downloads both, verifies SHA-256 equality and bytes.
7. Does not change any production database, AWS roles, buckets, DNS, or application behavior on its own. It is **not scheduled** until credentials, cost and recovery are validated.

## One-time identity and destination configuration — needs an authorized AWS owner

Use an existing AWS account controlled for TECHPLOYX, without sharing any personal login or access key in CHAT.

- Create or reuse a **private, dedicated TECHPLOYX-only** S3 bucket in an approved region. Enable Block Public Access, default server-side encryption, versioning and a lifecycle/retention policy approved for the project's RPO, RTO, legal and cost requirements. Avoid sharing the MAXMAQ object path or read/write identity.
- Create an IAM role for GitHub Actions OIDC trusting token issuer `token.actions.githubusercontent.com` with audience `sts.amazonaws.com` and subject **exactly** `repo:TECHPLOYX/TECHPLOYX:ref:refs/heads/main`.
- Restrict the role to `s3:ListBucket`, `s3:GetBucketPublicAccessBlock` for that bucket and `s3:PutObject`, `s3:GetObject` for `arn:aws:s3:::<dedicated-bucket>/techployx/postgres/*`. Do not grant delete or broad IAM/account access.
- Configure the following **GitHub Actions repository variables** (not secret values):
  - `TECHPLOYX_AWS_BACKUP_ROLE_ARN`: only the dedicated role ARN.
  - `TECHPLOYX_AWS_BACKUP_REGION`: authorized bucket region.
  - `TECHPLOYX_S3_BACKUP_BUCKET`: dedicated bucket name.
- Do not overwrite or reveal the existing PostgreSQL secret or backup passphrase. Do not enable recurrence or change retention without authorization.

## First real acceptance test

Once role/bucket/variables exist, the authenticated owner can run the prepared workflow manually on main with a recent successful `source_run_id`. Pass `42486582544` only if its encrypted artifact has not expired; prefer latest successful scheduled source. Verify:

1. Job completes SUCCESS; real source run verified.
2. S3 objects and public-block state verified.
3. Remote download and SHA256SUMS verification PASS.
4. Recovery operator retrieves **the independent S3 copy** and restores into an isolated target; validate schema, data counts, RLS, auth, storage, managed extensions, reference integrations and RPO/RTO separately.
5. Controller reads the run and recovery evidence and only then updates `public.project_gate_status` for TECHPLOYX.

If identity or bucket is unavailable: **BLOCKED: AWS_TECHPLOYX_OFFSITE_IDENTITY_UNAVAILABLE**. Do not claim offsite backups exist; retain Github daily encrypted backup while progressing via an authorized route.

### Credential access boundaries

No secrets in chats, repo, docs or logs. IAM trust must not allow arbitrary forks, pull requests or other repos. Role policy must not grant access to other client projects. S3 fees can accrue; never create paid resources or widen privileges without owner authorization.

## AWS route recovery / one-time infrastructure as code

The earlier TECHPLOYX AWS Secure Access browser profile **was authenticated** on 2026-10-19 / 2026-10-21 (AWS account historically `949847741014`, `us-east-2`). On 2026-11-09 it was independently re-tested and redirected to AWS IAM sign-in, so its browser session is **expired or unusable**; this does NOT mean the underlying AWS account or already approved credentials are missing.

GitHub Actions S3 through an AWS OIDC technical role is the correct long-term route, not a persistent personal browser session. MedicalVan's `medicalvan-github-actions` role and MAXMAQ's `maxmaq-github-dr` role are separate examples; **neither may be reused as TECHPLOYX's role**.

New one-time reproducible infrastructure in `infra/aws/techployx-offsite-dr-oidc.yml` provides:

- Dedicated private encrypted and versioned `techployx-dr-<account-id>-<region>` bucket with public access disabled and HTTPS enforced.
- Scoped GitHub Actions OIDC role trusting **only** main in `TECHPLOYX/TECHPLOYX`.
- Object access restricted to `techployx/postgres/*`, without delete rights.
- A default 90-day lifecycle; validate retention policy and fees before deployment.
- Three CloudFormation output values corresponding to the GitHub Actions repository variable names listed above.

**Preconditions:** This template references a **pre-existing** GitHub OIDC provider in the chosen AWS account. Prior account projects had one; current AWS account state still needs inspection. Deploy this stack **only with an authenticated AWS administrator in that same account**, after reviewing cost and active policies. Deployment has not occurred; no AWS resources exist merely because the file is in GitHub. This is a one-time authorized installation, not a request to repeatedly enter personal credentials.

Do not merge draft PR #13 or claim offsite recovery verified until AWS identity, account context, bucket/role and runtime tests are actually confirmed.
