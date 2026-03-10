import React from 'react';

const StatGrid = ({ displayYear, yearTotalRev, targetRevenue, salesData, years, setSelectedYears }) => {
    const achievementRate = Math.round((yearTotalRev / targetRevenue) * 100) || 0;

    return (
        <section className="stats-grid">
            <div className="glass-card stat-item-wide">


                <div className="revenue-main-display">
                    <div className="rev-side left">
                        <span className="rev-label">매출목표</span>
                        <span className="rev-amount target">₩{targetRevenue.toLocaleString()}</span>
                    </div>

                    <div className="rev-center">
                        <div className="achievement-circle">
                            <span className="achieve-percent">{achievementRate}%</span>
                            <span className="achieve-text">목표 달성율</span>
                        </div>
                    </div>

                    <div className="rev-side right">
                        <span className="rev-label">현재 누적실적</span>
                        <span className="rev-amount actual">₩{yearTotalRev.toLocaleString()}</span>
                    </div>
                </div>

                <div className="progress-container-premium">
                    <div className="progress-bg">
                        <div className="progress-fill" style={{ width: `${Math.min(100, achievementRate)}%` }}></div>
                    </div>
                </div>
            </div>


        </section>
    );
};

export default StatGrid;
