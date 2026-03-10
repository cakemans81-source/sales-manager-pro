import React from 'react';
import { X, AlertCircle, DollarSign } from 'lucide-react';

const ProjectDrilldown = ({ selectedMonth, setSelectedMonth, sortedAndFilteredData, openEditModal }) => {
    return (
        <section className="drilldown-section animate-fade">
            <div className="section-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h3 style={{ margin: 0 }}>
                        {selectedMonth ? `${selectedMonth} 주요 작전 내역` : '핵심 프로젝트 리스트'}
                    </h3>
                    <span className="count-badge">{sortedAndFilteredData.length}건</span>
                </div>
                {selectedMonth && (
                    <button className="btn-text" onClick={() => setSelectedMonth(null)} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: '600' }}>
                        <X size={14} /> 선택 해제
                    </button>
                )}
            </div>
            <div className="drilldown-grid">
                {sortedAndFilteredData.map(item => (
                    <div key={item.id} className="drilldown-card glass" onClick={() => openEditModal(item)} style={{ cursor: 'pointer' }}>
                        <div className="card-top">
                            <span className="customer">{item.customer}</span>
                            <span className={`status-badge ${item.status === '세금계산서 발행 완료' ? 'success' :
                                item.status === '완료 마감 대기' ? 'info' : 'warning'
                                }`}>
                                {item.status}
                            </span>
                        </div>
                        <div className="card-mid">
                            <h4>{item.project}</h4>
                            {item.imageProduct && (
                                <div className="card-preview-img">
                                    <img src={item.imageProduct} alt="product" />
                                </div>
                            )}
                        </div>
                        <div className="card-bottom">
                            <div className="info">
                                <DollarSign size={14} />
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.7rem', color: '#64748b', textDecoration: (item.discountAmount > 0 ? 'line-through' : 'none') }}>
                                        ₩{(item.estimateAmount || 0).toLocaleString()}
                                    </span>
                                    {item.discountAmount > 0 && (
                                        <span style={{ color: '#10b981', fontWeight: '800' }}>
                                            최종가: ₩{(item.discountAmount || 0).toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="info" style={{ marginLeft: 'auto', textAlign: 'right' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>담당: {item.customerContact || '미지정'}</span>
                                    <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: '600' }}>{item.customerPhone || '-'}</span>
                                </div>
                            </div>
                        </div>
                        {item.lastModifiedBy && (
                            <div className="card-audit">
                                <span className="audit-text">수정: {item.lastModifiedBy} 요원 ({item.lastModifiedAt})</span>
                            </div>
                        )}
                    </div>
                ))}
                {sortedAndFilteredData.length === 0 && (
                    <div className="empty-drilldown">
                        <AlertCircle size={32} />
                        <p>선택하신 조건의 작전 기록이 없습니다.</p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default ProjectDrilldown;
