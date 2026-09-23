do $$ begin
  create type public.app_role as enum ('superadmin','admin','user');
exception when duplicate_object then null; end $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

drop policy if exists "read own roles" on public.user_roles;
create policy "read own roles" on public.user_roles
  for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_superadmin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'superadmin')
$$;

revoke all on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
revoke all on function public.is_superadmin() from public, anon;
grant execute on function public.is_superadmin() to authenticated;

alter table public.teams add column if not exists archived boolean not null default false;
alter table public.teams add column if not exists archived_at timestamptz;
alter table public.teams add column if not exists former_owner_email text;
alter table public.teams alter column owner_id drop not null;
alter table public.teams drop constraint if exists teams_owner_id_fkey;
alter table public.teams add constraint teams_owner_id_fkey
  foreign key (owner_id) references auth.users(id) on delete set null;

create or replace function public.can_edit_team(_team_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.has_role(auth.uid(), 'superadmin')
    or exists (select 1 from public.teams t where t.id = _team_id and t.owner_id = auth.uid())
    or exists (select 1 from public.team_access a where a.team_id = _team_id and a.user_id = auth.uid());
$$;

drop policy if exists "superadmin select teams" on public.teams;
create policy "superadmin select teams" on public.teams
  for select to authenticated using (public.is_superadmin());