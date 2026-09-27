-- ════════════════════════════════════════════════════════════════════
-- 로그인 보안 강화 (2026-09-27)
--  M1: smp_auth_rpc_m1  — 운영 DB 적용 완료 (추가 전용, 구 클라이언트와 호환)
--  M2: smp_auth_lockdown_m2 — 새 클라이언트 운영 배포 확인 후 적용
-- 비밀번호는 bcrypt 해시(password_hash)로만 보관하고, 검증은 아래 SECURITY DEFINER 함수에서만 수행한다.
-- 관리자 기능은 로그인 시 발급한 세션 토큰(smp_sessions, sha256 해시 보관)으로 권한을 확인한다.
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────── M1 ───────────────────────────
alter table public.user_accounts add column if not exists password_hash text;
alter table public.user_accounts alter column password drop not null;
update public.user_accounts
   set password_hash = extensions.crypt(password, extensions.gen_salt('bf'))
 where password_hash is null and password is not null and password <> '';

create or replace function public.smp_sync_password_hash() returns trigger
language plpgsql set search_path = public, extensions as $$
begin
  if new.password is not null and new.password <> ''
     and (tg_op = 'INSERT' or new.password is distinct from old.password) then
    new.password_hash := extensions.crypt(new.password, extensions.gen_salt('bf'));
  end if;
  return new;
end $$;
drop trigger if exists smp_user_accounts_hash on public.user_accounts;
create trigger smp_user_accounts_hash before insert or update on public.user_accounts
  for each row execute function public.smp_sync_password_hash();

create table if not exists public.smp_sessions (
  token_hash text primary key,
  employee_id text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);
alter table public.smp_sessions enable row level security;
revoke all on public.smp_sessions from anon, authenticated;

create or replace function public.smp_effective_status(u public.user_accounts) returns text
language sql immutable set search_path = public as $$
  select case
    when trim(coalesce(u.status, '')) = 'inactive' then 'inactive'
    when trim(coalesce(u.status, '')) = 'active' then 'active'
    when trim(coalesce(u.status, '')) = 'pending' then 'pending'
    when u."isApproved" is true then 'active'
    else 'pending' end
$$;

create or replace function public.smp_public_user(u public.user_accounts) returns json
language sql stable set search_path = public as $$
  select json_build_object('id', u."employeeId", 'employeeId', u."employeeId", 'name', u.name,
    'role', u.role, 'status', u.status, 'isApproved', u."isApproved", 'created_at', u.created_at)
$$;

create or replace function public.smp_session_user(p_token text) returns public.user_accounts
language sql stable security definer set search_path = public, extensions as $$
  select u.* from public.smp_sessions s
    join public.user_accounts u on u."employeeId" = s.employee_id
   where s.token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
     and s.expires_at > now()
     and u."isApproved" is true
     and public.smp_effective_status(u) = 'active'
   limit 1
$$;

create or replace function public.smp_require_admin(p_token text) returns public.user_accounts
language plpgsql stable security definer set search_path = public, extensions as $$
declare me public.user_accounts;
begin
  me := public.smp_session_user(p_token);
  if me."employeeId" is null then raise exception 'SESSION_EXPIRED' using errcode = '28000'; end if;
  if me.role <> 'admin' then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  return me;
end $$;

create or replace function public.smp_login(p_employee_id text, p_password text) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare u public.user_accounts; v_token text;
begin
  select * into u from public.user_accounts
   where "employeeId" = p_employee_id
     and password_hash is not null
     and password_hash = extensions.crypt(coalesce(p_password, ''), password_hash);
  if u."employeeId" is null then
    perform pg_sleep(0.4);
    return json_build_object('ok', false, 'reason', 'INVALID');
  end if;
  if u."isApproved" is not true or public.smp_effective_status(u) <> 'active' then
    return json_build_object('ok', false, 'reason', 'NOT_ACTIVE');
  end if;
  delete from public.smp_sessions where expires_at < now();
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.smp_sessions (token_hash, employee_id)
    values (encode(extensions.digest(v_token, 'sha256'), 'hex'), u."employeeId");
  return json_build_object('ok', true, 'token', v_token, 'user', public.smp_public_user(u));
end $$;

create or replace function public.smp_logout(p_token text) returns void
language sql security definer set search_path = public, extensions as $$
  delete from public.smp_sessions where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
$$;

create or replace function public.smp_signup(p_employee_id text, p_password text, p_name text) returns json
language plpgsql security definer set search_path = public, extensions as $$
begin
  if coalesce(trim(p_employee_id), '') = '' or coalesce(p_password, '') = '' or coalesce(trim(p_name), '') = '' then
    return json_build_object('ok', false, 'reason', 'INVALID_INPUT');
  end if;
  if length(p_password) < 4 then return json_build_object('ok', false, 'reason', 'PASSWORD_TOO_SHORT'); end if;
  if exists (select 1 from public.user_accounts where "employeeId" = p_employee_id) then
    return json_build_object('ok', false, 'reason', 'DUPLICATE');
  end if;
  insert into public.user_accounts ("employeeId", password, password_hash, name, role, status, "isApproved")
    values (p_employee_id, null, extensions.crypt(p_password, extensions.gen_salt('bf')), trim(p_name), 'viewer', 'pending', false);
  return json_build_object('ok', true);
end $$;

create or replace function public.smp_change_password(p_token text, p_current text, p_new text) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare me public.user_accounts;
begin
  me := public.smp_session_user(p_token);
  if me."employeeId" is null then return json_build_object('ok', false, 'reason', 'SESSION_EXPIRED'); end if;
  if me.password_hash is null or me.password_hash <> extensions.crypt(coalesce(p_current, ''), me.password_hash) then
    perform pg_sleep(0.4);
    return json_build_object('ok', false, 'reason', 'WRONG_PASSWORD');
  end if;
  if length(coalesce(p_new, '')) < 4 then return json_build_object('ok', false, 'reason', 'PASSWORD_TOO_SHORT'); end if;
  update public.user_accounts set password = null, password_hash = extensions.crypt(p_new, extensions.gen_salt('bf'))
   where "employeeId" = me."employeeId";
  return json_build_object('ok', true);
end $$;

create or replace function public.smp_admin_list_users(p_token text) returns json
language plpgsql stable security definer set search_path = public, extensions as $$
begin
  perform public.smp_require_admin(p_token);
  return coalesce((select json_agg(public.smp_public_user(u) order by u.created_at) from public.user_accounts u), '[]'::json);
end $$;

create or replace function public.smp_admin_approve_user(p_token text, p_target text, p_role text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.smp_require_admin(p_token);
  if p_role not in ('viewer', 'editor', 'admin') then raise exception 'INVALID_ROLE'; end if;
  update public.user_accounts set "isApproved" = true, role = p_role, status = 'active' where "employeeId" = p_target;
end $$;

create or replace function public.smp_admin_reject_user(p_token text, p_target text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare me public.user_accounts;
begin
  me := public.smp_require_admin(p_token);
  if p_target = me."employeeId" then raise exception 'CANNOT_TARGET_SELF'; end if;
  delete from public.smp_sessions where employee_id = p_target;
  delete from public.user_accounts where "employeeId" = p_target;
end $$;

create or replace function public.smp_admin_change_role(p_token text, p_target text, p_role text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.smp_require_admin(p_token);
  if p_role not in ('viewer', 'editor', 'admin') then raise exception 'INVALID_ROLE'; end if;
  update public.user_accounts set role = p_role where "employeeId" = p_target;
end $$;

create or replace function public.smp_admin_deactivate_user(p_token text, p_target text) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare me public.user_accounts; t public.user_accounts; active_admins int;
begin
  me := public.smp_require_admin(p_token);
  if p_target = me."employeeId" then return json_build_object('ok', false, 'reason', 'CANNOT_TARGET_SELF'); end if;
  select * into t from public.user_accounts where "employeeId" = p_target;
  if t."employeeId" is null then return json_build_object('ok', false, 'reason', 'NOT_FOUND'); end if;
  select count(*) into active_admins from public.user_accounts u
   where u.role = 'admin' and u."isApproved" is true and public.smp_effective_status(u) = 'active';
  if t.role = 'admin' and t."isApproved" is true and public.smp_effective_status(t) = 'active' and active_admins <= 1 then
    return json_build_object('ok', false, 'reason', 'LAST_ADMIN');
  end if;
  update public.user_accounts set status = 'inactive', "isApproved" = false where "employeeId" = p_target;
  delete from public.smp_sessions where employee_id = p_target;
  return json_build_object('ok', true);
end $$;

create or replace function public.smp_admin_update_user(p_token text, p_target text, p_name text, p_new_password text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.smp_require_admin(p_token);
  if coalesce(p_new_password, '') <> '' and length(p_new_password) < 4 then raise exception 'PASSWORD_TOO_SHORT'; end if;
  update public.user_accounts
     set name = coalesce(nullif(trim(p_name), ''), name),
         password = case when coalesce(p_new_password, '') <> '' then null else password end,
         password_hash = case when coalesce(p_new_password, '') <> ''
                              then extensions.crypt(p_new_password, extensions.gen_salt('bf')) else password_hash end
   where "employeeId" = p_target;
  if coalesce(p_new_password, '') <> '' then
    delete from public.smp_sessions where employee_id = p_target;
  end if;
end $$;

revoke all on function public.smp_session_user(text) from public, anon, authenticated;
revoke all on function public.smp_require_admin(text) from public, anon, authenticated;
revoke all on function public.smp_sync_password_hash() from public, anon, authenticated;
revoke all on function public.smp_effective_status(public.user_accounts) from public, anon, authenticated;
revoke all on function public.smp_public_user(public.user_accounts) from public, anon, authenticated;
revoke all on function public.smp_login(text, text) from public;
revoke all on function public.smp_logout(text) from public;
revoke all on function public.smp_signup(text, text, text) from public;
revoke all on function public.smp_change_password(text, text, text) from public;
revoke all on function public.smp_admin_list_users(text) from public;
revoke all on function public.smp_admin_approve_user(text, text, text) from public;
revoke all on function public.smp_admin_reject_user(text, text) from public;
revoke all on function public.smp_admin_change_role(text, text, text) from public;
revoke all on function public.smp_admin_deactivate_user(text, text) from public;
revoke all on function public.smp_admin_update_user(text, text, text, text) from public;
grant execute on function public.smp_login(text, text), public.smp_logout(text), public.smp_signup(text, text, text),
  public.smp_change_password(text, text, text), public.smp_admin_list_users(text),
  public.smp_admin_approve_user(text, text, text), public.smp_admin_reject_user(text, text),
  public.smp_admin_change_role(text, text, text), public.smp_admin_deactivate_user(text, text),
  public.smp_admin_update_user(text, text, text, text) to anon, authenticated;

notify pgrst, 'reload schema';

-- ─────────────────────────── M2 ───────────────────────────
-- ⚠️ 새 클라이언트(RPC 로그인)가 운영에 배포된 것을 확인한 뒤에만 실행
-- 1) 평문 비밀번호 컬럼과 전환용 트리거 제거
drop trigger if exists smp_user_accounts_hash on public.user_accounts;
drop function if exists public.smp_sync_password_hash();
alter table public.user_accounts drop column if exists password;
-- 2) password 컬럼을 참조하던 함수를 컬럼 없이 재정의 (재정의하지 않으면 실행 시 오류)
create or replace function public.smp_signup(p_employee_id text, p_password text, p_name text) returns json
language plpgsql security definer set search_path = public, extensions as $$
begin
  if coalesce(trim(p_employee_id), '') = '' or coalesce(p_password, '') = '' or coalesce(trim(p_name), '') = '' then
    return json_build_object('ok', false, 'reason', 'INVALID_INPUT');
  end if;
  if length(p_password) < 4 then return json_build_object('ok', false, 'reason', 'PASSWORD_TOO_SHORT'); end if;
  if exists (select 1 from public.user_accounts where "employeeId" = p_employee_id) then
    return json_build_object('ok', false, 'reason', 'DUPLICATE');
  end if;
  insert into public.user_accounts ("employeeId", password_hash, name, role, status, "isApproved")
    values (p_employee_id, extensions.crypt(p_password, extensions.gen_salt('bf')), trim(p_name), 'viewer', 'pending', false);
  return json_build_object('ok', true);
end $$;

create or replace function public.smp_change_password(p_token text, p_current text, p_new text) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare me public.user_accounts;
begin
  me := public.smp_session_user(p_token);
  if me."employeeId" is null then return json_build_object('ok', false, 'reason', 'SESSION_EXPIRED'); end if;
  if me.password_hash is null or me.password_hash <> extensions.crypt(coalesce(p_current, ''), me.password_hash) then
    perform pg_sleep(0.4);
    return json_build_object('ok', false, 'reason', 'WRONG_PASSWORD');
  end if;
  if length(coalesce(p_new, '')) < 4 then return json_build_object('ok', false, 'reason', 'PASSWORD_TOO_SHORT'); end if;
  update public.user_accounts set password_hash = extensions.crypt(p_new, extensions.gen_salt('bf'))
   where "employeeId" = me."employeeId";
  return json_build_object('ok', true);
end $$;

create or replace function public.smp_admin_update_user(p_token text, p_target text, p_name text, p_new_password text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.smp_require_admin(p_token);
  if coalesce(p_new_password, '') <> '' and length(p_new_password) < 4 then raise exception 'PASSWORD_TOO_SHORT'; end if;
  update public.user_accounts
     set name = coalesce(nullif(trim(p_name), ''), name),
         password_hash = case when coalesce(p_new_password, '') <> ''
                              then extensions.crypt(p_new_password, extensions.gen_salt('bf')) else password_hash end
   where "employeeId" = p_target;
  if coalesce(p_new_password, '') <> '' then
    delete from public.smp_sessions where employee_id = p_target;
  end if;
end $$;

-- 3) user_accounts 에 대한 익명/인증 키 직접 접근 차단 (RPC 함수는 SECURITY DEFINER 로 계속 동작)
alter table public.user_accounts enable row level security;
revoke all on public.user_accounts from anon, authenticated;
notify pgrst, 'reload schema';
