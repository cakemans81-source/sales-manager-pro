import React from 'react';
import { Star, ChevronRight, ExternalLink } from 'lucide-react';

const STATUS_COLORS = {
    '견적제출중': { bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.35)', text: '#fb923c' },
    '업체미선정': { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', text: '#f87171' },
    '착수완료 진행': { bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.35)', text: '#38bdf8' },
    '완료 마감 대기': { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.35)', text: '#a855f7' },
    '세금계산서 발행 완료': { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)', text: '#10b981' },
    '수금 완료': { bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.4)', text: '#34d399' },
    '무상작업': { bg: 'rgba(100,116,139,0.15)', border: 'rgba(100,116,139,0.35)', text: '#94a3b8' },
};

/**
 * StarredItemsWidget
 * - 팀원이 별표 체크한 항목을 관리자가 확인할 수 있는 위젯
 * - 항목 클릭 시 프로젝트 수정 모달 즉시 오픈
 */
const StarredItemsWidget = ({ salesData = [], onOpenEdit, user }) => {
    const starredItems = salesData.filter(d => d.isStarred);

    return (
        <div
            className="glass-card"
            style={{
                padding: '1.25rem',
                border: '1px solid rgba(245,158,11,0.2)',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9))',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Star size={16} fill="#f59e0b" color="#f59e0b" style={{ filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.6))' }} />
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#f1f5f9' }}>
                        팀원 요청 항목
                    </h4>
                </div>
                <span style={{
                    background: starredItems.length > 0 ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${starredItems.length > 0 ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    color: starredItems.length > 0 ? '#f59e0b' : '#475569',
                    borderRadius: '100px',
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    padding: '0.15rem 0.6rem',
                }}>
                    {starredItems.length}건
                </span>
            </div>
            <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.7rem', color: '#64748b' }}>
                클릭하면 수정 모달로 이동합니다
            </p>

            {/* 항목 리스트 */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {starredItems.length === 0 ? (
                    <div style={{
                        flex: 1, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        padding: '2rem', color: '#334155', gap: '0.5rem',
                    }}>
                        <Star size={28} color="#1e3a5f" style={{ opacity: 0.4 }} />
                        <span style={{ fontSize: '0.78rem', textAlign: 'center', lineHeight: 1.5 }}>
                            별표 항목이 없습니다.<br />
                            <span style={{ fontSize: '0.7rem', color: '#1e3a5f' }}>
                                테이블에서 ☆ 버튼을 눌러<br />관리자에게 주의를 요청하세요.
                            </span>
                        </span>
                    </div>
                ) : (
                    starredItems.map((item) => {
                        const sc = STATUS_COLORS[item.status] || { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.3)', text: '#818cf8' };
                        return (
                            <button
                                key={item.id}
                                onClick={() => onOpenEdit(item)}
                                title="클릭하여 수정 모달 열기"
                                style={{
                                    width: '100%',
                                    background: 'rgba(245,158,11,0.05)',
                                    border: '1px solid rgba(245,158,11,0.15)',
                                    borderRadius: '10px',
                                    padding: '0.65rem 0.8rem',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.6rem',
                                    transition: 'all 0.18s',
                                    color: '#f1f5f9',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = 'rgba(245,158,11,0.12)';
                                    e.currentTarget.style.borderColor = 'rgba(245,158,11,0.35)';
                                    e.currentTarget.style.transform = 'translateX(2px)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'rgba(245,158,11,0.05)';
                                    e.currentTarget.style.borderColor = 'rgba(245,158,11,0.15)';
                                    e.currentTarget.style.transform = 'translateX(0)';
                                }}
                            >
                                {/* 별 아이콘 */}
                                <Star
                                    size={13}
                                    fill="#f59e0b"
                                    color="#f59e0b"
                                    style={{ flexShrink: 0, filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.5))' }}
                                />
                                {/* 내용 */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        display: 'flex', alignItems: 'center',
                                        gap: '0.4rem', marginBottom: '0.2rem', flexWrap: 'wrap',
                                    }}>
                                        <span style={{
                                            fontSize: '0.75rem', fontWeight: '700', color: '#e2e8f0',
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                            maxWidth: '90px',
                                        }}>
                                            {item.customer}
                                        </span>
                                        <span style={{
                                            fontSize: '0.62rem', padding: '0.1rem 0.4rem',
                                            background: sc.bg, border: `1px solid ${sc.border}`,
                                            color: sc.text, borderRadius: '20px', fontWeight: '700',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <div style={{
                                        fontSize: '0.7rem', color: '#94a3b8',
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    }}>
                                        {item.project}
                                    </div>
                                    <div style={{ fontSize: '0.62rem', color: '#475569', marginTop: '0.1rem' }}>
                                        담당: {item.representative || '-'} · {item.date}
                                    </div>
                                </div>
                                {/* 화살표 */}
                                <ChevronRight size={14} color="#475569" style={{ flexShrink: 0 }} />
                            </button>
                        );
                    })
                )}
            </div>

            {/* 하단 요약 */}
            {starredItems.length > 0 && (
                <div style={{
                    marginTop: '0.75rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid rgba(245,158,11,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        총 <strong style={{ color: '#f59e0b' }}>{starredItems.length}건</strong> 요청됨
                    </span>
                    {user?.role === 'admin' && (
                        <span style={{ fontSize: '0.65rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <ExternalLink size={10} /> 관리자 전용 뷰
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default StarredItemsWidget;
