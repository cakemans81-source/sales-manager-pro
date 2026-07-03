import React, { useState, useRef } from 'react';
import { X, Plus, Trash2, Save, Upload, FileText, Loader, Image, LayoutGrid, FileImage, Receipt, Printer } from 'lucide-react';
import DeliveryNoteModal from './DeliveryNoteModal';
import {
    uploadQuotePDF, uploadMailPDF, deleteMailPDF,
    uploadProductImage, deleteProductImage,
    uploadAgreementImage, deleteAgreementImage,
    uploadTaxInvoiceImage, deleteTaxInvoiceImage
} from '../../lib/supabaseStorage';

const ProjectModal = ({
    editingItemId,
    setIsModalOpen,
    setEditingItemId,
    handleAddData,
    formData,
    setFormData,
    handleFileChange,
    user,
    handleDeleteItem,
    isSaving,
    processDataSave,
    contactsData = []
}) => {
    const [pdfUploading, setPdfUploading] = useState(false);
    const [pdfError, setPdfError] = useState('');
    const pdfInputRef = useRef(null);
    const pdfUploadingRef = useRef(false);
    const [showDeliveryNote, setShowDeliveryNote] = useState(false);

    const [mailUploading, setMailUploading] = useState(false);
    const [mailError, setMailError] = useState('');
    const mailPdfRef = useRef(null);

    const [photoUploading, setPhotoUploading] = useState(false);
    const [photoError, setPhotoError] = useState('');
    const photoInputRef = useRef(null);

    const [agreementUploading, setAgreementUploading] = useState(false);
    const [agreementError, setAgreementError] = useState('');
    const agreementInputRef = useRef(null);

    const [taxInvoiceUploading, setTaxInvoiceUploading] = useState(false);
    const [taxInvoiceError, setTaxInvoiceError] = useState('');
    const taxInvoiceInputRef = useRef(null);

    const uploadQuoteFile = async (file) => {
        if (!file || pdfUploadingRef.current) return;
        if (file.size > 20 * 1024 * 1024) { setPdfError('파일 크기는 20MB 이하여야 합니다.'); return; }
        setPdfError(''); setPdfUploading(true);
        pdfUploadingRef.current = true;
        try {
            const tempId = editingItemId || `new_${Date.now()}`;
            const url = await uploadQuotePDF(file, tempId);
            setFormData(prev => ({ ...prev, quotePdfUrl: url }));
        } catch (err) {
            setPdfError(`업로드 실패: ${err.message || '알 수 없는 오류'}`);
        } finally {
            setPdfUploading(false);
            pdfUploadingRef.current = false;
            if (pdfInputRef.current) pdfInputRef.current.value = '';
        }
    };

    const handlePdfUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type !== 'application/pdf') { setPdfError('PDF 파일만 업로드할 수 있습니다.'); return; }
        await uploadQuoteFile(file);
    };

    const handleQuotePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file' && items[i].type.startsWith('image/')) {
                const file = items[i].getAsFile();
                if (!file) return;
                const rawExt = file.type.split('/')[1] || 'png';
                const ext = rawExt.replace(/[^a-zA-Z0-9]/g, '') || 'png';
                const renamed = new File([file], `quote-screenshot-${Date.now()}.${ext}`, { type: file.type });
                e.preventDefault();
                uploadQuoteFile(renamed);
                return;
            }
        }
    };

    const handleMailPdfUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type !== 'application/pdf') { setMailError('PDF 파일만 업로드할 수 있습니다.'); return; }
        if (file.size > 20 * 1024 * 1024) { setMailError('파일 크기는 20MB 이하여야 합니다.'); return; }
        setMailError(''); setMailUploading(true);
        try {
            const tempId = editingItemId || `new_${Date.now()}`;
            const url = await uploadMailPDF(file, tempId);
            setFormData(prev => ({ ...prev, mailPdfUrl: url }));
        } catch (err) {
            setMailError(`업로드 실패: ${err.message || '알 수 없는 오류'}`);
        } finally {
            setMailUploading(false);
            if (mailPdfRef.current) mailPdfRef.current.value = '';
        }
    };

    const handleMailPdfRemove = async () => {
        if (formData.mailPdfUrl) await deleteMailPDF(formData.mailPdfUrl).catch(() => { });
        setFormData(prev => ({ ...prev, mailPdfUrl: '' }));
    };

    // ── 중복 방지: 업로드 중 플래그로 동시 호출 차단 ──
    const photoUploadingRef = useRef(false);
    const handleProductPhotosUpload = async (e) => {
        if (photoUploadingRef.current) return; // 중복 실행 차단
        const files = Array.from(e.target.files);
        if (!files.length) return;
        const invalid = files.find(f => !f.type.startsWith('image/'));
        if (invalid) { setPhotoError('이미지 파일만 업로드할 수 있습니다.'); return; }
        const oversize = files.find(f => f.size > 20 * 1024 * 1024);
        if (oversize) { setPhotoError('각 파일 크기는 20MB 이하여야 합니다.'); return; }
        setPhotoError('');
        photoUploadingRef.current = true;
        setPhotoUploading(true);
        // input value를 즉시 초기화하여 같은 파일을 다시 선택해도 onChange가 발생하도록 하되 중복 방지
        if (photoInputRef.current) photoInputRef.current.value = '';
        try {
            const tempId = editingItemId || `new_${Date.now()}`;
            const urls = await Promise.all(files.map(f => uploadProductImage(f, tempId)));
            setFormData(prev => {
                // 이미 존재하는 URL은 제외하여 중복 방지
                const existing = new Set(prev.finalProductPhotos || []);
                const newUrls = urls.filter(u => !existing.has(u));
                return { ...prev, finalProductPhotos: [...(prev.finalProductPhotos || []), ...newUrls] };
            });
        } catch (err) {
            setPhotoError(`업로드 실패: ${err.message || '알 수 없는 오류'}`);
        } finally {
            setPhotoUploading(false);
            photoUploadingRef.current = false;
        }
    };

    const handleProductPhotoRemove = async (url) => {
        await deleteProductImage(url).catch(() => { });
        setFormData(prev => ({ ...prev, finalProductPhotos: (prev.finalProductPhotos || []).filter(u => u !== url) }));
    };

    // ── 견적 합의서 이미지 ──
    const agreementUploadingRef = useRef(false);
    const uploadAgreementFiles = async (files) => {
        if (agreementUploadingRef.current) return;
        if (!files.length) return;
        const invalid = files.find(f => !f.type.startsWith('image/'));
        if (invalid) { setAgreementError('이미지 파일만 업로드할 수 있습니다.'); return; }
        const oversize = files.find(f => f.size > 20 * 1024 * 1024);
        if (oversize) { setAgreementError('각 파일 크기는 20MB 이하여야 합니다.'); return; }
        setAgreementError('');
        agreementUploadingRef.current = true;
        setAgreementUploading(true);
        if (agreementInputRef.current) agreementInputRef.current.value = '';
        try {
            const tempId = editingItemId || `new_${Date.now()}`;
            const urls = await Promise.all(files.map(f => uploadAgreementImage(f, tempId)));
            setFormData(prev => {
                const existing = new Set(prev.agreementImages || []);
                const newUrls = urls.filter(u => !existing.has(u));
                return { ...prev, agreementImages: [...(prev.agreementImages || []), ...newUrls] };
            });
        } catch (err) {
            setAgreementError(`업로드 실패: ${err.message || '알 수 없는 오류'}`);
        } finally {
            setAgreementUploading(false);
            agreementUploadingRef.current = false;
        }
    };
    const handleAgreementImagesUpload = (e) => uploadAgreementFiles(Array.from(e.target.files));

    // 클립보드 붙여넣기로 합의서 이미지 업로드
    const handleAgreementPaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        const files = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file' && items[i].type.startsWith('image/')) {
                const f = items[i].getAsFile();
                if (f) {
                    const ext = (f.type.split('/')[1] || 'png').replace(/[^a-zA-Z0-9]/g, '');
                    const renamed = new File([f], `clipboard_${Date.now()}.${ext}`, { type: f.type });
                    files.push(renamed);
                }
            }
        }
        if (files.length > 0) {
            e.preventDefault();
            uploadAgreementFiles(files);
        }
    };

    const handleAgreementImageRemove = async (url) => {
        await deleteAgreementImage(url).catch(() => { });
        setFormData(prev => ({ ...prev, agreementImages: (prev.agreementImages || []).filter(u => u !== url) }));
    };

    // ── 세금계산서 ──
    const taxInvoiceUploadingRef = useRef(false);
    const uploadTaxInvoiceFiles = async (files) => {
        if (taxInvoiceUploadingRef.current) return;
        if (!files.length) return;
        const invalid = files.find(f => !f.type.startsWith('image/'));
        if (invalid) { setTaxInvoiceError('이미지 파일만 업로드할 수 있습니다.'); return; }
        const oversize = files.find(f => f.size > 20 * 1024 * 1024);
        if (oversize) { setTaxInvoiceError('각 파일 크기는 20MB 이하여야 합니다.'); return; }
        setTaxInvoiceError('');
        taxInvoiceUploadingRef.current = true;
        setTaxInvoiceUploading(true);
        if (taxInvoiceInputRef.current) taxInvoiceInputRef.current.value = '';
        try {
            const tempId = editingItemId || `new_${Date.now()}`;
            const urls = await Promise.all(files.map(f => uploadTaxInvoiceImage(f, tempId)));
            setFormData(prev => {
                const existing = new Set(prev.taxInvoiceImages || []);
                const newUrls = urls.filter(u => !existing.has(u));
                return { ...prev, taxInvoiceImages: [...(prev.taxInvoiceImages || []), ...newUrls] };
            });
        } catch (err) {
            setTaxInvoiceError(`업로드 실패: ${err.message || '알 수 없는 오류'}`);
        } finally {
            setTaxInvoiceUploading(false);
            taxInvoiceUploadingRef.current = false;
        }
    };
    const handleTaxInvoiceImagesUpload = (e) => uploadTaxInvoiceFiles(Array.from(e.target.files));

    const handleTaxInvoicePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file' && items[i].type.startsWith('image/')) {
                const file = items[i].getAsFile();
                if (!file) return;
                const rawExt = file.type.split('/')[1] || 'png';
                const ext = rawExt.replace(/[^a-zA-Z0-9]/g, '') || 'png';
                const renamed = new File([file], `tax-invoice-screenshot-${Date.now()}.${ext}`, { type: file.type });
                e.preventDefault();
                uploadTaxInvoiceFiles([renamed]);
                return;
            }
        }
    };

    const handleTaxInvoiceImageRemove = async (url) => {
        await deleteTaxInvoiceImage(url).catch(() => { });
        setFormData(prev => ({ ...prev, taxInvoiceImages: (prev.taxInvoiceImages || []).filter(u => u !== url) }));
    };

    const handleDateChange = (status, value) => {
        let numbers = value.replace(/[^0-9]/g, '');
        let formatted = '';
        if (numbers.length < 5) {
            formatted = numbers;
        } else if (numbers.length < 7) {
            formatted = `${numbers.slice(0, 4)}.${numbers.slice(4)}`;
        } else {
            formatted = `${numbers.slice(0, 4)}.${numbers.slice(4, 6)}.${numbers.slice(6, 8)}`;
        }
        setFormData({ ...formData, statusDates: { ...(formData.statusDates || {}), [status]: formatted } });
    };

    const formatAmount = (value) => {
        if (!value) return '';
        const numericValue = value.toString().replace(/[^0-9]/g, '');
        return numericValue ? Number(numericValue).toLocaleString('ko-KR') : '';
    };

    const handleAmountChange = (field, value) => {
        const numericValue = value.replace(/[^0-9]/g, '');
        setFormData({ ...formData, [field]: numericValue });
    };

    // ── 크로스 오리진 이미지 다운로드 헬퍼 (Supabase Storage URL 등) ──
    const downloadImage = async (url, filename) => {
        try {
            const res = await fetch(url);
            const blob = await res.blob();
            const ext = blob.type.includes('png') ? 'png' : blob.type.includes('gif') ? 'gif' : blob.type.includes('webp') ? 'webp' : 'jpg';
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename.replace(/\.[^.]+$/, '') + '.' + ext;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        } catch {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    // ── 공통: 이미지 그리드 렌더러 ──
    const renderImageGrid = (photos, onRemove, accentColor, prefix) => {
        if (!photos || photos.length === 0) return null;
        return (
            <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(82px, 1fr))', gap: '0.45rem', marginBottom: '0.7rem' }}>
                    {photos.map((url, idx) => (
                        <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${accentColor}40`, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                            <img src={url} alt={`${prefix} ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onClick={() => window.open(url, '_blank', 'noopener,noreferrer')} title="클릭하면 원본 확인" />
                            <button type="button" onClick={e => { e.stopPropagation(); downloadImage(url, `${prefix}_${idx + 1}.jpg`); }}
                                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.75))', color: accentColor, textAlign: 'center', fontSize: '11px', fontWeight: '800', border: 'none', padding: '10px 0 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', cursor: 'pointer' }}
                                title="이 사진 다운로드">⬇ 다운</button>
                            <button type="button" onClick={() => onRemove(url)}
                                style={{ position: 'absolute', top: '3px', right: '3px', background: 'rgba(239,68,68,0.9)', border: 'none', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '11px', fontWeight: '700', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>✕</button>
                        </div>
                    ))}
                </div>
                {photos.length > 1 && (
                    <div style={{ marginBottom: '0.6rem' }}>
                        <button type="button"
                            onClick={() => { photos.forEach((url, idx) => { setTimeout(() => downloadImage(url, `${prefix}_${idx + 1}.jpg`), idx * 300); }); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: `${accentColor}25`, border: `1px solid ${accentColor}66`, color: accentColor, borderRadius: '8px', padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700' }}>
                            ⬇️ 전체 다운로드 ({photos.length}장)
                        </button>
                    </div>
                )}
            </>
        );
    };

    return (
        <>
            <div className="modal-overlay">
                <div className="modal-content glass animate-fade" style={{ width: 'min(1100px, 95vw)', maxHeight: '92vh', overflowY: 'auto' }}>
                    <div className="modal-header">
                        <h3>{editingItemId ? '프로젝트 정보 수정' : '신규 프로젝트 등록'}</h3>
                        <button onClick={() => { setIsModalOpen(false); setEditingItemId(null); }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X /></button>
                    </div>

                    <form onSubmit={handleAddData}>
                        {/* ── 2컬럼 메인 레이아웃 ── */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>

                            {/* 좌측: 기본정보 + 담당자 + 첨부파일 */}
                            <div>
                                {/* 사업자 선택 */}
                                <div className="input-group" style={{ marginBottom: '1rem' }}>
                                    <label style={{ marginBottom: '0.5rem', display: 'block' }}>📋 소속 사업자</label>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        {['(주)이루', '(주)가치'].map(co => (
                                            <button
                                                key={co}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, company: co })}
                                                style={{
                                                    flex: 1, padding: '0.6rem 1rem', borderRadius: '10px',
                                                    border: (formData.company === co || (!formData.company && co === '(주)이루'))
                                                        ? `2px solid ${co === '(주)이루' ? '#818cf8' : '#f59e0b'}`
                                                        : '2px solid rgba(255,255,255,0.1)',
                                                    background: (formData.company === co || (!formData.company && co === '(주)이루'))
                                                        ? co === '(주)이루' ? 'rgba(99,102,241,0.2)' : 'rgba(245,158,11,0.2)'
                                                        : 'rgba(255,255,255,0.04)',
                                                    color: (formData.company === co || (!formData.company && co === '(주)이루'))
                                                        ? co === '(주)이루' ? '#818cf8' : '#f59e0b'
                                                        : '#64748b',
                                                    fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer',
                                                    transition: 'all 0.18s',
                                                }}
                                            >{co}</button>
                                        ))}
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>고객사명</label>
                                    <input type="text" className="input-field" value={formData.customer} onChange={(e) => setFormData({ ...formData, customer: e.target.value })} required />
                                </div>
                                <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                                    <label>프로젝트명</label>
                                    <input type="text" className="input-field" value={formData.project} onChange={(e) => setFormData({ ...formData, project: e.target.value })} required />
                                </div>

                                {/* 담당자 1 */}
                                <div style={{ background: 'rgba(99,102,241,0.05)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', border: '1px solid rgba(99,102,241,0.1)' }}>
                                    <div className="input-group">
                                        <label style={{ color: '#818cf8', fontWeight: '800' }}>고객사 담당자 1 (주담당자)</label>
                                        <input type="text" className="input-field" list="contact-list"
                                            value={formData.customerContact}
                                            onChange={(e) => {
                                                const name = e.target.value;
                                                const contact = contactsData.find(c => c.name === name);
                                                if (contact) {
                                                    setFormData({ ...formData, customerContact: name, customerPosition: contact.position || '', customerPhone: contact.phone || '', customer: contact.customer || formData.customer });
                                                } else { setFormData({ ...formData, customerContact: name }); }
                                            }}
                                            placeholder="성함을 입력하거나 목록에서 선택하세요" />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.6rem' }}>
                                        <div className="input-group">
                                            <label style={{ fontSize: '0.7rem' }}>직급</label>
                                            <input type="text" className="input-field" value={formData.customerPosition || ''} onChange={(e) => setFormData({ ...formData, customerPosition: e.target.value })} placeholder="예: 책임연구원" />
                                        </div>
                                        <div className="input-group">
                                            <label style={{ fontSize: '0.7rem' }}>연락처</label>
                                            <input type="text" className="input-field" value={formData.customerPhone} onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })} placeholder="010-0000-0000" />
                                        </div>
                                    </div>
                                </div>

                                {/* 담당자 2 */}
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', marginBottom: '1.25rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div className="input-group">
                                        <label style={{ color: '#94a3b8' }}>고객사 담당자 2 (부담당자 - 선택)</label>
                                        <input type="text" className="input-field" list="contact-list"
                                            value={formData.customerContact2 || ''}
                                            onChange={(e) => {
                                                const name = e.target.value;
                                                const contact = contactsData.find(c => c.name === name);
                                                if (contact) {
                                                    setFormData({ ...formData, customerContact2: name, customerPosition2: contact.position || '', customerPhone2: contact.phone || '' });
                                                } else { setFormData({ ...formData, customerContact2: name }); }
                                            }}
                                            placeholder="추가 담당자가 있을 경우 입력하세요" />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.6rem' }}>
                                        <div className="input-group">
                                            <label style={{ fontSize: '0.7rem' }}>직급</label>
                                            <input type="text" className="input-field" value={formData.customerPosition2 || ''} onChange={(e) => setFormData({ ...formData, customerPosition2: e.target.value })} placeholder="예: 책임연구원" />
                                        </div>
                                        <div className="input-group">
                                            <label style={{ fontSize: '0.7rem' }}>연락처</label>
                                            <input type="text" className="input-field" value={formData.customerPhone2 || ''} onChange={(e) => setFormData({ ...formData, customerPhone2: e.target.value })} placeholder="010-0000-0000" />
                                        </div>
                                    </div>
                                </div>

                                <datalist id="contact-list">
                                    {contactsData.map(c => (<option key={c.id} value={c.name}>{c.customer} - {c.position}</option>))}
                                </datalist>

                                {/* 첨부파일 2단 그리드 묶음 */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    {/* 견적서 */}
                                    <div
                                        tabIndex={0}
                                        onPaste={handleQuotePaste}
                                        style={{ background: 'rgba(16,185,129,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.15)', outline: 'none' }}
                                        onFocus={e => { e.currentTarget.style.border = '1px solid rgba(16,185,129,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.15)'; }}
                                        onBlur={e => { e.currentTarget.style.border = '1px solid rgba(16,185,129,0.15)'; e.currentTarget.style.boxShadow = 'none'; }}
                                    >
                                        <h4 style={{ margin: '0 0 0.75rem 0', color: '#10b981', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={14} /> 견적서</h4>
                                        {formData.quotePdfUrl && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem', background: 'rgba(16,185,129,0.08)', padding: '0.45rem 0.7rem', borderRadius: '8px' }}>
                                                <FileText size={13} color="#10b981" />
                                                <span style={{ color: '#10b981', fontSize: '0.72rem', flex: 1, fontWeight: '600' }}>첨부됨</span>
                                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, quotePdfUrl: '' }))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.72rem', padding: '0 0.2rem' }}>✕ 삭제</button>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <input ref={pdfInputRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handlePdfUpload} />
                                            <button type="button" onClick={() => pdfInputRef.current && pdfInputRef.current.click()} disabled={pdfUploading}
                                                style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#10b981', borderRadius: '8px', padding: '0.45rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}>
                                                {pdfUploading ? <><Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> 업로드 중...</> : <><Upload size={13} /> 업로드</>}
                                            </button>
                                            {formData.quotePdfUrl && (
                                                <a href={formData.quotePdfUrl || undefined} target="_blank" rel="noopener noreferrer"
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(16,185,129,0.25)', border: '1px solid rgba(16,185,129,0.5)', color: '#fff', borderRadius: '8px', padding: '0.45rem 0.6rem', fontSize: '0.75rem', fontWeight: '700', textDecoration: 'none' }}>
                                                    👁 보기
                                                </a>
                                            )}
                                        </div>
                                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.7rem', color: '#10b981', opacity: 0.75, textAlign: 'center' }}>
                                            💡 이 영역을 클릭한 뒤 <b>Ctrl+V</b>로 스크린샷을 바로 붙여넣을 수 있습니다
                                        </p>
                                        {pdfError && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.4rem' }}>{pdfError}</p>}
                                    </div>

                                    {/* 메일 내용 PDF */}
                                    <div style={{ background: 'rgba(99,102,241,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.15)' }}>
                                        <h4 style={{ margin: '0 0 0.75rem 0', color: '#818cf8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={14} /> 메일 내용 PDF</h4>
                                        {formData.mailPdfUrl && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem', background: 'rgba(99,102,241,0.08)', padding: '0.45rem 0.7rem', borderRadius: '8px' }}>
                                                <FileText size={13} color="#818cf8" />
                                                <span style={{ color: '#818cf8', fontSize: '0.72rem', flex: 1, fontWeight: '600' }}>첨부됨</span>
                                                <button type="button" onClick={handleMailPdfRemove} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.72rem', padding: '0 0.2rem' }}>✕ 삭제</button>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <input ref={mailPdfRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handleMailPdfUpload} />
                                            <button type="button" onClick={() => mailPdfRef.current && mailPdfRef.current.click()} disabled={mailUploading}
                                                style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)', color: '#818cf8', borderRadius: '8px', padding: '0.45rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}>
                                                {mailUploading ? <><Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> 업로드 중...</> : <><Upload size={13} /> 업로드</>}
                                            </button>
                                            {formData.mailPdfUrl && (
                                                <a href={formData.mailPdfUrl || undefined} target="_blank" rel="noopener noreferrer"
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(99,102,241,0.25)', border: '1px solid rgba(99,102,241,0.5)', color: '#fff', borderRadius: '8px', padding: '0.45rem 0.6rem', fontSize: '0.75rem', fontWeight: '700', textDecoration: 'none' }}>
                                                    👁 보기
                                                </a>
                                            )}
                                        </div>
                                        {mailError && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.4rem' }}>{mailError}</p>}
                                    </div>

                                    {/* 견적 합의서 이미지 */}
                                    <div
                                        tabIndex={0}
                                        onPaste={handleAgreementPaste}
                                        style={{ background: 'rgba(14,165,233,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(14,165,233,0.15)', outline: 'none' }}
                                        onFocus={e => { e.currentTarget.style.border = '1px solid rgba(14,165,233,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(14,165,233,0.15)'; }}
                                        onBlur={e => { e.currentTarget.style.border = '1px solid rgba(14,165,233,0.15)'; e.currentTarget.style.boxShadow = 'none'; }}
                                    >
                                        <h4 style={{ margin: '0 0 0.75rem 0', color: '#0ea5e9', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileImage size={14} /> 견적 합의서 이미지</h4>
                                        {renderImageGrid(formData.agreementImages, handleAgreementImageRemove, '#0ea5e9', '합의서')}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <input ref={agreementInputRef} type="file" accept="image/png,image/jpeg,image/jpg" multiple style={{ display: 'none' }} onChange={handleAgreementImagesUpload} />
                                            <button type="button" onClick={() => agreementInputRef.current && agreementInputRef.current.click()} disabled={agreementUploading}
                                                style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.4)', color: '#0ea5e9', borderRadius: '8px', padding: '0.45rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}>
                                                {agreementUploading ? <><Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> 업로드 중...</> : <><Plus size={13} /> 사진 업로드</>}
                                            </button>
                                        </div>
                                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.7rem', color: '#0ea5e9', opacity: 0.75, textAlign: 'center' }}>
                                            💡 이 영역을 클릭한 뒤 <b>Ctrl+V</b>로 스크린샷을 바로 붙여넣을 수 있습니다
                                        </p>
                                        {agreementError && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.4rem' }}>{agreementError}</p>}
                                    </div>

                                    {/* 세금계산서 */}
                                    <div
                                        tabIndex={0}
                                        onPaste={handleTaxInvoicePaste}
                                        style={{ background: 'rgba(52,211,153,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(52,211,153,0.15)', outline: 'none' }}
                                        onFocus={e => { e.currentTarget.style.border = '1px solid rgba(52,211,153,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(52,211,153,0.15)'; }}
                                        onBlur={e => { e.currentTarget.style.border = '1px solid rgba(52,211,153,0.15)'; e.currentTarget.style.boxShadow = 'none'; }}
                                    >
                                        <h4 style={{ margin: '0 0 0.75rem 0', color: '#34d399', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Receipt size={14} /> 세금계산서</h4>
                                        {renderImageGrid(formData.taxInvoiceImages, handleTaxInvoiceImageRemove, '#34d399', '세금계산서')}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <input ref={taxInvoiceInputRef} type="file" accept="image/png,image/jpeg,image/jpg" multiple style={{ display: 'none' }} onChange={handleTaxInvoiceImagesUpload} />
                                            <button type="button" onClick={() => taxInvoiceInputRef.current && taxInvoiceInputRef.current.click()} disabled={taxInvoiceUploading}
                                                style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.4)', color: '#34d399', borderRadius: '8px', padding: '0.45rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}>
                                                {taxInvoiceUploading ? <><Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> 업로드 중...</> : <><Plus size={13} /> 사진 업로드</>}
                                            </button>
                                        </div>
                                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.7rem', color: '#34d399', opacity: 0.75, textAlign: 'center' }}>
                                            💡 이 영역을 클릭한 뒤 <b>Ctrl+V</b>로 스크린샷을 바로 붙여넣을 수 있습니다
                                        </p>
                                        {taxInvoiceError && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.4rem' }}>{taxInvoiceError}</p>}
                                    </div>

                                    {/* 최종 제품 사진 (전체 너비 사용) */}
                                    <div style={{ background: 'rgba(245,158,11,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.15)', gridColumn: '1 / -1' }}>
                                        <h4 style={{ margin: '0 0 0.75rem 0', color: '#f59e0b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><LayoutGrid size={14} /> 최종 제품 사진 <span style={{ fontSize: '0.7rem', color: '#f5f5f5', fontWeight: 'normal' }}>(PNG·JPG 최대 20MB)</span></h4>
                                        {renderImageGrid(formData.finalProductPhotos, handleProductPhotoRemove, '#f59e0b', '제품사진')}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                            <input ref={photoInputRef} type="file" accept="image/png,image/jpeg,image/jpg" multiple style={{ display: 'none' }} onChange={handleProductPhotosUpload} />
                                            <button type="button" onClick={() => photoInputRef.current && photoInputRef.current.click()} disabled={photoUploading}
                                                style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#f59e0b', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                                                {photoUploading ? <><Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> 여러 장 업로드 중...</> : <><Plus size={13} /> 추가 사진 일괄 업로드</>}
                                            </button>
                                        </div>
                                        {photoError && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.4rem' }}>{photoError}</p>}
                                    </div>

                                </div>
                            </div>

                            {/* 우측: 금액·상태·메모·날짜 */}
                            <div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <div className="input-group">
                                        <label>견적금액 (최초)</label>
                                        <input type="text" className="input-field" value={formatAmount(formData.estimateAmount)} onChange={(e) => handleAmountChange('estimateAmount', e.target.value)} required />
                                    </div>
                                    <div className="input-group">
                                        <label>인하 금액 (최종가)</label>
                                        <input type="text" className="input-field" value={formatAmount(formData.discountAmount)} onChange={(e) => handleAmountChange('discountAmount', e.target.value)} placeholder="없을 시 견적금액 반영" />
                                    </div>
                                </div>

                                <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                                    <label>현재 진행 상태</label>
                                    <select className="input-field" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="견적제출중">견적제출중</option>
                                        <option value="업체미선정">업체미선정</option>
                                        <option value="착수완료 진행">착수완료 진행</option>
                                        <option value="완료 마감 대기">완료 마감 대기</option>
                                        <option value="세금계산서 발행 완료">세금계산서 발행 완료</option>
                                        <option value="수금 완료">수금 완료</option>
                                        <option value="무상작업">무상작업</option>
                                    </select>
                                </div>

                                <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                                    <label>작전 기록 및 팀 코멘트 (Timeline)</label>
                                    <textarea className="input-field" style={{ minHeight: '90px', resize: 'vertical' }}
                                        value={formData.notes || ''}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="프로젝트 진행 상황이나 주요 변경 사항을 기록하세요..." />
                                </div>

                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h4 style={{ margin: '0 0 0.75rem 0', color: '#818cf8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Save size={14} /> 상태별 상세 날짜 기록
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                        {['견적제출중', '업체미선정', '착수완료 진행', '완료 마감 대기', '세금계산서 발행 완료', '수금 완료', '무상작업'].map(status => (
                                            <div key={status} className="input-group" style={{ marginBottom: '0.25rem' }}>
                                                <label style={{ fontSize: '0.72rem', color: formData.status === status ? '#818cf8' : '#94a3b8' }}>{status}</label>
                                                <input type="text" className="input-field"
                                                    style={{ padding: '0.35rem 0.7rem', fontSize: '0.82rem', borderColor: formData.status === status ? 'rgba(129,140,248,0.4)' : '' }}
                                                    placeholder="YYYY.MM.DD"
                                                    value={(formData.statusDates && formData.statusDates[status]) || ''}
                                                    onChange={(e) => handleDateChange(status, e.target.value)}
                                                    maxLength={10} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 하단 버튼 */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '2rem', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
                            {editingItemId && user.role === 'admin' && (
                                <button type="button" onClick={(e) => { handleDeleteItem(e, editingItemId, formData.customer); setIsModalOpen(false); }} className="btn btn-ghost" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', marginRight: 'auto' }} disabled={isSaving}>
                                    <Trash2 size={16} /> 기록 삭제
                                </button>
                            )}
                            {/* 거래명세서 버튼 */}
                            {editingItemId && (formData.project || formData.customer) && (
                                <button
                                    type="button"
                                    onClick={() => setShowDeliveryNote(true)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.45rem',
                                        background: 'rgba(16,185,129,0.12)',
                                        border: '1px solid rgba(16,185,129,0.4)',
                                        color: '#10b981', borderRadius: '10px',
                                        padding: '0.55rem 1.1rem', cursor: 'pointer',
                                        fontSize: '0.85rem', fontWeight: '700',
                                    }}
                                    disabled={isSaving}
                                >
                                    <Printer size={15} /> 거래명세서 출력
                                </button>
                            )}
                            <div style={{ display: 'flex', gap: '0.8rem' }}>
                                <button type="button" onClick={() => { setIsModalOpen(false); setEditingItemId(null); }} className="btn btn-ghost" disabled={isSaving}>취소</button>
                                <button type="submit" className="btn btn-primary" style={{ minWidth: '140px', opacity: isSaving ? 0.8 : 1 }} disabled={isSaving}>
                                    {isSaving ? '데이터 동기화 중...' : (editingItemId ? '수정 완료 및 저장' : '새 프로젝트 등록')}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            {/* 거래명세서 모달 */}
            {showDeliveryNote && (
                <DeliveryNoteModal
                    formData={formData}
                    onClose={() => setShowDeliveryNote(false)}
                />
            )}
        </>
    );
};
export default ProjectModal;
