# TECHPLOYX — shared continuity write-back contract (pilot 2026-11-09)

Status: **PILOT — do not mark end-to-end cross-chat delivery verified yet**.

## Existing source of truth

Supabase TECHPLOYX project `wkfmdtfhvdeyhhxatfll`:
- `public.projects` — one registry entry per `code`
- `public.continuity_logs` — append-only outcome/evidence stream; `project_code` foreign key to `projects.code`
- `public.project_gate_status` — independent acceptance gates, `(project_code,gate_key)` unique

Project code for FruitysTech pilot is **FRUTITECH** (not FRUITYSTECH).

## Reusable executor protocol

1. Read `projects`, last `continuity_logs` and `project_gate_status` *for the exact project code* before acting.
2. Perform a scoped authorized operation through the executor (Work, GitHub Actions, AppDeploy, etc.). Never send customer credentials into TECHPLOYX central logs.
3. Write a new `continuity_logs` event with: project_code, actor/executor, task, factual outcome, timestamp (database-generated), immutable evidence URL or run ID, remaining blocker and next action. Fields not in the existing table may be encoded in an explicitly labeled message; avoid secrets and PII.
4. Use `progress` only for verified progress; use `review` when result is unverified, and `block` for an actual blocker. Keep project gates `pending` until independently proven.
5. Read the event back using a *different* authorized access route, checking correct project isolation and evidence URL. A new control chat must query these same tables at resumption.
6. Do not assert automatic Work writeback unless the Work executor actually invokes this contract after its task, with verifiable event ID.

## Current pilot

`.github/workflows/techployx-continuity-writeback-pilot.yml` runs within TECHPLOYX corporate repository, reuses `TECHPLOYX_POSTGRES_URL` GitHub Actions secret, and emits an idempotent `review` event tied to the real GitHub Actions run ID for the FruitysTech domain/email/DNS task. It **does not configure or verify** Namecheap, Zoho Mail or DNS. It is a control-plane integration test, not evidence that vendor work finished.

### Readback from any CHAT control center with connected TECHPLOYX Supabase

```sql
SELECT id, project_code, type, message, needs_human, created_at
FROM public.continuity_logs
WHERE project_code = 'FRUTITECH'
ORDER BY created_at DESC LIMIT 10;
```

Read `public.projects` and `public.project_gate_status` scoped to `FRUTITECH` as well. Do not cross-read data from another project, except in a corporate aggregate explicitly authorized by TECHPLOYX.

## Remaining gates

- Independently verify GitHub Actions writer → Supabase row → CHAT readback.
- Verify Work writes its own event after a real authorized execution; GitHub canary alone does not prove Work automatic integration.
- Independently open a different conversation and retrieve by project code without manual copy/paste. This cannot be claimed from a read in the originating conversation.
- Reconcile allowed identities, least-privilege logging, rotation, RLS and restricted API exposure. Existing CI uses a full PostgreSQL DSN and should eventually use a dedicated append-only technical role or authenticated restricted endpoint.
- Verify actual Namecheap + Zoho Mail DNS records in a separate operational acceptance gate before marking vendor configuration done.

Do not modify business features or DNS as part of this integration pilot.
