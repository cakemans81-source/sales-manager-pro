-- 거래명세서 이미지 URL 목록 컬럼 추가 (Supabase 대시보드 > SQL Editor 에서 1회 실행)
-- 이미지 파일 자체는 Storage 의 project-images 버킷 transaction-statement/ 폴더에 저장됩니다.
alter table public.sales_data
    add column if not exists "transactionStatementImages" jsonb not null default '[]'::jsonb;

-- PostgREST 스키마 캐시 갱신 (새 컬럼을 즉시 API에 반영)
notify pgrst, 'reload schema';
