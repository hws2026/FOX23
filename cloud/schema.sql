-- Run once in your Supabase project's SQL editor.
-- One private shared show per authenticated account; use that account on each device.
create table if not exists public.wld_shows (
  owner uuid primary key references auth.users(id) on delete cascade,
  version bigint not null default 1,
  snapshot jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.wld_initial_backups (
  owner uuid primary key references auth.users(id) on delete cascade,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.wld_shows enable row level security;
alter table public.wld_initial_backups enable row level security;
drop policy if exists own_show_read on public.wld_shows;
create policy own_show_read on public.wld_shows for select to authenticated using (owner = (select auth.uid()));
drop policy if exists own_backup_read on public.wld_initial_backups;
create policy own_backup_read on public.wld_initial_backups for select to authenticated using (owner = (select auth.uid()));
revoke all on public.wld_shows, public.wld_initial_backups from anon, authenticated;
grant select on public.wld_shows, public.wld_initial_backups to authenticated;

create or replace function public.wld_check_snapshot(s jsonb) returns void
language plpgsql set search_path = '' as $$
begin
  if s is null or jsonb_typeof(s->'state') is distinct from 'object'
     or jsonb_typeof(s->'library') is distinct from 'object'
     or jsonb_typeof(s->'state'->'teams') is distinct from 'object'
     or jsonb_typeof(s->'state'->'game') is distinct from 'object'
     or jsonb_typeof(s->'state'->'program') is distinct from 'object'
     or octet_length(s::text) > 30000000 then
    raise exception 'Invalid show snapshot or show exceeds 30 MB';
  end if;
end $$;

create or replace function public.wld_create_show(s jsonb) returns bigint
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  perform public.wld_check_snapshot(s);
  -- A second device can never replace an existing master during setup.
  insert into public.wld_shows(owner,snapshot) values(auth.uid(),s);
  insert into public.wld_initial_backups(owner,snapshot) values(auth.uid(),s);
  return 1;
end $$;

create or replace function public.wld_save_show(expected_version bigint, s jsonb) returns bigint
language plpgsql security definer set search_path = '' as $$
declare next_version bigint;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  perform public.wld_check_snapshot(s);
  update public.wld_shows set snapshot=s,version=version+1,updated_at=now()
    where owner=auth.uid() and version=expected_version returning version into next_version;
  return next_version; -- null means another device changed the show; do not overwrite it.
end $$;
revoke all on function public.wld_check_snapshot(jsonb) from public, anon, authenticated;
revoke all on function public.wld_create_show(jsonb) from public, anon;
revoke all on function public.wld_save_show(bigint,jsonb) from public, anon;
grant execute on function public.wld_create_show(jsonb), public.wld_save_show(bigint,jsonb) to authenticated;
