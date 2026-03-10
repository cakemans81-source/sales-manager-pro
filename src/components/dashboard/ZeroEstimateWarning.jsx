import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Edit3 } from 'lucide-react';

const ITEM_HEIGHT = 56;    // 항목 1개 높이 (px)
const HEADER_HEIGHT = 130; // 헤더 + 설명 + 패딩 높이
const FOOTER_HEIGHT = 44;  // 페이지네이션 높이
const MIN_ITEMS = 3;       // 최소 표시 개수

const ZeroEstimateWarning = ({ salesData, onEdit }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(MIN_ITEMS);
    const containerRef = useRef(null);

    // 위젯 높이에 따라 표시 개수 자동 계산
    const calcItemsPerPage = useCallback((height) => {
        const availableHeight = height - HEADER_HEIGHT - FOOTER_HEIGHT;
        const calculated = Math.floor(availableHeight / ITEM_HEIGHT);
        return Math.max(MIN_ITEMS, calculated);
    }, []);

    useEffect(() => {
        if (!containerRef.current) return;
        // 초기 높이 계산
        setItemsPerPage(calcItemsPerPage(containerRef.current.getBoundingClientRect().height));

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const newCount = calcItemsPerPage(entry.contentRect.height);
                setItemsPerPage(prev => {
                    if (prev !== newCount) setCurrentPage(1); // 크기 바뀌면 첫 페이지로
                    return newCount;
                });
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [calcItemsPerPage]);

    const zeroProjects = salesData.filter(item =>
        (item.estimateAmount === 0 || !item.estimateAmount) &&
        item.status !== '수금 완료' &&
        item.status !== '무상작업'
    );

    const totalPages = Math.ceil(zeroProjects.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const pagedProjects = zeroProjects.slice(startIndex, startIndex + itemsPerPage);

    if (zeroProjects.length === 0) return null;

    return (
        <div
            ref={containerRef}
            className="glass-card"
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(69, 10, 10, 0.25))',
                padding: '1rem',
                overflow: 'hidden',
                borderRadius: '16px',
            }}
        >
            {/* 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', flexShrink: 0 }}>
                <AlertTriangle size={18} />
                <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>견적가 0원 탐지</h4>
                <span style={{
                    fontSize: '0.6rem',
                    padding: '0.15rem 0.4rem',
                    borderRadius: '4px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    fontWeight: 700,
                    marginLeft: 'auto',
                }}>
                    {zeroProjects.length}건
                </span>
            </div>

            <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0, lineHeight: 1.4, flexShrink: 0 }}>
                견적 금액이 미입력되었습니다.<br />
                <strong style={{ color: '#fca5a5' }}>"견적서 고객사 제출 요망"</strong>
            </p>

            {/* 동적 리스트 — 위젯 높이에 따라 표시 개수 자동 증가 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem', overflow: 'hidden', minHeight: 0 }}>
                {pagedProjects.map(project => (
                    <div
                        key={project.id}
                        onClick={() => onEdit(project)}
                        style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            padding: '0.45rem 0.75rem',
                            borderLeft: '3px solid #ef4444',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            border: '1px solid rgba(255,255,255,0.04)',
                            borderLeft: '3px solid rgba(239,68,68,0.7)',
                            flexShrink: 0,
                            minHeight: `${ITEM_HEIGHT - 6}px`,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; }}
                    >
                        <div style={{ overflow: 'hidden', flex: 1 }}>
                            <div style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                color: '#f1f5f9',
                            }}>
                                {project.project || '무제 프로젝트'}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '2px' }}>
                                {project.customer}
                            </div>
                        </div>
                        <Edit3 size={11} style={{ color: '#475569', marginLeft: '0.5rem', flexShrink: 0 }} />
                    </div>
                ))}
            </div>

            {/* 페이지네이션 - 2페이지 이상일 때만 표시 */}
            {totalPages > 1 && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    paddingTop: '0.4rem',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    flexShrink: 0,
                }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.max(1, p - 1)); }}
                        disabled={currentPage === 1}
                        style={{ background: 'none', border: 'none', color: currentPage === 1 ? '#334155' : '#94a3b8', cursor: currentPage === 1 ? 'default' : 'pointer', display: 'flex', padding: '2px' }}
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>
                        {currentPage} / {totalPages}
                        <span style={{ color: '#475569', marginLeft: '5px', fontWeight: 400 }}>({itemsPerPage}건씩)</span>
                    </span>
                    <button
                        onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.min(totalPages, p + 1)); }}
                        disabled={currentPage === totalPages}
                        style={{ background: 'none', border: 'none', color: currentPage === totalPages ? '#334155' : '#94a3b8', cursor: currentPage === totalPages ? 'default' : 'pointer', display: 'flex', padding: '2px' }}
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default ZeroEstimateWarning;
