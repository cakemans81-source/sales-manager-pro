import React from 'react';

const ActivityLog = ({ salesData }) => {
    return (
        <div className="glass-card activity-log" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '1.25rem' }}>최근 활동 브리핑</h4>
            <div className="activity-list" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
                {[...salesData].filter(d => d.lastModifiedAt).sort((a, b) => new Date(b.lastModifiedAt.replace(/\./g, '-')) - new Date(a.lastModifiedAt.replace(/\./g, '-'))).slice(0, 5).map(d => (
                    <div key={d.id} className="activity-item" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <div className="activity-dot" style={{ width: '8px', height: '8px', background: '#6366f1', borderRadius: '50%', marginTop: '5px', flexShrink: 0, boxShadow: '0 0 10px rgba(99,102,241,0.5)' }}></div>
                        <div className="activity-content">
                            <p style={{ fontSize: '0.8rem', margin: 0, color: '#cbd5e1' }}>
                                <strong style={{ color: '#818cf8' }}>{d.lastModifiedBy}</strong> 요원이 '{d.customer}' 건 수정
                            </p>
                            <span style={{ fontSize: '0.65rem', color: '#64748b' }}>{d.lastModifiedAt}</span>
                        </div>
                    </div>
                ))}
                {salesData.filter(d => d.lastModifiedAt).length === 0 && <p className="empty-text" style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', marginTop: '2rem' }}>기록된 활동이 없습니다.</p>}
            </div>
        </div>
    );
};

export default ActivityLog;
