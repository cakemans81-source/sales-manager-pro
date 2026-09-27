-- ════════════════════════════════════════════════════════════════════
-- 영업 데이터 보호 (2026-09-27)
--  앱은 모든 Supabase 요청에 로그인 세션 토큰을 x-smp-token 헤더로 보낸다 (src/lib/supabase.js).
--  RLS 정책은 smp_request_role() 로 그 토큰의 역할을 확인한다.
--   - 조회: admin / editor / viewer
--   - 등록·수정: admin / editor
--   - 삭제: admin (sales_data), admin / editor (customer_contacts, 첨부 파일)
--  M1: smp_data_rls_m1   — 추가 전용, 운영 적용 완료
--  M2: smp_data_rls_m2   — 새 클라이언트 운영 배포 확인 후 적용
--  pattern_jobs 는 다른 앱 소유로 보여 이번 범위에서 제외
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────── M1 ───────────────────────────
create or replace function public.smp_request_role() returns text
language plpgsql stable security definer set search_path = public, extensions as $$
declare v_token text; me public.user_accounts;
begin
  begin
    v_token := current_setting('request.headers', true)::json ->> 'x-smp-token';
  exception when others then
    return null;
  end;
  if coalesce(v_token, '') = '' then return null; end if;
  me := public.smp_session_user(v_token);
  return me.role;
end $$;
revoke all on function public.smp_request_role() from public;
grant execute on function public.smp_request_role() to anon, authenticated;

create or replace function public.smp_toggle_star(p_token text, p_id bigint, p_starred boolean) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare me public.user_accounts;
begin
  me := public.smp_session_user(p_token);
  if me."employeeId" is null then raise exception 'SESSION_EXPIRED' using errcode = '28000'; end if;
  update public.sales_data set is_starred = coalesce(p_starred, false) where id = p_id;
end $$;
revoke all on function public.smp_toggle_star(text, bigint, boolean) from public;
grant execute on function public.smp_toggle_star(text, bigint, boolean) to anon, authenticated;

notify pgrst, 'reload schema';

-- ─────────────────────────── M2 ───────────────────────────
-- ⚠️ 새 클라이언트(x-smp-token 헤더 전송)가 운영에 배포된 것을 확인한 뒤에만 실행

-- 1) sales_data
alter table public.sales_data enable row level security;
drop policy if exists smp_sales_read on public.sales_data;
drop policy if exists smp_sales_insert on public.sales_data;
drop policy if exists smp_sales_update on public.sales_data;
drop policy if exists smp_sales_delete on public.sales_data;
create policy smp_sales_read on public.sales_data for select to anon, authenticated
  using ((select public.smp_request_role()) in ('admin', 'editor', 'viewer'));
create policy smp_sales_insert on public.sales_data for insert to anon, authenticated
  with check ((select public.smp_request_role()) in ('admin', 'editor'));
create policy smp_sales_update on public.sales_data for update to anon, authenticated
  using ((select public.smp_request_role()) in ('admin', 'editor'))
  with check ((select public.smp_request_role()) in ('admin', 'editor'));
create policy smp_sales_delete on public.sales_data for delete to anon, authenticated
  using ((select public.smp_request_role()) = 'admin');

-- 2) customer_contacts ("Allow all access" 정책 교체)
drop policy if exists "Allow all access" on public.customer_contacts;
drop policy if exists smp_contacts_read on public.customer_contacts;
drop policy if exists smp_contacts_write on public.customer_contacts;
create policy smp_contacts_read on public.customer_contacts for select to anon, authenticated
  using ((select public.smp_request_role()) in ('admin', 'editor', 'viewer'));
create policy smp_contacts_write on public.customer_contacts for all to anon, authenticated
  using ((select public.smp_request_role()) in ('admin', 'editor'))
  with check ((select public.smp_request_role()) in ('admin', 'editor'));

-- 3) sales_items (코드에서 사용하지 않음, 0건) → 잠금
alter table public.sales_items enable row level security;
revoke all on public.sales_items from anon, authenticated;

-- 4) 첨부 파일 버킷: 공개 읽기는 유지(이미지 URL 표시), 업로드/수정/삭제는 작성 권한자만
drop policy if exists "Allow anon upload" on storage.objects;
drop policy if exists "Allow anon update" on storage.objects;
drop policy if exists "Allow anon delete" on storage.objects;
drop policy if exists "img: anon upload" on storage.objects;
drop policy if exists "img: anon update" on storage.objects;
drop policy if exists "img: anon delete" on storage.objects;
drop policy if exists "mail: anon upload" on storage.objects;
drop policy if exists "mail: anon update" on storage.objects;
drop policy if exists "mail: anon delete" on storage.objects;
create policy "smp_files_insert" on storage.objects for insert to anon, authenticated
  with check (bucket_id in ('quote-pdfs', 'mail-pdfs', 'project-images')
              and (select public.smp_request_role()) in ('admin', 'editor'));
create policy "smp_files_update" on storage.objects for update to anon, authenticated
  using (bucket_id in ('quote-pdfs', 'mail-pdfs', 'project-images')
         and (select public.smp_request_role()) in ('admin', 'editor'));
create policy "smp_files_delete" on storage.objects for delete to anon, authenticated
  using (bucket_id in ('quote-pdfs', 'mail-pdfs', 'project-images')
         and (select public.smp_request_role()) in ('admin', 'editor'));

notify pgrst, 'reload schema';
