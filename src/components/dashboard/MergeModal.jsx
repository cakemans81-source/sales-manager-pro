import React, { useState, useEffect } from 'react';
import { X, GitMerge } from 'lucide-react';

const STATUSES = ['견적제출중', '업체미선정', '착수완료 진행', '완료 마감 대기', '세금계산서 발행 완료', '수금 완료', '무상작업'];

const MergeModal = ({ isOpen, onClose, selectedProjects = [], onConfirm }) => {
    const totalEstimate = selectedProjects.reduce((s, p) => s + (Number(p.estimateAmount) || 0), 0);
    const totalRevenue = selectedProjects.reduce((s, p) =>
        s + Number((p.discountAmount > 0 ? p.discountAmount : p.estimateAmount) || 0), 0);
    const customer = selectedProjects[0]?.customer || '';

    const [form, setForm] = useState({
        projectName: '',
        estimateAmount: '',
        discountAmount: '',
        status: '완료 마감 대기',
        note: '',
    });

    // 모달 열릴 때마다 폼 초기화
    useEffect(() => {
        if (isOpen && selectedProjects.length > 0) {
            setForm({
                projectName: `${customer} 통합 마감 (${selectedProjects.length}건)`,
                estimateAmount: String(totalRevenue),
                discountAmount: '',
                status: '완료 마감 대기',
                note: selectedProjects.map(p => p.project).filter(Boolean).join(' / '),
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const fmt = v => `₩${Number(v).toLocaleString('ko-KR')}`;
    const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '0.6rem 0.85rem', color: '#f1f5f9', fontSize: '0.88rem', boxSizing: 'border-box', outline: 'none' };
    const labelStyle = { fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700', display: 'block', marginBottom: '0.35rem' };

    return (
        <div
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{ background: '#0f172a', border: '1px solid rgba(99,102,241,0.35)', borderRadius: '18px', padding: '2rem', width: '100%', maxWidth: '580px', maxHeight: '88vh', overflowY: 'auto' }}
            >
                {/* 헤더 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, color: '#f1f5f9', fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <GitMerge size={20} color="#818cf8" /> 프로젝트 병합
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* 병합 대상 목록 */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        병합할 프로젝트 ({selectedProjects.length}건)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', background: 'rgba(99,102,241,0.05)', borderRadius: '12px', padding: '0.75rem', border: '1px solid rgba(99,102,241,0.15)' }}>
                        {selectedProjects.map((p) => (
                            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.3rem 0.6rem', background: 'rgba(255,255,255,0.04)', borderRadius: '7px', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '500', flex: 1 }}>{p.project || '(프로젝트명 없음)'}</span>
                                <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: '700', flexShrink: 0 }}>
                                    {fmt((p.discountAmount > 0 ? p.discountAmount : p.estimateAmount) || 0)}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1.2rem', marginTop: '0.4rem', fontSize: '0.75rem', color: '#64748b' }}>
                        <span>견적 합계: <strong style={{ color: '#38bdf8' }}>{fmt(totalEstimate)}</strong></span>
                        <span>실 매출 합계: <strong style={{ color: '#34d399' }}>{fmt(totalRevenue)}</strong></span>
                    </div>
                </div>

                {/* 폼 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={labelStyle}>통합 프로젝트명 *</label>
                        <input value={form.projectName} onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))} style={inputStyle} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                            <label style={labelStyle}>통합 견적금액</label>
                            <input
                                value={form.estimateAmount ? Number(form.estimateAmount).toLocaleString('ko-KR') : ''}
                                onChange={e => setForm(f => ({ ...f, estimateAmount: e.target.value.replace(/[^0-9]/g, '') }))}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>합의 금액 (인하 후)</label>
                            <input
                                value={form.discountAmount ? Number(form.discountAmount).toLocaleString('ko-KR') : ''}
                                onChange={e => setForm(f => ({ ...f, discountAmount: e.target.value.replace(/[^0-9]/g, '') }))}
                                placeholder="없으면 빈칸"
                                style={inputStyle}
                            />
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>진행 상태</label>
                        <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                            style={{ ...inputStyle, background: '#1e293b' }}>
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>메모</label>
                        <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                            rows={2}
                            style={{ ...inputStyle, resize: 'vertical' }} />
                    </div>
                </div>

                {/* 버튼 */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <button onClick={onClose}
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: '10px', padding: '0.6rem 1.3rem', cursor: 'pointer', fontSize: '0.88rem', fontWeight: '600' }}>
                        취소
                    </button>
                    <button
                        onClick={() => { if (form.projectName.trim()) onConfirm(form); }}
                        disabled={!form.projectName.trim()}
                        style={{ background: form.projectName.trim() ? 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)' : 'rgba(99,102,241,0.3)', border: 'none', color: '#fff', borderRadius: '10px', padding: '0.6rem 1.5rem', cursor: form.projectName.trim() ? 'pointer' : 'not-allowed', fontSize: '0.88rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: form.projectName.trim() ? '0 0 16px rgba(99,102,241,0.4)' : 'none' }}>
                        <GitMerge size={16} /> 병합 실행
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MergeModal;
