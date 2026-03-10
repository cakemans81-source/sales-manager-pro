import React from 'react';

const StatusDistribution = ({ salesData, onStatusClick }) => {
    return (
        <div
            className="glass-card status-distribution"
            onClick={onStatusClick}
            style={{
                cursor: onStatusClick ? 'pointer' : 'default',
                transition: 'all 0.2s',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}
            onMouseEnter={e => { if (onStatusClick) e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; }}
            onMouseLeave={e => { if (onStatusClick) e.currentTarget.style.borderColor = ''; }}
            title={onStatusClick ? '클릭하면 작전 상황판(칸반)으로 이동합니다' : undefined}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem' }}>작전 상태별 분포</h4>
                {onStatusClick && (
                    <span style={{
                        fontSize: '0.72rem', color: '#818cf8', fontWeight: '600',
                        background: 'rgba(99,102,241,0.12)', padding: '0.2rem 0.6rem',
                        borderRadius: '6px', border: '1px solid rgba(99,102,241,0.25)',
                        display: 'flex', alignItems: 'center', gap: '0.25rem'
                    }}>
                        📋 칸반으로 보기 →
                    </span>
                )}
            </div>
            <div className="status-bars" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.75rem' }}>
                {['견적제출중', '착수완료 진행', '완료 마감 대기', '세금계산서 발행 완료'].map(st => {
                    const count = salesData.filter(d => d.status === st).length;
                    const percent = salesData.length > 0 ? (count / salesData.length) * 100 : 0;
                    return (
                        <div key={st} className="status-bar-item">
                            <div className="label-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                                <span>{st}</span>
                                <span>{count}건</span>
                            </div>
                            <div className="bar-bg" style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                <div className="bar-fill" style={{
                                    height: '100%',
                                    width: `${percent}%`,
                                    background: st.includes('완료') ? '#10b981' : st.includes('진행') ? '#6366f1' : '#f59e0b',
                                    borderRadius: '10px',
                                    transition: 'width 1s'
                                }}></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StatusDistribution;
