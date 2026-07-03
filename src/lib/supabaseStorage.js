/**
 * Supabase Storage - 파일 업로드 유틸리티
 * - quote-pdfs      버킷: 견적서 PDF/이미지
 * - mail-pdfs       버킷: 메일 내용 PDF
 * - project-images  버킷: 최종 제품 사진, 견적 합의서 이미지, 세금계산서 이미지 (다중)
 */
import { supabase } from './supabase';

const PDF_BUCKET = 'quote-pdfs';
const MAIL_BUCKET = 'mail-pdfs';
const IMAGE_BUCKET = 'project-images';

// ─────────────────────────────────────────────
// 공통: publicUrl → 버킷 내 filePath 추출
// ─────────────────────────────────────────────
const extractFilePath = (publicUrl, bucket) => {
    try {
        const urlObj = new URL(publicUrl);
        const parts = urlObj.pathname.split(`/object/public/${bucket}/`);
        return parts.length >= 2 ? decodeURIComponent(parts[1]) : null;
    } catch { return null; }
};

// ─────────────────────────────────────────────
// 견적서 파일 업로드 / 삭제
// ─────────────────────────────────────────────
export const uploadQuotePDF = async (file, projectId) => {
    if (!supabase) throw new Error('Supabase가 연결되어 있지 않습니다.');
    if (!file) throw new Error('업로드할 파일이 없습니다.');

    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const filePath = `project_${projectId}_${timestamp}_${safeFileName}`;

    const { error } = await supabase.storage
        .from(PDF_BUCKET)
        .upload(filePath, file, { contentType: file.type || 'application/pdf', upsert: false });

    if (error) throw error;
    const { data } = supabase.storage.from(PDF_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
};

export const deleteQuotePDF = async (publicUrl) => {
    if (!supabase || !publicUrl) return;
    const filePath = extractFilePath(publicUrl, PDF_BUCKET);
    if (filePath) await supabase.storage.from(PDF_BUCKET).remove([filePath]);
};

// ─────────────────────────────────────────────
// 메일 내용 PDF 업로드 / 삭제
// ─────────────────────────────────────────────
export const uploadMailPDF = async (file, projectId) => {
    if (!supabase) throw new Error('Supabase가 연결되어 있지 않습니다.');
    if (!file) throw new Error('업로드할 파일이 없습니다.');

    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const filePath = `mail_${projectId}_${timestamp}_${safeFileName}`;

    const { error } = await supabase.storage
        .from(MAIL_BUCKET)
        .upload(filePath, file, { contentType: 'application/pdf', upsert: false });

    if (error) throw error;
    const { data } = supabase.storage.from(MAIL_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
};

export const deleteMailPDF = async (publicUrl) => {
    if (!supabase || !publicUrl) return;
    const filePath = extractFilePath(publicUrl, MAIL_BUCKET);
    if (filePath) await supabase.storage.from(MAIL_BUCKET).remove([filePath]).catch(() => { });
};

// ─────────────────────────────────────────────
// 제품 이미지 단건 업로드 / 삭제
// ─────────────────────────────────────────────
export const uploadProductImage = async (file, projectId) => {
    if (!supabase) throw new Error('Supabase가 연결되어 있지 않습니다.');
    if (!file) throw new Error('업로드할 파일이 없습니다.');

    const timestamp = Date.now();
    const ext = file.name.split('.').pop().replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
    const filePath = `product/project_${projectId}_${timestamp}_${Math.random().toString(36).slice(2, 7)}.${ext}`;

    const { error } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(filePath, file, { contentType: file.type, upsert: false });

    if (error) throw error;
    const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
};

export const deleteProductImage = async (publicUrl) => {
    if (!supabase || !publicUrl) return;
    const filePath = extractFilePath(publicUrl, IMAGE_BUCKET);
    if (filePath) await supabase.storage.from(IMAGE_BUCKET).remove([filePath]).catch(() => { });
};

// ─────────────────────────────────────────────
// 견적 합의서 이미지 업로드 / 삭제
// ─────────────────────────────────────────────
export const uploadAgreementImage = async (file, projectId) => {
    if (!supabase) throw new Error('Supabase가 연결되어 있지 않습니다.');
    if (!file) throw new Error('업로드할 파일이 없습니다.');

    const timestamp = Date.now();
    const ext = file.name.split('.').pop().replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
    const filePath = `agreement/project_${projectId}_${timestamp}_${Math.random().toString(36).slice(2, 7)}.${ext}`;

    const { error } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(filePath, file, { contentType: file.type, upsert: false });

    if (error) throw error;
    const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
};

export const deleteAgreementImage = async (publicUrl) => {
    if (!supabase || !publicUrl) return;
    const filePath = extractFilePath(publicUrl, IMAGE_BUCKET);
    if (filePath) await supabase.storage.from(IMAGE_BUCKET).remove([filePath]).catch(() => { });
};

// ─────────────────────────────────────────────
// 세금계산서 이미지 업로드 / 삭제
// ─────────────────────────────────────────────
export const uploadTaxInvoiceImage = async (file, projectId) => {
    if (!supabase) throw new Error('Supabase가 연결되어 있지 않습니다.');
    if (!file) throw new Error('업로드할 파일이 없습니다.');

    const timestamp = Date.now();
    const ext = file.name.split('.').pop().replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
    const filePath = `tax-invoice/project_${projectId}_${timestamp}_${Math.random().toString(36).slice(2, 7)}.${ext}`;

    const { error } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(filePath, file, { contentType: file.type, upsert: false });

    if (error) throw error;
    const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
};

export const deleteTaxInvoiceImage = async (publicUrl) => {
    if (!supabase || !publicUrl) return;
    const filePath = extractFilePath(publicUrl, IMAGE_BUCKET);
    if (filePath) await supabase.storage.from(IMAGE_BUCKET).remove([filePath]).catch(() => { });
};
