import React from 'react';

const PDFReportTemplate = ({ user, salesData }) => {
    return (
        <div id="report-template" style={{ display: 'none', position: 'absolute', left: '-9999px', width: '800px', padding: '50px', background: '#0f172a', color: '#f1f5f9' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid #6366f1', paddingBottom: '30px' }}>
                <h1 style={{ fontSize: '36px', color: '#6366f1', marginBottom: '10px' }}>BUSINESS STRATEGY REPORT</h1>
                <p style={{ color: '#94a3b8', fontSize: '14px', letterSpacing: '0.1em' }}>IRU MANAGER SYSTEM | CONFIDENTIAL</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
                <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <h3 style={{ color: '#818cf8', marginBottom: '10px', fontSize: '16px' }}>Executive Summary</h3>
                    <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>
                        본 보고서는 {new Date().toLocaleDateString()} 기준 영업 실적 및 핵심 작전 현황을 포함하고 있습니다.
                        현재 총 {salesData.length}건의 프로젝트가 관리되고 있습니다.
                    </p>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <h3 style={{ color: '#10b981', marginBottom: '10px', fontSize: '16px' }}>Financial Status</h3>
                    <p style={{ fontSize: '24px', fontWeight: '800', color: '#f1f5f9' }}>
                        ₩{salesData.reduce((acc, curr) => acc + (curr.discountAmount > 0 ? curr.discountAmount : curr.estimateAmount), 0).toLocaleString()}
                    </p>
                    <p style={{ fontSize: '12px', color: '#94a3b8' }}>누적 총 매출액 현황</p>
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
                <thead>
                    <tr style={{ background: '#1e293b' }}>
                        <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #334155', color: '#6366f1' }}>고객사</th>
                        <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #334155', color: '#6366f1' }}>프로젝트 건명</th>
                        <th style={{ padding: '15px', textAlign: 'right', borderBottom: '2px solid #334155', color: '#6366f1' }}>최종 매출액</th>
                        <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #334155', color: '#6366f1' }}>상태</th>
                    </tr>
                </thead>
                <tbody>
                    {salesData.slice(0, 15).map(item => (
                        <tr key={item.id}>
                            <td style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>{item.customer}</td>
                            <td style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>{item.project}</td>
                            <td style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'right', fontWeight: 'bold' }}>
                                ₩{(item.discountAmount > 0 ? item.discountAmount : item.estimateAmount).toLocaleString()}
                            </td>
                            <td style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                                <span style={{ padding: '4px 8px', background: '#334155', borderRadius: '4px', fontSize: '11px' }}>{item.status}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ marginTop: '50px' }}>
                <h2 style={{ fontSize: '18px', marginBottom: '20px', color: '#6366f1', borderLeft: '4px solid #6366f1', paddingLeft: '10px' }}>Visual Evidence & Attachments</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                    {salesData.filter(d => d.imageProduct || d.imageEstimate).slice(0, 8).map(item => (
                        <div key={item.id} style={{ background: '#1e293b', padding: '10px', borderRadius: '12px' }}>
                            <div style={{ height: '80px', background: '#0f172a', borderRadius: '8px', overflow: 'hidden', marginBottom: '8px' }}>
                                {item.imageProduct && <img src={item.imageProduct} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                            </div>
                            <p style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.customer}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '40px', textAlign: 'right', color: '#475569', fontSize: '12px' }}>
                Generated by IRU Manager AI System | {new Date().toLocaleString()}
            </div>
        </div>
    );
};

export default PDFReportTemplate;
