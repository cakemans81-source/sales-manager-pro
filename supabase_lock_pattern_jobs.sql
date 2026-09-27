-- ════════════════════════════════════════════════════════════════════
-- pattern_jobs 잠금 (2026-09-27, 운영 DB 마이그레이션 lock_pattern_jobs 로 적용 완료)
--  - 소유: IRU Pattern Engine (algorithm 'lscm' 작업 이력). 이 앱은 사용하지 않음.
--  - 엔진 백엔드는 service_role 키로 접근 → RLS 를 우회하므로 영향 없음.
--    엔진 frontend 는 Supabase 를 직접 쓰지 않음. 엔진 backend/.env 의 SUPABASE_URL 은
--    2026-09-27 기준 자리표시자(YOUR_NEW_PROJECT)로, 현재 이 DB를 가리키는 앱은 없음.
--  - 데이터와 테이블은 보존 (2026-02-23 테스트 작업 1건).
-- ════════════════════════════════════════════════════════════════════

-- 점검 중 익명 키 INSERT 테스트로 잘못 생성된 1건 제거 (PostgREST 가 Prefer: tx=rollback 을 적용하지 않음)
delete from public.pattern_jobs
 where id = 'd07b30d8-9ffb-4283-901e-1c6c7eb29d6a'
   and status = 'queued'
   and created_at >= '2026-09-27 03:24:00+00';

-- RLS on, 정책 없음 = anon/authenticated 직접 접근 전면 차단
alter table public.pattern_jobs enable row level security;
revoke all on public.pattern_jobs from anon, authenticated;

notify pgrst, 'reload schema';
