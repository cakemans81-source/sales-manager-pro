import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomerRevenueChart = ({ salesData, selectedYears }) => {
    const { data, totalRevenue } = useMemo(() => {
        const customerMap = {};
        let totalRev = 0;

        salesData.forEach(item => {
            const dateStr = String(item.date);
            const year = parseInt(dateStr.split('.')[0]);
            if (selectedYears.includes(year)) {
                const revenue = (item.discountAmount && item.discountAmount > 0) ? item.discountAmount : item.estimateAmount;
                if (!customerMap[item.customer]) {
                    customerMap[item.customer] = 0;
                }
                customerMap[item.customer] += revenue;
                totalRev += revenue;
            }
        });

        const sortedEntries = Object.entries(customerMap)
            .map(([name, value]) => ({
                name,
                value
            }))
            .sort((a, b) => b.value - a.value);

        if (sortedEntries.length === 0) return { data: [], totalRevenue: 0 };

        const top5 = sortedEntries.slice(0, 5);
        const others = sortedEntries.slice(5);

        let finalData = top5;
        if (others.length > 0) {
            const othersValue = others.reduce((acc, curr) => acc + curr.value, 0);
            finalData = [...top5, { name: 'Etc', value: othersValue }];
        }

        return { data: finalData, totalRevenue: totalRev };
    }, [salesData, selectedYears]);

    const palette = [
        '#6366f1', // Indigo
        '#8b5cf6', // Violet
        '#ec4899', // Pink
        '#10b981', // Emerald
        '#f59e0b', // Amber
        '#64748b', // Slate (for Etc)
    ];

    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (percent < 0.05) return null;

        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="800">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="customer-revenue-chart" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="section-header" style={{ marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    고객사별 매출 비중 분석 📊
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    {selectedYears.join(', ')}년도 TOP 5 고객사 및 기타 비중
                </p>
            </div>

            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="35%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomizedLabel}
                            outerRadius="90%"
                            innerRadius="55%"
                            dataKey="value"
                            paddingAngle={3}
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.name === 'Etc' ? '#475569' : palette[index % palette.length]}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const entry = payload[0].payload;
                                    const percent = ((entry.value / totalRevenue) * 100).toFixed(1);
                                    return (
                                        <div className="glass" style={{ padding: '0.8rem', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                                            <p style={{ color: '#94a3b8', fontSize: '0.7rem', marginBottom: '0.2rem' }}>고객 점유율</p>
                                            <h4 style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '0.6rem' }}>{entry.name}</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem' }}>
                                                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>금액</span>
                                                    <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: '800' }}>₩{entry.value.toLocaleString()}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem' }}>
                                                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>비중</span>
                                                    <span style={{ color: '#818cf8', fontSize: '0.8rem', fontWeight: '800' }}>{percent}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Legend
                            layout="vertical"
                            verticalAlign="middle"
                            align="right"
                            content={({ payload }) => (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '1rem', maxHeight: '100%', overflowY: 'auto' }}>
                                    {payload.map((entry, index) => {
                                        const percent = ((entry.payload.value / totalRevenue) * 100).toFixed(1);
                                        return (
                                            <div key={index} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.8rem',
                                                padding: '0.5rem 0.8rem',
                                                background: 'rgba(255,255,255,0.02)',
                                                borderRadius: '10px',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                width: 'max-content',
                                                minWidth: '180px'
                                            }}>
                                                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: entry.color, flexShrink: 0 }}></div>
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>{entry.value}</span>
                                                        <span style={{ color: '#818cf8', fontSize: '0.7rem', fontWeight: '800' }}>{percent}%</span>
                                                    </div>
                                                    <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: '800', textAlign: 'right' }}>₩{entry.payload.value.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CustomerRevenueChart;
