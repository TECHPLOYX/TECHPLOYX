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

## Reusable event-ingestion route (2026-11-09)

A reusable **event-driven** GitHub Actions endpoint now lives at
`.github/workflows/techployx-continuity-event-ingest.yml`, using the
already-authorized `TECHPLOYX_POSTGRES_URL` GitHub Actions secret. Do not copy
any secrets into Work, this file, logs, or a different project. This endpoint
supports authorized `workflow_dispatch` and `repository_dispatch`
(event type `techployx_continuity_writeback`). The sender must have
legitimate repository permissions.

Required non-sensitive input fields:
`project_code`, `event_key`, `origin_executor`, `result`
(`VERIFIED`, `NOT_TESTED`, `BLOCKED`), `task`, and `evidence`.
`project_code` must exist in `public.projects`. Include *no*
credentials or customer data in `task` or `evidence`.

**After every authorized task (proposed Work lifecycle contract):**
1. Resolve the exact project code and read current project state.
2. Perform the task, preserving its own evidence and security scope.
3. Trigger this workflow once with a stable event key. Retry with the
   **same** event key if transport fails; the event is deduplicated.
4. Wait for an actual completed-success GitHub run, then read the
   returned `continuity_logs.id` through the Supabase TECHPLOYX connection.
5. If the write/read check fails, mark the task's continuity status
   `BLOCKED` in the executor's own secure job log; do not claim completed
   cross-chat delivery. The next authenticated controller should reconcile.
6. On resumption, every TECHPLOYX control CHAT reads `projects`,
   `continuity_logs`, and `project_gate_status` filtered to the target code.

The Action is **triggered** by an authorized caller; its existence cannot
automatically intercept every Work conversation/task. Until a real Work
task *without explicit writeback instructions* automatically triggers it,
the gate `work_executor_automatic_writeback` remains **pending**. This
is a deliberately honest distinction between *reusable ingestion* and
*automatic Work lifecycle integration*.

### Safeguards and tests

- GitHub queue serializes event writes via `concurrency`; stable
  `event_key` is used to deduplicate at the event level.
- The database project foreign key enforces existence and there are
  no cross-project writes in the workflow.
- The registry type is `progress`, `review`, or `block` according
  to the observed result. No vendor DNS/email success is inferred.
- This action uses the existing broad PostgreSQL credential: its
  privilege should be reduced through a dedicated identity before
  multi-client rollout. The requested `origin_executor` is a *caller
  assertion*; trusted provenance is GitHub's authenticated `actor`
  and the run URL.
- Recovery verification requires (a) a successful run, (b) an independent
  Supabase read, (c) a retry with the same key that yields only one row,
  (d) a second event with a different key, and (e) proof that a Work task
  itself initiates this event without manual prompt.
- This is an on-demand workflow, not a daemon. No recurring compute,
  billing, or unattended vendor modifications are enabled.

**FruitysTech boundary:** use `FRUTITECH`; leave Namecheap, Zoho Mail, DNS,
commercial operations, and all other projects untouched in continuity tests.
