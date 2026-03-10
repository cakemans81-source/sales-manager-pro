import React, { useState } from 'react';
import { X, Printer, Plus, Trash2 } from 'lucide-react';

// ── 회사별 정보 ──────────────────────────────────────
const COMPANY_INFO = {
    '(주)이루': {
        name: '(주)이루',
        ceo: '이광수',
        bizNo: '380-87-02545',
        address: '경기도 화성시 만세구 팔탄면 밤뒤길 9, 비동',
        tel: '',
        fax: '',
        email: 'iru@iru.co.kr',
        color: '#6366f1',
        accentBg: '#f0f0ff',
    },
    '(주)가치': {
        name: '(주)가치',
        ceo: '이지안',
        bizNo: '739-87-02183',
        address: '경기도 화성시 만세구 팔탄면 밤뒤길 9, 에이동',
        tel: '',
        fax: '',
        email: 'gachi@iru.co.kr',
        color: '#f59e0b',
        accentBg: '#fffbeb',
    },
};

const formatKRW = (n) => {
    const num = Number(n) || 0;
    return num.toLocaleString('ko-KR');
};

const today = () => {
    const d = new Date();
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
};



// ── 거래명세서 출력 영역 컴포넌트 ──────────────────────
const DeliveryNoteDocument = ({ formData, items, issueDate }) => {
    const company = formData.company || '(주)이루';
    const info = COMPANY_INFO[company] || COMPANY_INFO['(주)이루'];
    const color = info.color;

    const totalSupply = items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0);
    const totalVat = Math.round(totalSupply * 0.1);
    const grandTotal = totalSupply + totalVat;

    return (
        <div id="delivery-note-print-area" style={{
            background: '#fff', color: '#111',
            width: '100%', maxWidth: '740px',
            padding: '16px 20px',
            fontFamily: "'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif",
            fontSize: '10px',
            lineHeight: '1.4',
            boxSizing: 'border-box',
        }}>
            {/* 제목 */}
            <div style={{
                textAlign: 'center', marginBottom: '8px',
                borderBottom: `2px solid ${color}`, paddingBottom: '5px',
            }}>
                <h1 style={{
                    fontSize: '20px', fontWeight: '900', letterSpacing: '0.3em',
                    color: '#111', margin: '0 0 2px 0',
                }}>거 래 명 세 서</h1>
                <p style={{ margin: 0, fontSize: '9px', color: '#555' }}>
                    발행일: {issueDate || today()}
                </p>
            </div>

            {/* 공급자 + 공급받는자 2단 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                {/* 공급받는자 (왼쪽) */}
                <div style={{ border: '1px solid #ccc', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ background: '#f3f4f6', padding: '3px 8px', fontWeight: '800', fontSize: '10px', borderBottom: '1px solid #ccc', color: '#333' }}>
                        □ 공급받는자
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5px' }}>
                        <tbody>
                            {[
                                ['상호', formData.customer || ''],
                                ['담당자', `${formData.customerContact || ''} ${formData.customerPosition ? `(${formData.customerPosition})` : ''}`],
                                ['연락처', formData.customerPhone || ''],
                            ].map(([label, value]) => (
                                <tr key={label}>
                                    <td style={{ padding: '3px 6px', background: '#fafafa', fontWeight: '700', width: '28%', borderBottom: '1px solid #eee', color: '#555' }}>{label}</td>
                                    <td style={{ padding: '3px 6px', borderBottom: '1px solid #eee' }}>{value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 공급자 (오른쪽) */}
                <div style={{ border: `1px solid ${color}55`, borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ background: `${color}15`, padding: '3px 8px', fontWeight: '800', fontSize: '10px', borderBottom: `1px solid ${color}44`, color: color }}>
                        □ 공급자 (발행사)
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5px' }}>
                        <tbody>
                            {[
                                ['상호', info.name],
                                ['대표이사', info.ceo],
                                ['사업자번호', info.bizNo],
                                ['주소', info.address],
                                info.tel ? ['전화', info.tel] : null,
                                ['이메일', info.email],
                            ].filter(Boolean).map(([label, value]) => (
                                <tr key={label}>
                                    <td style={{ padding: '3px 6px', background: '#fafafa', fontWeight: '700', width: '28%', borderBottom: '1px solid #eee', color: '#555' }}>{label}</td>
                                    <td style={{ padding: '3px 6px', borderBottom: '1px solid #eee' }}>{value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 프로젝트 */}
            <div style={{ background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '3px', padding: '4px 10px', marginBottom: '6px', fontSize: '10px' }}>
                <strong>건명:</strong> {formData.project || '–'}
            </div>

            {/* 품목 테이블 */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px', fontSize: '9.5px' }}>
                <thead>
                    <tr style={{ background: color, color: '#fff' }}>
                        {['No', '품목 / 서비스 내용', '수량', '단가 (원)', '금액 (원)', '비고'].map((h, i) => (
                            <th key={h} style={{
                                padding: '4px 6px', textAlign: 'center', fontWeight: '800',
                                borderRight: '1px solid rgba(255,255,255,0.3)',
                                width: i === 0 ? '4%' : i === 1 ? '38%' : i === 5 ? '12%' : '14%',
                            }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => {
                        const amt = (Number(item.qty) || 0) * (Number(item.unitPrice) || 0);
                        return (
                            <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                <td style={{ padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #e5e7eb', color: '#777' }}>{idx + 1}</td>
                                <td style={{ padding: '4px 8px', borderRight: '1px solid #e5e7eb' }}>{item.name || ''}</td>
                                <td style={{ padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #e5e7eb' }}>{item.qty || ''}</td>
                                <td style={{ padding: '4px 6px', textAlign: 'right', borderRight: '1px solid #e5e7eb' }}>{item.unitPrice ? formatKRW(item.unitPrice) : ''}</td>
                                <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: '700', borderRight: '1px solid #e5e7eb' }}>{amt > 0 ? formatKRW(amt) : ''}</td>
                                <td style={{ padding: '4px 6px', textAlign: 'center', color: '#666' }}>{item.note || ''}</td>
                            </tr>
                        );
                    })}
                    {/* 빈 행 채우기 (최소 5행 보장) */}
                    {Array.from({ length: Math.max(0, 5 - items.length) }).map((_, i) => (
                        <tr key={`empty-${i}`} style={{ borderBottom: '1px solid #e5e7eb', height: '20px' }}>
                            {Array(6).fill(null).map((__, j) => (
                                <td key={j} style={{ borderRight: '1px solid #e5e7eb' }}>&nbsp;</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* 합계 박스 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: '10px', minWidth: '260px' }}>
                    <tbody>
                        {[
                            ['공급가액 (합계)', formatKRW(totalSupply)],
                            ['부가세 (10%)', formatKRW(totalVat)],
                        ].map(([label, value]) => (
                            <tr key={label}>
                                <td style={{ padding: '4px 12px', background: '#f3f4f6', fontWeight: '700', borderBottom: '1px solid #ddd', borderLeft: '1px solid #ddd', borderTop: '1px solid #ddd', color: '#555' }}>{label}</td>
                                <td style={{ padding: '4px 14px', textAlign: 'right', borderBottom: '1px solid #ddd', borderRight: '1px solid #ddd', borderTop: '1px solid #ddd' }}>{value} 원</td>
                            </tr>
                        ))}
                        <tr>
                            <td style={{ padding: '5px 12px', background: color, color: '#fff', fontWeight: '900', fontSize: '11px', border: `2px solid ${color}` }}>합계 금액</td>
                            <td style={{ padding: '5px 14px', textAlign: 'right', fontWeight: '900', fontSize: '12px', color: color, border: `2px solid ${color}` }}>
                                ₩ {formatKRW(grandTotal)} 원
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* 서명칸 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
                {/* 공급자 서명 */}
                <div style={{ border: `1px solid ${color}55`, borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ background: `${color}15`, padding: '4px 10px', fontWeight: '800', fontSize: '10px', color: color, borderBottom: `1px solid ${color}33` }}>
                        공급자 (발행인) 확인
                    </div>
                    <div style={{ padding: '8px 10px' }}>
                        <div style={{ fontSize: '9.5px', marginBottom: '2px' }}>
                            <strong>상호:</strong> {info.name}
                        </div>
                        <div style={{ fontSize: '9.5px', marginBottom: '8px' }}>
                            <strong>대표:</strong> {info.ceo}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', gap: '6px' }}>
                            <span style={{ fontSize: '9px', color: '#777' }}>서명 또는 인 :</span>
                            <div style={{
                                width: '55px', height: '55px',
                                border: `1px dashed ${color}88`,
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: `${color}55`, fontSize: '9px',
                            }}>(인)</div>
                        </div>
                    </div>
                </div>

                {/* 공급받는자 서명 */}
                <div style={{ border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ background: '#f3f4f6', padding: '4px 10px', fontWeight: '800', fontSize: '10px', color: '#555', borderBottom: '1px solid #ddd' }}>
                        공급받는자 (수령인) 확인
                    </div>
                    <div style={{ padding: '8px 10px' }}>
                        <div style={{ fontSize: '9.5px', marginBottom: '2px' }}>
                            <strong>상호:</strong> {formData.customer || '__________________'}
                        </div>
                        <div style={{ fontSize: '9.5px', marginBottom: '8px' }}>
                            <strong>담당자:</strong> {formData.customerContact || '__________________'}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', gap: '6px' }}>
                            <span style={{ fontSize: '9px', color: '#777' }}>서명 또는 인 :</span>
                            <div style={{
                                width: '55px', height: '55px',
                                border: '1px dashed #bbb',
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#bbb', fontSize: '9px',
                            }}>(인)</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 하단 */}
            <div style={{ marginTop: '14px', textAlign: 'center', fontSize: '9px', color: '#aaa', borderTop: '1px solid #eee', paddingTop: '8px' }}>
                본 거래명세서는 {info.name}이 발행하였습니다.{info.tel ? ` | ${info.tel}` : ''} | {info.email}
            </div>
        </div>
    );
};

// ── 메인 모달 ────────────────────────────────────────
const DeliveryNoteModal = ({ formData, onClose }) => {
    const [issueDate, setIssueDate] = useState(today());
    const [items, setItems] = useState(() => {
        // 프로젝트 데이터에서 기본 품목 1개 자동 생성
        const amount = formData.discountAmount > 0 ? formData.discountAmount : (formData.estimateAmount || 0);
        return [{
            name: formData.project || '',
            qty: 1,
            unitPrice: amount,
            note: '',
        }];
    });

    const addItem = () => setItems(prev => [...prev, { name: '', qty: 1, unitPrice: 0, note: '' }]);
    const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));
    const updateItem = (idx, field, value) => {
        setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
    };

    const handlePrint = () => {
        // 인쇄할 DOM 노드
        const el = document.getElementById('delivery-note-print-area');
        if (!el) return;

        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) return;

        printWindow.document.write(`
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>거래명세서</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 210mm;
      background: #fff;
      font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
    }
    body {
      padding: 10mm 12mm;
      font-size: 10px;
      line-height: 1.4;
      color: #111;
    }
    @page { size: A4 portrait; margin: 0; }
    @media print {
      html, body { width: 210mm; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  </style>
</head>
<body>
  ${el.outerHTML}
</body>
</html>
        `);
        printWindow.document.close();

        // 폰트/이미지 로드 후 인쇄
        printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        };
    };

    const company = formData.company || '(주)이루';
    const info = COMPANY_INFO[company] || COMPANY_INFO['(주)이루'];
    const color = info.color;

    return (
        <>
            {/* 오버레이 (인쇄 시 숨김) */}
            <div className="modal-overlay" style={{ zIndex: 9999 }}>
                <div className="modal-content glass animate-fade" style={{
                    width: 'min(900px, 97vw)',
                    maxHeight: '95vh', overflowY: 'auto',
                    background: 'rgba(15, 23, 42, 0.98)',
                    border: `1px solid ${color}44`,
                }}>
                    {/* 헤더 */}
                    <div className="modal-header" style={{ borderBottom: `2px solid ${color}33` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{
                                background: `${color}22`, border: `1px solid ${color}55`,
                                borderRadius: '8px', padding: '5px 12px',
                                color: color, fontWeight: '900', fontSize: '0.9rem',
                            }}>거래명세서 출력</div>
                            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{company}</span>
                        </div>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X /></button>
                    </div>

                    <div style={{ padding: '1.25rem' }}>
                        {/* 발행일 + 품목 편집 영역 */}
                        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.2rem', marginBottom: '1.2rem', alignItems: 'start' }}>
                            {/* 좌측: 발행일 */}
                            <div>
                                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.78rem', marginBottom: '5px' }}>발행일</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={issueDate}
                                    onChange={e => setIssueDate(e.target.value)}
                                    style={{ fontSize: '0.85rem' }}
                                />
                                <div style={{ marginTop: '1rem', background: `${color}10`, border: `1px solid ${color}33`, borderRadius: '8px', padding: '0.8rem' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: '700' }}>공급자</div>
                                    <div style={{ color: color, fontWeight: '800', fontSize: '0.9rem' }}>{info.name}</div>
                                    <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '2px' }}>대표: {info.ceo}</div>
                                    <div style={{ color: '#64748b', fontSize: '0.72rem' }}>사업자번호: {info.bizNo}</div>
                                </div>
                            </div>

                            {/* 우측: 품목 입력 */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                                    <label style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: '700' }}>품목 내용 편집</label>
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: `${color}22`, border: `1px solid ${color}55`, color: color, borderRadius: '7px', padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '700' }}
                                    ><Plus size={12} /> 품목 추가</button>
                                </div>
                                <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                        <thead>
                                            <tr style={{ background: `${color}22` }}>
                                                {['품목 / 내용', '수량', '단가 (원)', '금액', '비고', ''].map(h => (
                                                    <th key={h} style={{ padding: '7px 8px', color: color, fontWeight: '800', textAlign: h === '금액' || h === '단가 (원)' ? 'right' : 'left', whiteSpace: 'nowrap', borderBottom: `1px solid ${color}33` }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <td style={{ padding: '5px 6px' }}>
                                                        <input value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)}
                                                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', borderRadius: '5px', padding: '4px 7px', width: '100%', fontSize: '0.8rem' }} />
                                                    </td>
                                                    <td style={{ padding: '5px 6px', width: '55px' }}>
                                                        <input type="number" value={item.qty} onChange={e => updateItem(idx, 'qty', e.target.value)}
                                                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', borderRadius: '5px', padding: '4px 5px', width: '100%', fontSize: '0.8rem', textAlign: 'center' }} />
                                                    </td>
                                                    <td style={{ padding: '5px 6px', width: '120px' }}>
                                                        <input type="number" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                                                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', borderRadius: '5px', padding: '4px 7px', width: '100%', fontSize: '0.8rem', textAlign: 'right' }} />
                                                    </td>
                                                    <td style={{ padding: '5px 8px', textAlign: 'right', color: color, fontWeight: '700', whiteSpace: 'nowrap' }}>
                                                        {Number(item.qty) * Number(item.unitPrice) > 0
                                                            ? `₩${formatKRW(Number(item.qty) * Number(item.unitPrice))}`
                                                            : '-'}
                                                    </td>
                                                    <td style={{ padding: '5px 6px', width: '90px' }}>
                                                        <input value={item.note || ''} onChange={e => updateItem(idx, 'note', e.target.value)}
                                                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', borderRadius: '5px', padding: '4px 7px', width: '100%', fontSize: '0.8rem' }} />
                                                    </td>
                                                    <td style={{ padding: '5px 6px', width: '30px', textAlign: 'center' }}>
                                                        {items.length > 1 && (
                                                            <button type="button" onClick={() => removeItem(idx)}
                                                                style={{ background: 'rgba(239,68,68,0.15)', border: 'none', color: '#ef4444', borderRadius: '4px', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <Trash2 size={11} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* 합계 미리보기 */}
                                {(() => {
                                    const supply = items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0);
                                    const vat = Math.round(supply * 0.1);
                                    return (
                                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.6rem', justifyContent: 'flex-end', fontSize: '0.82rem' }}>
                                            <span style={{ color: '#94a3b8' }}>공급가: <strong style={{ color: '#f1f5f9' }}>₩{formatKRW(supply)}</strong></span>
                                            <span style={{ color: '#94a3b8' }}>VAT: <strong style={{ color: '#f1f5f9' }}>₩{formatKRW(vat)}</strong></span>
                                            <span style={{ color: color, fontWeight: '900' }}>합계: ₩{formatKRW(supply + vat)}</span>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* 출력 버튼 */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                            <button
                                type="button"
                                onClick={handlePrint}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    background: color, border: 'none', color: '#fff',
                                    borderRadius: '10px', padding: '0.65rem 1.6rem',
                                    cursor: 'pointer', fontSize: '0.9rem', fontWeight: '800',
                                    boxShadow: `0 4px 16px ${color}55`,
                                }}
                            ><Printer size={16} /> 거래명세서 인쇄 / PDF 저장</button>
                        </div>

                        {/* 미리보기 */}
                        <div style={{ border: `2px solid ${color}33`, borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
                            <div style={{ background: `${color}15`, padding: '6px 14px', fontSize: '0.75rem', color: color, fontWeight: '700', borderBottom: `1px solid ${color}22` }}>
                                미리보기
                            </div>
                            <div style={{ padding: '0', overflowX: 'auto' }}>
                                <DeliveryNoteDocument
                                    formData={formData}
                                    items={items}
                                    issueDate={issueDate}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DeliveryNoteModal;
