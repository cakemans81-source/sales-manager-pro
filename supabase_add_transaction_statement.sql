-- 거래명세서 이미지 URL 목록 컬럼 추가 (Supabase 대시보드 > SQL Editor 에서 1회 실행)
-- 2026-09-27 운영 DB(SALES BORAD)에 마이그레이션 add_transaction_statement_images 로 적용 완료
-- 이미지 파일 자체는 Storage 의 project-images 버킷 transaction-statement/ 폴더에 저장됩니다.
-- 기존 첨부 컬럼(taxInvoiceImages 등)과 동일하게 jsonb, 기본값 [], NULL 허용
alter table public.sales_data
    add column if not exists "transactionStatementImages" jsonb default '[]'::jsonb;

-- PostgREST 스키마 캐시 갱신 (새 컬럼을 즉시 API에 반영)
notify pgrst, 'reload schema';
