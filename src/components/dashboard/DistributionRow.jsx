import React from 'react';

const DistributionRow = ({ salesData, onStatusClick }) => {
    return (
        <section className="extended-stats-row">
            <div
                className="glass-card status-distribution"
                onClick={onStatusClick}
                style={{ cursor: onStatusClick ? 'pointer' : 'default', transition: 'all 0.2s' }}
                onMouseEnter={e => { if (onStatusClick) e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; }}
                onMouseLeave={e => { if (onStatusClick) e.currentTarget.style.borderColor = ''; }}
                title={onStatusClick ? '클릭하면 작전 상황판(칸반)으로 이동합니다' : undefined}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0 }}>작전 상태별 분포</h4>
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
                <div className="status-bars">
                    {['견적제출중', '착수완료 진행', '완료 마감 대기', '세금계산서 발행 완료'].map(st => {
                        const count = salesData.filter(d => d.status === st).length;
                        const percent = salesData.length > 0 ? (count / salesData.length) * 100 : 0;
                        return (
                            <div key={st} className="status-bar-item">
                                <div className="label-row"><span>{st}</span><span>{count}건</span></div>
                                <div className="bar-bg"><div className="bar-fill" style={{ width: `${percent}%`, background: st.includes('완료') ? '#10b981' : st.includes('진행') ? '#6366f1' : '#f59e0b' }}></div></div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="glass-card activity-log">
                <h4>최근 활동 브리핑</h4>
                <div className="activity-list">
                    {salesData.filter(d => d.lastModifiedAt).slice(0, 4).map(d => (
                        <div key={d.id} className="activity-item">
                            <div className="activity-dot"></div>
                            <div className="activity-content">
                                <p><strong>{d.lastModifiedBy}</strong> 요원이 '{d.customer}' 건 수정</p>
                                <span>{d.lastModifiedAt}</span>
                            </div>
                        </div>
                    ))}
                    {salesData.filter(d => d.lastModifiedAt).length === 0 && <p className="empty-text">기록된 활동이 없습니다.</p>}
                </div>
            </div>
        </section>
    );
};

export default DistributionRow;
