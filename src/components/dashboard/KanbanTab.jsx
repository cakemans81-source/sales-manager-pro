import React, { useRef } from 'react';
import { MoreVertical, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';

const KanbanTab = ({ salesData, openEditModal, canEdit }) => {
    const statuses = ['견적제출중', '업체미선정', '착수완료 진행', '완료 마감 대기', '세금계산서 발행 완료', '수금 완료'];
    const scrollRef = useRef(null);

    const getCardsByStatus = (status) => {
        return salesData.filter(item => item.status === status);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case '견적제출중': return '#94a3b8';
            case '업체미선정': return '#f59e0b';
            case '착수완료 진행': return '#ec4899';
            case '완료 마감 대기': return '#10b981';
            case '세금계산서 발행 완료': return '#818cf8';
            case '수금 완료': return '#22c55e';
            default: return '#64748b';
        }
    };

    const getColumnTotal = (status) => {
        const cards = getCardsByStatus(status);
        return cards.reduce((acc, curr) => {
            const amount = (curr.discountAmount && curr.discountAmount > 0) ? curr.discountAmount : (curr.estimateAmount || 0);
            return acc + amount;
        }, 0);
    };

    const scroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = 320;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="kanban-container animate-fade">
            <div className="kanban-board-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h3>작전 단계별 상황판 📋</h3>
                    <p>영업 단계를 직관적으로 관리하고 흐름을 제어합니다.</p>
                </div>
                <div className="kanban-nav-controls" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <button className="btn-icon" onClick={() => scroll('left')} title="왼쪽으로 이동" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '50%', width: '36px', height: '36px', padding: '0', justifyContent: 'center' }}>
                        <ChevronLeft size={20} />
                    </button>
                    <button className="btn-icon" onClick={() => scroll('right')} title="오른쪽으로 이동" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '50%', width: '36px', height: '36px', padding: '0', justifyContent: 'center' }}>
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div className="kanban-columns" ref={scrollRef} style={{ scrollBehavior: 'smooth' }}>
                {statuses.map(status => {
                    const cards = getCardsByStatus(status);
                    const total = getColumnTotal(status);

                    return (
                        <div key={status} className="kanban-column" style={{ minWidth: '280px' }}>
                            <div className="column-header" style={{ borderTop: `4px solid ${getStatusColor(status)}`, display: 'flex', flexDirection: 'column', height: 'auto', padding: '1.2rem 1rem', alignItems: 'stretch', gap: '0.6rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="status-label" style={{ fontSize: '0.85rem', fontWeight: '800', color: '#f8fafc' }}>{status}</span>
                                    <span className="count-badge" style={{ margin: '0', background: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}>{cards.length}</span>
                                </div>
                                <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#10b981' }}>₩{total.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="column-content">
                                {cards.map(item => (
                                    <div
                                        key={item.id}
                                        className="kanban-card glass"
                                        onClick={() => openEditModal(item)}
                                        style={{ padding: '1rem' }}
                                    >
                                        <div className="card-top" style={{ marginBottom: '0.4rem' }}>
                                            <span className="customer-tag" style={{ fontSize: '0.65rem', color: '#818cf8', fontWeight: '700' }}>{item.customer}</span>
                                            <MoreVertical size={14} style={{ color: '#64748b' }} />
                                        </div>
                                        <h4 className="project-title" style={{ fontSize: '0.85rem', fontWeight: '700', margin: '0 0 0.8rem 0', color: '#f1f5f9' }}>{item.project}</h4>

                                        <div className="card-info" style={{ marginTop: '0', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.6rem' }}>
                                            <div className="info-item" style={{ color: '#10b981', fontWeight: '800', fontSize: '0.8rem' }}>
                                                <span>₩{((item.discountAmount && item.discountAmount > 0) ? item.discountAmount : (item.estimateAmount || 0)).toLocaleString()}</span>
                                            </div>
                                        </div>

                                        {status === '업체미선정' && (
                                            <div className="card-badge warning" style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem', marginTop: '0.5rem' }}>집중 관리</div>
                                        )}
                                    </div>
                                ))}
                                {cards.length === 0 && (
                                    <div className="empty-column" style={{ fontSize: '0.75rem', padding: '2rem 1rem' }}>기록 없음</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default KanbanTab;
