import React, { memo, useState, useEffect } from 'react';
import { FileSpreadsheet, Upload, Download, FileText, Database, Plus, Trash2, ChevronUp, ChevronDown, X, Image, Star } from 'lucide-react';
import { formatDate } from '../../lib/dateUtils';

// ─────────────────────────────────────────────────────────
// PhotoViewerModal: 다중 제품 사진 팝업 뷰어
// ─────────────────────────────────────────────────────────
const PhotoViewerModal = ({ photos, onClose, title = "최종 제품 사진" }) => {
    if (!photos || photos.length === 0) return null;
    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.82)',
                backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '2rem',
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    width: '100%',
                    maxWidth: '820px',
                    maxHeight: '85vh',
                    overflowY: 'auto',
                    position: 'relative',
                }}
            >
                {/* 헤더 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                    <h3 style={{ margin: 0, color: '#f1f5f9', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Image size={18} color="#f59e0b" /> {title}
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '400' }}>({photos.length}장)</span>
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                            color: '#ef4444', borderRadius: '8px', padding: '0.35rem 0.8rem',
                            cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600',
                            display: 'flex', alignItems: 'center', gap: '0.3rem'
                        }}
                    >
                        <X size={14} /> 닫기
                    </button>
                </div>

                {/* 사진 그리드 */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: '0.8rem'
                }}>
                    {photos.map((url, idx) => (
                        <div key={idx} style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(0,0,0,0.2)' }}>
                            <img
                                src={url}
                                alt={`제품사진 ${idx + 1}`}
                                style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block', cursor: 'zoom-in' }}
                                onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                                title="클릭하면 원본 크기로 새 창에서 열립니다"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────
// 첨부파일 배지 버튼 스타일 공통
// ─────────────────────────────────────────────────────────
const badgeBtn = (color, bg, border) => ({
    display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
    padding: '0.18rem 0.45rem',
    background: bg, border: `1px solid ${border}`,
    color, borderRadius: '5px', cursor: 'pointer',
    fontSize: '0.68rem', fontWeight: '600',
    whiteSpace: 'nowrap', lineHeight: 1.4,
});

// ─────────────────────────────────────────────────────────
// TableRow: React.memo로 감싸서 props가 바뀐 행만 재렌더링
// ─────────────────────────────────────────────────────────
// 상태별 날짜 표시 순서 및 라벨
const STATUS_DATE_LABELS = [
    { key: '견적제출중', label: '견적제출' },
    { key: '업체미선정', label: '미선정' },
    { key: '착수완료 진행', label: '착수' },
    { key: '완료 마감 대기', label: '마감대기' },
    { key: '세금계산서 발행 완료', label: '세금계산서' },
    { key: '수금 완료', label: '수금' },
    { key: '무상작업', label: '무상' },
];

const STATUS_COLORS = {
    '견적제출중': { bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.35)', text: '#fb923c' },
    '업체미선정': { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', text: '#f87171' },
    '착수완료 진행': { bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.35)', text: '#38bdf8' },
    '완료 마감 대기': { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.35)', text: '#a855f7' },
    '세금계산서 발행 완료': { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)', text: '#10b981' },
    '수금 완료': { bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.4)', text: '#34d399' },
    '무상작업': { bg: 'rgba(100,116,139,0.15)', border: 'rgba(100,116,139,0.35)', text: '#94a3b8' },
};

const TableRow = memo(({ item, isSelected, statusFilter, onOpen, onToggle, onDelete, userRole, onShowPhotos, rowIndex, onToggleStar }) => {
    const photos = Array.isArray(item.finalProductPhotos) ? item.finalProductPhotos : [];
    const taxInvoices = Array.isArray(item.taxInvoiceImages) ? item.taxInvoiceImages : [];
    const hasAnyAttachment = item.quotePdfUrl || item.mailPdfUrl || photos.length > 0 || taxInvoices.length > 0;
    const sc = STATUS_COLORS[item.status] || { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.3)', text: '#818cf8' };

    const revenue = item.discountAmount > 0 ? item.discountAmount : item.estimateAmount || 0;
    const hasDiscount = item.discountAmount > 0 && item.estimateAmount > 0 && item.discountAmount !== item.estimateAmount;

    // 이 행의 배경 (교대색)
    const rowBg = rowIndex % 2 === 0 ? 'rgba(15,23,42,0.0)' : 'rgba(255,255,255,0.018)';

    return (
        <tr
            onClick={() => onOpen(item)}
            style={{
                cursor: 'pointer',
                background: isSelected ? 'rgba(99,102,241,0.12)' : item.isStarred ? 'rgba(245,158,11,0.04)' : rowBg,
                transition: 'background 0.15s',
                borderLeft: item.isStarred ? '3px solid rgba(245,158,11,0.7)' : '3px solid transparent',
            }}
            className={`table-row-hover ${isSelected ? 'selected-row' : ''}`}
        >
            <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', verticalAlign: 'middle', padding: '0.5rem 0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'center' }}>
                    <input type="checkbox" checked={isSelected} onChange={(e) => onToggle(e, item.id)} onClick={(e) => e.stopPropagation()} />
                    <span style={{ fontSize: '0.68rem', color: '#475569', fontWeight: '600', minWidth: '18px', textAlign: 'right' }}>{rowIndex}</span>
                </div>
            </td>

            {/* ② 등록일 */}
            <td style={{ padding: '0.45rem 0.4rem', verticalAlign: 'middle', textAlign: 'center', minWidth: '62px' }}>
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleStar(item.id); }}
                    title={item.isStarred ? '별표 해제' : '별표 (팀원 → 관리자 요청)'}
                    onMouseEnter={e => { if (!item.isStarred) e.currentTarget.style.color = 'rgba(245,158,11,0.7)'; }}
                    onMouseLeave={e => { if (!item.isStarred) e.currentTarget.style.color = 'rgba(148,163,184,0.45)'; }}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '0 0 0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.2rem',
                        color: item.isStarred ? '#f59e0b' : 'rgba(148,163,184,0.45)',
                        filter: item.isStarred ? 'drop-shadow(0 0 6px rgba(245,158,11,0.6))' : 'none',
                        transition: 'all 0.2s', margin: '0 auto',
                    }}
                >
                    <Star size={13} fill={item.isStarred ? '#f59e0b' : 'none'} stroke="currentColor" strokeWidth={1.8} />
                </button>
                <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '500' }}>
                    {formatDate(item.date)}
                </div>
            </td>

            {/* ③~⑨ 상태별 날짜 컬럼 (각각 분리) */}
            {STATUS_DATE_LABELS.map(({ key, label }) => {
                const dateVal = item.statusDates && item.statusDates[key];
                const isCurrent = item.status === key;
                return (
                    <td key={key} style={{
                        padding: '0.4rem 0.3rem',
                        verticalAlign: 'middle',
                        textAlign: 'center',
                        minWidth: '58px',
                        background: isCurrent ? 'rgba(99,102,241,0.07)' : 'transparent',
                    }}>
                        {dateVal ? (
                            <span style={{
                                fontSize: '0.68rem',
                                color: isCurrent ? '#a5b4fc' : '#64748b',
                                fontWeight: isCurrent ? '700' : '500',
                                background: isCurrent ? 'rgba(99,102,241,0.15)' : 'transparent',
                                borderRadius: '4px',
                                padding: isCurrent ? '1px 3px' : '0',
                                display: 'inline-block',
                                letterSpacing: '-0.01em',
                            }}>{dateVal}</span>
                        ) : (
                            <span style={{ color: '#243044', fontSize: '0.6rem' }}>–</span>
                        )}
                    </td>
                );
            })}

            {/* ③ 업체명 */}
            <td style={{ padding: '0.5rem 0.5rem', verticalAlign: 'middle' }}>
                <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#f1f5f9', lineHeight: 1.3 }}>{item.customer}</div>
            </td>

            {/* ④ 고객사 담당자 + 직급 + 연락처 통합 */}
            <td style={{ padding: '0.5rem 0.45rem', verticalAlign: 'middle', minWidth: '115px' }}>
                {item.customerContact ? (
                    <div>
                        <div style={{ fontWeight: '600', fontSize: '0.84rem', color: '#e2e8f0' }}>{item.customerContact}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' }}>
                            {item.customerPosition ? <span style={{ marginRight: '0.4rem' }}>{item.customerPosition}</span> : null}
                            {item.customerPhone ? <span>{item.customerPhone}</span> : null}
                        </div>
                    </div>
                ) : <span style={{ color: '#334155', fontSize: '0.78rem' }}>-</span>}
            </td>

            {/* ⑤ 담당요원 */}
            <td style={{ padding: '0.5rem 0.45rem', verticalAlign: 'middle' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '500' }}>{item.representative || '-'}</span>
            </td>

            {/* ⑥ 프로젝트명 */}
            <td style={{ padding: '0.5rem 0.5rem', verticalAlign: 'middle', maxWidth: '240px' }}>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '500', lineHeight: 1.4, wordBreak: 'keep-all' }}>{item.project}</div>
            </td>

            {/* ⑦ 금액 */}
            <td style={{ padding: '0.5rem 0.5rem', verticalAlign: 'middle', textAlign: 'right', minWidth: '110px' }}>
                <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#34d399', letterSpacing: '-0.02em' }}>
                    ₩{revenue.toLocaleString('ko-KR')}
                </div>
                {hasDiscount && (
                    <div style={{ fontSize: '0.68rem', color: '#475569', textDecoration: 'line-through', marginTop: '0.1rem' }}>
                        ₩{item.estimateAmount.toLocaleString('ko-KR')}
                    </div>
                )}
            </td>

            {/* ⑧ 상태 배지 */}
            <td style={{ padding: '0.5rem 0.45rem', verticalAlign: 'middle' }}>
                <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '0.3rem 0.65rem',
                    background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text,
                    borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700',
                    whiteSpace: 'nowrap', letterSpacing: '0.01em',
                }}>
                    {item.status}
                </span>
            </td>

            {/* ⑨ 첨부파일 */}
            <td style={{ padding: '0.5rem 0.4rem', textAlign: 'center', verticalAlign: 'middle' }} onClick={(e) => e.stopPropagation()}>
                {hasAnyAttachment ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.28rem', justifyContent: 'center' }}>
                        {item.quotePdfUrl && (
                            <button style={badgeBtn('#10b981', 'rgba(16,185,129,0.12)', 'rgba(16,185,129,0.35)')}
                                onClick={() => window.open(item.quotePdfUrl, '_blank', 'noopener,noreferrer')} title="견적서 PDF">
                                📄 견적서
                            </button>
                        )}
                        {item.mailPdfUrl && (
                            <button style={badgeBtn('#818cf8', 'rgba(99,102,241,0.12)', 'rgba(99,102,241,0.35)')}
                                onClick={() => window.open(item.mailPdfUrl, '_blank', 'noopener,noreferrer')} title="메일 PDF">
                                📧 메일
                            </button>
                        )}
                        {photos.length > 0 && (
                            <button style={badgeBtn('#f59e0b', 'rgba(245,158,11,0.12)', 'rgba(245,158,11,0.35)')}
                                onClick={() => onShowPhotos(photos, "제품 사진")} title={`사진 ${photos.length}장`}>
                                🖼️ {photos.length > 1 ? `${photos.length}장` : '사진'}
                            </button>
                        )}
                        {taxInvoices.length > 0 && (
                            <button style={badgeBtn('#ec4899', 'rgba(236,72,153,0.12)', 'rgba(236,72,153,0.35)')}
                                onClick={() => onShowPhotos(taxInvoices, "세금계산서")} title={`세금계산서 ${taxInvoices.length}장`}>
                                🧾 {taxInvoices.length > 1 ? `계산서 ${taxInvoices.length}장` : '계산서'}
                            </button>
                        )}
                    </div>
                ) : (
                    <span style={{ color: '#334155', fontSize: '0.72rem' }}>-</span>
                )}
            </td>

            {/* ⑩ 삭제 */}
            <td style={{ padding: '0.5rem 0.4rem', textAlign: 'center', verticalAlign: 'middle' }}>
                {userRole === 'admin' && (
                    <button className="btn-icon reject"
                        onClick={(e) => onDelete(e, item.id, item.customer)}
                        style={{ padding: '0.3rem', borderRadius: '6px' }} title="기록 영구 삭제">
                        <Trash2 size={16} />
                    </button>
                )}
            </td>
        </tr>
    );
});
TableRow.displayName = 'TableRow';

// ─────────────────────────────────────────────────────────
// StatusTab: 테이블 헤더/액션바만 담당, 행은 TableRow에 위임
// ─────────────────────────────────────────────────────────
const StatusTab = ({
    canEdit,
    downloadTemplate,
    handleExcelUpload,
    exportToExcel,
    exportToPDF,
    fetchSalesData,
    setIsModalOpen,
    selectedIds,
    handleBulkDelete,
    salesData,
    config,
    toggleAllSelection,
    toggleSelection,
    openEditModal,
    handleDeleteItem,
    user,
    statusFilter,
    setStatusFilter,
    hideFilter = false,
    sortConfig,
    requestSort,
    isPending,
    yearFilter,
    setYearFilter,
    availableYears = [],
    statusDateKey = null,
    setSelectedIds,    // displayData 기준 전체선택 제어용
    onToggleStar,      // (id) => void  별표 토글
}) => {
    const statuses = ['전체', '견적제출중', '업체미선정', '착수완료 진행', '완료 마감 대기', '세금계산서 발행 완료', '수금 완료', '무상작업'];
    const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const PAGE_SIZE = 20;

    // 사진 뷰어 모달 상태
    const [viewerPhotos, setViewerPhotos] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [monthFilter, setMonthFilter] = useState('전체');

    // 연도 변경 시 월 필터 리셋
    useEffect(() => { setMonthFilter('전체'); }, [yearFilter]);

    // 필터/정렬/데이터 변경 시 첫 페이지로 리셋
    useEffect(() => {
        setCurrentPage(1);
    }, [salesData.length, statusFilter, sortConfig, monthFilter]);

    // 탭별 날짜 기준:
    // 1) statusDateKey가 명시된 경우 우선 (개별 상태 탭)
    // 2) statusFilter가 '전체'가 아니면 해당 상태의 statusDates 기준 (통합현황 탭)
    // 3) 그 외 item.date (등록일)
    const getItemDate = (item) => {
        if (statusDateKey && item.statusDates?.[statusDateKey]) {
            return String(item.statusDates[statusDateKey]);
        }
        if (statusFilter && statusFilter !== '전체' && item.statusDates?.[statusFilter]) {
            return String(item.statusDates[statusFilter]);
        }
        return String(item.date || '');
    };

    // 월 필터 적용 (날짜 형식: YYYY.MM.DD)
    const displayData = monthFilter === '전체'
        ? salesData
        : salesData.filter(item => {
            const d = getItemDate(item);
            if (!d) return false;
            const parts = d.split('.');
            const m = parseInt(parts[1], 10);
            return m === parseInt(monthFilter, 10);
        });

    const totalPages = Math.max(1, Math.ceil(displayData.length / PAGE_SIZE));
    const pagedData = displayData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // 화면에 보이는 displayData 기준 전체선택 🗨 이 탭의 모든 진짜 선택인지
    const displayIds = displayData.map(d => d.id);
    const selectedInDisplay = selectedIds.filter(id => displayIds.includes(id));
    const allDisplaySelected = displayData.length > 0 && selectedInDisplay.length === displayData.length;

    const handleToggleAllDisplay = (e) => {
        e.stopPropagation();
        if (allDisplaySelected) {
            // 현재 화면 항목들만 선택 해제
            setSelectedIds(prev => prev.filter(id => !displayIds.includes(id)));
        } else {
            // 현재 화면 항목들 모두 선택 (기존 선택에 합산)
            setSelectedIds(prev => Array.from(new Set([...prev, ...displayIds])));
        }
    };

    // 페이지 번호 배열 생성 (최대 7개 노출)
    const getPageNumbers = () => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const pages = [];
        if (currentPage <= 4) {
            for (let i = 1; i <= 5; i++) pages.push(i);
            pages.push('...');
            pages.push(totalPages);
        } else if (currentPage >= totalPages - 3) {
            pages.push(1);
            pages.push('...');
            for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            pages.push('...');
            for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
            pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    const renderSortIcon = (key) => {
        if (!sortConfig || sortConfig.key !== key) return <span style={{ opacity: 0.2 }}><ChevronUp size={14} /></span>;
        return sortConfig.direction === 'asc' ? <ChevronUp size={14} color="#818cf8" /> : <ChevronDown size={14} color="#818cf8" />;
    };

    return (
        <div className="animate-fade">
            {/* 사진 뷰어 모달 */}
            {viewerPhotos && (
                <PhotoViewerModal
                    photos={viewerPhotos.photos || viewerPhotos}
                    title={viewerPhotos.title}
                    onClose={() => setViewerPhotos(null)}
                />
            )}

            {/* ─── 필터 바: 연도 / 월 / 상태 3단 구조 ─── */}
            {(availableYears.length > 0 || !hideFilter) && (
                <div style={{ marginBottom: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>

                    {/* Row 1: 연도 */}
                    {availableYears.length > 0 && setYearFilter && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                            {['전체', ...availableYears.map(String)].map(yr => (
                                <button key={yr}
                                    onClick={() => setYearFilter(yr)}
                                    style={{
                                        padding: '0.28rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem',
                                        fontWeight: yearFilter === yr ? '700' : '500',
                                        background: yearFilter === yr
                                            ? 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)'
                                            : 'rgba(255,255,255,0.05)',
                                        color: yearFilter === yr ? '#fff' : '#64748b',
                                        border: yearFilter === yr ? 'none' : '1px solid rgba(255,255,255,0.08)',
                                        cursor: 'pointer', transition: 'all 0.18s',
                                        boxShadow: yearFilter === yr ? '0 0 12px rgba(99,102,241,0.4)' : 'none',
                                    }}
                                >{yr === '전체' ? '전체' : `${yr}년`}</button>
                            ))}
                        </div>
                    )}

                    {/* Row 2: 월 (연도가 선택된 경우에만 표시) */}
                    {yearFilter && yearFilter !== '전체' && setYearFilter && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap', paddingLeft: '0.2rem' }}>
                            {['전체', ...MONTHS].map(m => {
                                const label = m === '전체' ? '전체' : `${m}월`;
                                const val = m === '전체' ? '전체' : String(m);
                                const isActive = monthFilter === val;
                                return (
                                    <button key={val}
                                        onClick={() => setMonthFilter(val)}
                                        style={{
                                            padding: '0.22rem 0.6rem', borderRadius: '6px', fontSize: '0.76rem',
                                            fontWeight: isActive ? '700' : '400',
                                            background: isActive
                                                ? 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)'
                                                : 'rgba(255,255,255,0.04)',
                                            color: isActive ? '#fff' : '#475569',
                                            border: isActive ? 'none' : '1px solid rgba(255,255,255,0.06)',
                                            cursor: 'pointer', transition: 'all 0.15s',
                                            boxShadow: isActive ? '0 0 8px rgba(14,165,233,0.4)' : 'none',
                                        }}
                                    >{label}</button>
                                );
                            })}
                        </div>
                    )}

                    {/* Row 3: 상태 버튼 (드롭다운 대체, 메인 탭만) */}
                    {!hideFilter && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap', paddingLeft: '0.2rem' }}>
                            {statuses.map(s => {
                                const isActive = statusFilter === s;
                                const statusColors = {
                                    '전체': '#94a3b8',
                                    '견적제출중': '#60a5fa',
                                    '업체미선정': '#f87171',
                                    '착수완료 진행': '#a78bfa',
                                    '완료 마감 대기': '#fb923c',
                                    '세금계산서 발행 완료': '#34d399',
                                    '수금 완료': '#10b981',
                                    '무상작업': '#94a3b8',
                                };
                                const c = statusColors[s] || '#818cf8';
                                return (
                                    <button key={s}
                                        onClick={() => setStatusFilter(s)}
                                        style={{
                                            padding: '0.22rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem',
                                            fontWeight: isActive ? '700' : '400',
                                            background: isActive ? `${c}28` : 'rgba(255,255,255,0.04)',
                                            color: isActive ? c : '#475569',
                                            border: isActive ? `1px solid ${c}66` : '1px solid rgba(255,255,255,0.06)',
                                            cursor: 'pointer', transition: 'all 0.15s',
                                            boxShadow: isActive ? `0 0 8px ${c}33` : 'none',
                                        }}
                                    >{s}</button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
            {/* ─── 액션 버튼 행 ─── */}
            <div className="header-actions" style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                {canEdit && (
                    <>
                        <button className="btn btn-ghost" onClick={downloadTemplate} title="업로드 양식 다운로드" style={{ color: '#818cf8', borderColor: 'rgba(129, 140, 248, 0.3)' }}>
                            <FileSpreadsheet size={18} /> 양식 받기
                        </button>
                        <button className="btn btn-ghost" onClick={() => document.getElementById('excel-upload-input').click()} title="엑셀로 일괄 등록" style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                            <Upload size={18} /> 데이터 업로드
                        </button>
                        <input id="excel-upload-input" type="file" accept=".xlsx, .xls" style={{ display: 'none' }} onChange={handleExcelUpload} />
                    </>
                )}
                <button className="btn btn-ghost" onClick={exportToExcel} title="엑셀로 내보내기">
                    <Download size={18} /> 엑셀
                </button>
                <button className="btn btn-ghost" onClick={exportToPDF} title="PDF 리포트 생성">
                    <FileText size={18} /> PDF
                </button>
                <button className="btn btn-ghost" onClick={fetchSalesData} title="중앙 지휘소 데이터 동기화">
                    <Database size={18} /> 새로고침
                </button>
                {selectedInDisplay.length > 0 && user.role === 'admin' && (
                    <button className="btn btn-primary" onClick={handleBulkDelete} style={{ background: '#ef4444' }}>
                        <Trash2 size={18} /> {selectedInDisplay.length}건 일괄 삭제
                    </button>
                )}
            </div>


            {/* ── 필터링 합계 배너 ── */}
            {
                (() => {
                    const totalCount = displayData.length;
                    const totalEstimate = displayData.reduce((s, d) => s + (Number(d.estimateAmount) || 0), 0);
                    const totalRevenue = displayData.reduce((s, d) => {
                        const rev = (d.discountAmount && d.discountAmount > 0) ? d.discountAmount : d.estimateAmount;
                        return s + (Number(rev) || 0);
                    }, 0);
                    const totalDiscount = totalEstimate - totalRevenue;
                    const fmt = (v) => `₩${Number(v).toLocaleString('ko-KR')}`;
                    const tiles = [
                        { label: '필터링 건수', value: `${totalCount}건`, color: '#818cf8', bg: 'rgba(99,102,241,0.10)', border: 'rgba(99,102,241,0.25)' },
                        { label: '견적 합계', value: fmt(totalEstimate), color: '#38bdf8', bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.22)' },
                        { label: '인하 합계', value: fmt(totalDiscount), color: '#fb923c', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.22)' },
                        { label: '실 매출 합계', value: fmt(totalRevenue), color: '#34d399', bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.28)' },
                    ];
                    return (
                        <div style={{
                            display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
                            margin: '0.75rem 0',
                        }}>
                            {tiles.map(t => (
                                <div key={t.label} style={{
                                    flex: '1 1 160px',
                                    background: t.bg,
                                    border: `1px solid ${t.border}`,
                                    borderRadius: '12px',
                                    padding: '0.65rem 1.1rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.2rem',
                                    minWidth: '140px',
                                }}>
                                    <span style={{ fontSize: '0.68rem', color: t.color, fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                        {t.label}
                                    </span>
                                    <span style={{ fontSize: '1rem', color: '#f1f5f9', fontWeight: '800', letterSpacing: '-0.03em' }}>
                                        {t.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    );
                })()
            }

            <section className="glass-card" style={{ padding: '0' }}>
                <div className="table-wrapper">
                    <table className={config.isCompactView ? 'compact-view' : ''}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid rgba(99,102,241,0.2)' }}>
                                <th style={{ width: '52px', textAlign: 'center', padding: '0.6rem 0.4rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={allDisplaySelected}
                                            onChange={handleToggleAllDisplay}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <span style={{ fontSize: '0.6rem', color: '#475569' }}>№</span>
                                    </div>
                                </th>
                                <th style={{ cursor: 'pointer', minWidth: '62px', padding: '0.6rem 0.4rem', textAlign: 'center' }} onClick={() => requestSort('date')}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', justifyContent: 'center', color: '#94a3b8', fontWeight: '700', fontSize: '0.73rem' }}>
                                        등록일 {renderSortIcon('date')}
                                    </div>
                                </th>
                                {STATUS_DATE_LABELS.map(({ key, label }) => (
                                    <th key={key}
                                        onClick={() => requestSort(`statusDates.${key}`)}
                                        style={{ minWidth: '58px', padding: '0.6rem 0.3rem', textAlign: 'center', cursor: 'pointer' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', justifyContent: 'center', color: '#64748b', fontWeight: '700', fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                                            {label} {renderSortIcon(`statusDates.${key}`)}
                                        </div>
                                    </th>
                                ))}
                                <th style={{ cursor: 'pointer', padding: '0.6rem 0.5rem' }} onClick={() => requestSort('customer')}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#94a3b8', fontWeight: '700', fontSize: '0.76rem' }}>
                                        업체명 {renderSortIcon('customer')}
                                    </div>
                                </th>
                                <th style={{ padding: '0.6rem 0.45rem', minWidth: '115px' }}>
                                    <div style={{ color: '#94a3b8', fontWeight: '700', fontSize: '0.76rem' }}>담당자</div>
                                    <div style={{ fontSize: '0.6rem', color: '#475569', fontWeight: '400', marginTop: '0.05rem' }}>직급 · 연락처</div>
                                </th>
                                <th style={{ cursor: 'pointer', padding: '0.6rem 0.45rem' }} onClick={() => requestSort('representative')}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#94a3b8', fontWeight: '700', fontSize: '0.76rem' }}>
                                        담당요원 {renderSortIcon('representative')}
                                    </div>
                                </th>
                                <th style={{ cursor: 'pointer', padding: '0.6rem 0.5rem' }} onClick={() => requestSort('project')}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#94a3b8', fontWeight: '700', fontSize: '0.76rem' }}>
                                        프로젝트 {renderSortIcon('project')}
                                    </div>
                                </th>
                                <th style={{ cursor: 'pointer', padding: '0.6rem 0.5rem', textAlign: 'right' }} onClick={() => requestSort('amount')}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'flex-end', color: '#34d399', fontWeight: '700', fontSize: '0.76rem' }}>
                                        금액 {renderSortIcon('amount')}
                                    </div>
                                </th>
                                <th style={{ cursor: 'pointer', padding: '0.6rem 0.45rem' }} onClick={() => requestSort('status')}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#94a3b8', fontWeight: '700', fontSize: '0.76rem' }}>
                                        상태 {renderSortIcon('status')}
                                    </div>
                                </th>
                                <th style={{ textAlign: 'center', width: '100px', padding: '0.6rem 0.4rem', color: '#94a3b8', fontWeight: '700', fontSize: '0.76rem' }}>첨부파일</th>
                                <th style={{ textAlign: 'center', padding: '0.6rem 0.35rem', color: '#94a3b8', fontWeight: '700', fontSize: '0.76rem' }}>액션</th>
                            </tr>
                        </thead>
                        <tbody style={{ opacity: isPending ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                            {pagedData.map((item, idx) => (
                                <TableRow
                                    key={item.id}
                                    item={item}
                                    rowIndex={(currentPage - 1) * PAGE_SIZE + idx + 1}
                                    isSelected={selectedIds.includes(item.id)}
                                    statusFilter={statusFilter}
                                    onOpen={openEditModal}
                                    onToggle={toggleSelection}
                                    onDelete={handleDeleteItem}
                                    userRole={user.role}
                                    onShowPhotos={(photos, title) => setViewerPhotos({ photos, title })}
                                    onToggleStar={onToggleStar || (() => { })}
                                />
                            ))}
                            {salesData.length === 0 && (
                                <tr>
                                    <td colSpan="12" style={{ textAlign: 'center', padding: '5rem', color: '#64748b' }}>
                                        표시할 작전 기록이 없습니다. 새로운 프로젝트를 등록하거나 데이터를 연동하세요.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── 페이지네이션 ── */}
                {totalPages > 1 && (
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)',
                        flexWrap: 'wrap', gap: '0.75rem'
                    }}>
                        {/* 건수 정보 */}
                        <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                            전체 <strong style={{ color: '#94a3b8' }}>{salesData.length}</strong>건 중{' '}
                            <strong style={{ color: '#818cf8' }}>
                                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, salesData.length)}
                            </strong>건 표시
                        </span>

                        {/* 페이지 버튼 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            {/* 이전 */}
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                style={{
                                    padding: '0.4rem 0.85rem', borderRadius: '8px',
                                    background: currentPage === 1 ? 'rgba(255,255,255,0.03)' : 'rgba(129,140,248,0.12)',
                                    border: '1px solid rgba(129,140,248,0.2)',
                                    color: currentPage === 1 ? '#475569' : '#818cf8',
                                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                    fontSize: '0.82rem', fontWeight: '600', transition: '0.2s'
                                }}
                            >‹ 이전</button>

                            {/* 페이지 번호 */}
                            {getPageNumbers().map((p, idx) =>
                                p === '...' ? (
                                    <span key={`ellipsis-${idx}`} style={{ color: '#475569', padding: '0 0.3rem', fontSize: '0.85rem' }}>…</span>
                                ) : (
                                    <button
                                        key={p}
                                        onClick={() => setCurrentPage(p)}
                                        style={{
                                            width: '36px', height: '36px', borderRadius: '8px',
                                            background: currentPage === p ? 'rgba(99,102,241,0.8)' : 'rgba(255,255,255,0.04)',
                                            border: currentPage === p ? '1px solid rgba(99,102,241,0.9)' : '1px solid rgba(255,255,255,0.07)',
                                            color: currentPage === p ? '#fff' : '#94a3b8',
                                            cursor: 'pointer', fontSize: '0.85rem', fontWeight: currentPage === p ? '800' : '500',
                                            transition: '0.2s',
                                            boxShadow: currentPage === p ? '0 0 12px rgba(99,102,241,0.3)' : 'none'
                                        }}
                                    >{p}</button>
                                )
                            )}

                            {/* 다음 */}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                style={{
                                    padding: '0.4rem 0.85rem', borderRadius: '8px',
                                    background: currentPage === totalPages ? 'rgba(255,255,255,0.03)' : 'rgba(129,140,248,0.12)',
                                    border: '1px solid rgba(129,140,248,0.2)',
                                    color: currentPage === totalPages ? '#475569' : '#818cf8',
                                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                    fontSize: '0.82rem', fontWeight: '600', transition: '0.2s'
                                }}
                            >다음 ›</button>
                        </div>
                    </div>
                )}
            </section>
        </div >
    );
};

export default StatusTab;
