-- TECHPLOYX Continuidad v1
-- Preparation only: apply through the existing Supabase migration route after schema review.
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  status text not null default 'active' check (status in ('active','paused','blocked','completed')),
  priority integer not null default 5 check (priority between 1 and 5),
  current_focus text,
  next_action text,
  blocked_reason text,
  last_reviewed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.continuity_logs (
  id uuid primary key default gen_random_uuid(),
  project_code text not null references public.projects(code) on update cascade,
  type text not null check (type in ('review','block','progress','decision_needed')),
  message text not null,
  needs_human boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists projects_priority_idx on public.projects(priority, status);
create index if not exists continuity_logs_project_created_idx on public.continuity_logs(project_code, created_at desc);

insert into public.projects (code, name, status, priority, current_focus, next_action)
values
  ('TECHPLOYX', 'TECHPLOYX', 'active', 1, 'Base operativa y continuidad', 'Validar la primera versión del módulo Continuidad'),
  ('MAXMAQ', 'MAXMAQ', 'active', 2, 'Cierre operativo y recuperación', 'Revisar el siguiente bloque verificable'),
  ('GARAGEFLOW', 'GARAGEFLOW', 'active', 3, 'Control y arquitectura', 'Definir el siguiente bloque verificable'),
  ('INSURANCE', 'INSURANCE', 'active', 4, 'Control del sistema de ventas', 'Definir el siguiente bloque verificable')
on conflict (code) do nothing;
