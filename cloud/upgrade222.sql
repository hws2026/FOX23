-- Preserve the existing show and backup; enable small, version-checked updates.
-- Avoid serializing every embedded image just to validate each update.
create or replace function public.wld_check_snapshot(s jsonb) returns void
language plpgsql set search_path = '' as $$
begin
 if s is null or jsonb_typeof(s->'state') is distinct from 'object'
 or jsonb_typeof(s->'library') is distinct from 'object'
 or jsonb_typeof(s->'state'->'teams') is distinct from 'object'
 or jsonb_typeof(s->'state'->'game') is distinct from 'object'
 or jsonb_typeof(s->'state'->'program') is distinct from 'object'
 or pg_column_size(s)>30000000 then raise exception 'Invalid show snapshot or show exceeds 30 MB'; end if;
end $$;
alter table public.wld_shows add column if not exists last_patch jsonb;
create or replace function public.wld_patch_show(expected_version bigint, edits jsonb) returns bigint
language plpgsql security definer set search_path = '' as $$
declare current_row public.wld_shows%rowtype; next_snapshot jsonb; edit jsonb; keys text[];
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if jsonb_typeof(edits) is distinct from 'array' or octet_length(edits::text)>30000000 then raise exception 'Invalid edits'; end if;
  select * into current_row from public.wld_shows where owner=auth.uid() for update;
  if not found or current_row.version<>expected_version then return null; end if;
  next_snapshot=current_row.snapshot;
  for edit in select value from jsonb_array_elements(edits) loop
    if jsonb_typeof(edit->'path') is distinct from 'array' then raise exception 'Invalid path'; end if;
    select array_agg(value order by ord) into keys from jsonb_array_elements_text(edit->'path') with ordinality as t(value,ord);
    if keys is null or keys[1] not in ('state','library') or keys && array['__proto__','prototype','constructor'] then raise exception 'Invalid path'; end if;
    if edit->>'remove'='true' then next_snapshot=next_snapshot #- keys;
    else
      if not (edit ? 'value') then raise exception 'Missing value'; end if;
      next_snapshot=jsonb_set(next_snapshot,keys,edit->'value',true);
    end if;
  end loop;
  perform public.wld_check_snapshot(next_snapshot);
  update public.wld_shows set snapshot=next_snapshot,version=version+1,last_patch=edits,updated_at=now() where owner=auth.uid();
  return current_row.version+1;
end $$;
-- Old clients remain compatible but must invalidate the incremental change cache.
create or replace function public.wld_save_show(expected_version bigint, s jsonb) returns bigint
language plpgsql security definer set search_path = '' as $$
declare next_version bigint;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  perform public.wld_check_snapshot(s);
  update public.wld_shows set snapshot=s,version=version+1,last_patch=null,updated_at=now()
    where owner=auth.uid() and version=expected_version returning version into next_version;
  return next_version;
end $$;
revoke all on function public.wld_patch_show(bigint,jsonb) from public, anon;
grant execute on function public.wld_patch_show(bigint,jsonb) to authenticated;
