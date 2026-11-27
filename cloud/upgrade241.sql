-- Large saved shows can take longer than the authenticated role's default 8s
-- when PostgreSQL rewrites their JSONB snapshot, including a control handoff.
-- Bound this one RPC to 30s, below the client's existing 60s request deadline.
-- Keep all role/global limits, ownership checks, grants and RLS unchanged.
-- https://supabase.com/docs/guides/database/postgres/timeouts#function-level
alter function public.wld_patch_show(bigint, jsonb)
  set statement_timeout to '30s';

notify pgrst, 'reload schema';

-- Rollback: alter function public.wld_patch_show(bigint, jsonb)
--             reset statement_timeout;
--           notify pgrst, 'reload schema';
