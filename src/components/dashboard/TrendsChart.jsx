import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';

const fmt = (v) => `₩${v.toLocaleString('ko-KR')}`;
const fmtShort = (v) => {
    if (v >= 1_000_000_000) return `₩${(v / 1_000_000_000).toFixed(1)}B`;
    if (v >= 1_000_000) return `₩${(v / 1_000_000).toFixed(0)}M`;
    return fmt(v);
};

const TrendsChart = ({ selectedYears, chartData, setSelectedMonth, years, toggleYear, yearColors, yearTotals = {} }) => {
    const sortedSelected = [...selectedYears].sort();
    const isMulti = sortedSelected.length >= 2;

    // 단일 연도: sales 키 사용, 멀티: year 키 사용
    const singleTotal = !isMulti && sortedSelected.length === 1
        ? (yearTotals[sortedSelected[0]] ?? chartData.reduce((s, m) => s + (m.sales || 0), 0))
        : 0;

    // 멀티 연도: 첫번째 vs 마지막 차이
    const firstYear = sortedSelected[0];
    const lastYear = sortedSelected[sortedSelected.length - 1];
    const firstTotal = yearTotals[firstYear] ?? 0;
    const lastTotal = yearTotals[lastYear] ?? 0;
    const diff = isMulti ? lastTotal - firstTotal : 0;
    const diffPct = isMulti && firstTotal !== 0 ? ((diff / firstTotal) * 100).toFixed(1) : null;
    const isUp = diff >= 0;

    return (
        <section className="chart-section glass-card">
            <div className="section-header" style={{ alignItems: 'flex-start', gap: '0.8rem', flexWrap: 'wrap' }}>
                <h3>{isMulti ? '연도별 계산서 발행 실적 비교' : '계산서 발행 실적'}</h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', flex: 1 }}>
                    {/* 연도 선택 버튼 */}
                    <div className="year-selector-multi">
                        {years.map(y => (
                            <button key={y} className={`year-btn-small ${selectedYears.includes(y) ? 'active' : ''}`} onClick={() => toggleYear(y)}>{y}</button>
                        ))}
                    </div>

                    {/* 합계 박스들 */}
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>

                        {isMulti ? (
                            <>
                                {/* 각 연도별 합계 */}
                                {sortedSelected.map(y => (
                                    <div key={y} style={{
                                        background: `${yearColors[y]}18`,
                                        border: `1px solid ${yearColors[y]}55`,
                                        borderRadius: '10px',
                                        padding: '0.3rem 0.85rem',
                                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        <span style={{ fontSize: '0.7rem', color: yearColors[y], fontWeight: '700' }}>{y}년</span>
                                        <span style={{ fontSize: '0.88rem', color: '#e2e8f0', fontWeight: '700', letterSpacing: '-0.02em' }}>
                                            {fmtShort(yearTotals[y] ?? 0)}
                                        </span>
                                    </div>
                                ))}

                                {/* 차이 박스 (2개 선택 시만) */}
                                {sortedSelected.length === 2 && (
                                    <div style={{
                                        background: isUp ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                        border: `1px solid ${isUp ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`,
                                        borderRadius: '10px',
                                        padding: '0.3rem 0.85rem',
                                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        <span style={{ fontSize: '0.7rem', color: isUp ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                                            {firstYear}→{lastYear} 차이
                                        </span>
                                        <span style={{ fontSize: '0.88rem', color: isUp ? '#10b981' : '#ef4444', fontWeight: '700' }}>
                                            {isUp ? '+' : ''}{fmtShort(diff)}
                                        </span>
                                        {diffPct !== null && (
                                            <span style={{ fontSize: '0.72rem', color: isUp ? '#6ee7b7' : '#fca5a5', fontWeight: '600' }}>
                                                ({isUp ? '+' : ''}{diffPct}%)
                                            </span>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            /* 단일 연도 합계 */
                            <div style={{
                                background: 'rgba(99,102,241,0.12)',
                                border: '1px solid rgba(99,102,241,0.3)',
                                borderRadius: '10px',
                                padding: '0.35rem 1rem',
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                whiteSpace: 'nowrap',
                            }}>
                                <span style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: '600' }}>합계</span>
                                <span style={{ fontSize: '0.95rem', color: '#e2e8f0', fontWeight: '700', letterSpacing: '-0.02em' }}>
                                    {fmt(singleTotal)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ height: '320px', marginTop: '2rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                    {isMulti ? (
                        <LineChart data={chartData} onClick={(s) => s && s.activeLabel && setSelectedMonth(prev => prev === s.activeLabel ? null : s.activeLabel)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₩${(v / 1000000).toFixed(0)}M`} />
                            <Tooltip
                                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px' }}
                                formatter={(value) => [`₩${value.toLocaleString()}`, '발행 금액']}
                            />
                            <Legend verticalAlign="top" height={36} />
                            {sortedSelected.map(y => (
                                <Line key={y} type="monotone" dataKey={y} stroke={yearColors[y]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                            ))}
                        </LineChart>
                    ) : (
                        <AreaChart data={chartData} onClick={(s) => s && s.activeLabel && setSelectedMonth(prev => prev === s.activeLabel ? null : s.activeLabel)}>
                            <defs><linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={yearColors[sortedSelected[0]]} stopOpacity={0.3} /><stop offset="95%" stopColor={yearColors[sortedSelected[0]]} stopOpacity={0} /></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₩${(v / 1000000).toFixed(0)}M`} />
                            <Tooltip
                                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px' }}
                                formatter={(value) => [`₩${value.toLocaleString()}`, '발행 금액']}
                            />
                            <Area type="monotone" dataKey="sales" stroke={yearColors[sortedSelected[0]]} strokeWidth={3} fill="url(#colorSales)" />
                        </AreaChart>
                    )}
                </ResponsiveContainer>
            </div>
        </section>
    );
};

export default TrendsChart;
