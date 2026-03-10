import React, { useMemo } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, Target } from 'lucide-react';

const AIInsights = ({ salesData, yearlyTargets, displayYear }) => {
    const insights = useMemo(() => {
        const yearData = salesData.filter(d => d.date.startsWith(String(displayYear)));
        const totalActual = yearData.reduce((acc, curr) => acc + (curr.discountAmount > 0 ? curr.discountAmount : curr.estimateAmount), 0);
        const target = yearlyTargets[displayYear] || 500000000;
        const achievementRate = (totalActual / target) * 100;

        const pendingProjects = yearData.filter(d => d.status.includes('대기') || d.status.includes('진행'));
        const highValuePending = pendingProjects.sort((a, b) => b.estimateAmount - a.estimateAmount).slice(0, 2);

        const results = [];

        // Target Insight
        if (achievementRate < 50) {
            results.push({
                type: 'warning',
                icon: <AlertTriangle size={18} />,
                title: '목표 달성 주의보',
                text: `현재 달성률이 ${achievementRate.toFixed(1)}%로 저조합니다. 대형 프로젝트 수주를 위한 적극적인 작전이 필요합니다.`
            });
        } else {
            results.push({
                type: 'success',
                icon: <TrendingUp size={18} />,
                title: '순조로운 작전 진행',
                text: `목표의 ${achievementRate.toFixed(1)}%를 달성했습니다. 현재 페이스를 유지하면 목표 초과 달성이 가능합니다.`
            });
        }

        // Project Insight
        if (highValuePending.length > 0) {
            results.push({
                type: 'info',
                icon: <Target size={18} />,
                title: '핵심 타겟 분석',
                text: `${highValuePending[0].customer}의 '${highValuePending[0].project}' 건이 가장 큰 비중을 차지하고 있습니다. 조기 마감 전략을 추천합니다.`
            });
        }

        return results;
    }, [salesData, yearlyTargets, displayYear]);

    return (
        <div className="ai-insights-container glass">
            <div className="insights-header">
                <Sparkles size={20} className="sparkle-icon" />
                <h4>AI 전략 브리핑</h4>
            </div>
            <div className="insights-list">
                {insights.map((insight, idx) => (
                    <div key={idx} className={`insight-card ${insight.type}`}>
                        <div className="insight-icon">{insight.icon}</div>
                        <div className="insight-body">
                            <h5>{insight.title}</h5>
                            <p>{insight.text}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AIInsights;
