import React, { useState } from 'react';
import { Database, Save, Cloud, Target, Lock, Loader, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

// 쉬표 포맷 변환 호모함수
const fmtTarget = (v) => {
    if (!v && v !== 0) return '';
    return Number(v).toLocaleString('ko-KR');
};
const parseTarget = (str) => {
    const num = parseInt(str.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
};

const SettingsTab = ({
    supabase,
    config,
    setConfig,
    setNotification,
    yearlyTargets,
    setYearlyTargets,
    years,
    passwordForm,
    setPasswordForm,
    handleUpdatePassword
}) => {
    // 비밀번호 입력 표시 토글
    const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
    // 폼 제출 중 로딩 상태 (버튼 중복 클릭 방지)
    const [pwLoading, setPwLoading] = useState(false);
    // 인라인 피드백 (에러/성공 메시지)
    const [pwFeedback, setPwFeedback] = useState({ type: '', message: '' });

    // 실시간 새 비밀번호 일치 여부 표시
    const pwMatch = passwordForm.confirm
        ? passwordForm.new === passwordForm.confirm
        : null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setPwFeedback({ type: '', message: '' });

        // ── 1. 클라이언트 사이드 검증 (빠른 피드백) ──
        if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
            setPwFeedback({ type: 'error', message: '모든 항목을 입력해 주세요.' });
            return;
        }
        if (passwordForm.new !== passwordForm.confirm) {
            setPwFeedback({ type: 'error', message: '새 비밀번호가 일치하지 않습니다.' });
            return;
        }
        if (passwordForm.new.length < 4) {
            setPwFeedback({ type: 'error', message: '비밀번호는 4자 이상이어야 합니다.' });
            return;
        }

        // ── 2. 실제 업데이트 (Dashboard의 handleUpdatePassword 호출) ──
        setPwLoading(true);
        try {
            // handleUpdatePassword는 async 함수, 내부에서 setNotification 호출
            // 여기서는 추가로 인라인 피드백도 표시
            await handleUpdatePassword(e);
            // 성공 시 (handleUpdatePassword가 에러 없이 완료됨): 인라인 성공 메시지
            // (Dashboard가 이미 toast를 띄우므로 여기선 간단히 처리)
            setPwFeedback({ type: 'success', message: '비밀번호가 성공적으로 변경되었습니다! 다음 로그인부터 새 비밀번호를 사용하세요.' });
        } catch (err) {
            setPwFeedback({ type: 'error', message: err.message || '변경 중 오류가 발생했습니다.' });
        } finally {
            setPwLoading(false);
        }
    };

    return (
        <div className="animate-fade">
            <header className="content-header">
                <div>
                    <h2>시스템 환경설정 ⚙️</h2>
                    <p>데이터 연동 및 대시보드 옵션을 관리합니다.</p>
                </div>
            </header>
            <div className="settings-grid">

                {/* ── 클라우드 연동 ── */}
                <section className="glass-card settings-section">
                    <div className="section-header">
                        <h3>
                            <Database size={18} style={{ marginRight: '8px', color: '#6366f1' }} />
                            {supabase ? '클라우드 연동중 (중앙 제어)' : '클라우드 데이터 연동 (Supabase)'}
                        </h3>
                        {supabase && <span className="status-badge success" style={{ fontSize: '0.6rem', marginLeft: '8px' }}>시스템 활성</span>}
                    </div>
                    <div className="settings-content">
                        <div className="settings-desc" style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
                            {supabase
                                ? "Vercel 환경변수를 통해 중앙 지휘소와 연결되었습니다. 모든 팀원이 데이터를 공유합니다."
                                : "데이터 소스를 동기화하려면 정보를 입력하세요."}
                        </div>
                        {!supabase && (
                            <>
                                <div className="input-group"><label>URL</label><input type="text" className="input-field" value={config.supabaseUrl} onChange={(e) => setConfig({ ...config, supabaseUrl: e.target.value })} /></div>
                                <div className="input-group"><label>Anon Key</label><input type="password" className="input-field" value={config.supabaseAnonKey} onChange={(e) => setConfig({ ...config, supabaseAnonKey: e.target.value })} /></div>
                                <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={() => setNotification({ type: 'success', message: '설정 저장 완료!' })}><Save size={18} /> API 설정 저장</button>
                            </>
                        )}
                        {supabase && (
                            <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                <p style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                    <Cloud size={14} /> 실시간 네트워크 동기화 가동 중
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── 인터페이스 & 목표 설정 ── */}
                <section className="glass-card settings-section">
                    <div className="section-header"><h3>🎨 인터페이스 &amp; 목표 설정</h3></div>
                    <div className="setting-toggle-item"><span>컴팩트 뷰</span><button className={`toggle ${config.isCompactView ? 'active' : ''}`} onClick={() => setConfig({ ...config, isCompactView: !config.isCompactView })}></button></div>

                    <div style={{ marginTop: '1.5rem' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Target size={16} /> 연도별 매출 목표액 (₩)
                        </h4>
                        <div style={{ display: 'grid', gap: '0.8rem' }}>
                            {years.map(year => (
                                <div key={year} className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <label style={{ width: '60px', marginBottom: 0 }}>{year}년</label>
                                    <div style={{ flex: 1, position: 'relative' }}>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            className="input-field minimal"
                                            value={fmtTarget(yearlyTargets[year])}
                                            onChange={(e) => {
                                                const raw = parseTarget(e.target.value);
                                                setYearlyTargets({ ...yearlyTargets, [year]: raw });
                                            }}
                                            placeholder="목표액 입력"
                                            style={{ width: '100%', paddingRight: '3.2rem' }}
                                        />
                                        {yearlyTargets[year] > 0 && (
                                            <span style={{
                                                position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                                                fontSize: '0.68rem', color: '#475569', pointerEvents: 'none', whiteSpace: 'nowrap'
                                            }}>
                                                ₩{(yearlyTargets[year] / 100000000).toFixed(1)}억
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── 보안 및 본인인증 ── */}
                <section className="glass-card settings-section">
                    <div className="section-header">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Lock size={18} color="#818cf8" /> 보안 및 본인인증
                        </h3>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* 현재 비밀번호 */}
                        <div className="input-group">
                            <label>현재 비밀번호</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPw.current ? 'text' : 'password'}
                                    className="input-field"
                                    placeholder="현재 비밀번호 입력"
                                    value={passwordForm.current}
                                    onChange={(e) => {
                                        setPasswordForm({ ...passwordForm, current: e.target.value });
                                        setPwFeedback({ type: '', message: '' });
                                    }}
                                    style={{ paddingRight: '2.8rem' }}
                                />
                                <button type="button" onClick={() => setShowPw(p => ({ ...p, current: !p.current }))}
                                    style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}>
                                    {showPw.current ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* 새 비밀번호 */}
                        <div className="input-group">
                            <label>새 비밀번호 <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '400' }}>(4자 이상)</span></label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPw.new ? 'text' : 'password'}
                                    className="input-field"
                                    placeholder="새 비밀번호 입력"
                                    value={passwordForm.new}
                                    onChange={(e) => {
                                        setPasswordForm({ ...passwordForm, new: e.target.value });
                                        setPwFeedback({ type: '', message: '' });
                                    }}
                                    style={{ paddingRight: '2.8rem' }}
                                />
                                <button type="button" onClick={() => setShowPw(p => ({ ...p, new: !p.new }))}
                                    style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}>
                                    {showPw.new ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* 비밀번호 재확인 */}
                        <div className="input-group">
                            <label>
                                비밀번호 재확인
                                {/* 실시간 일치 여부 표시 */}
                                {pwMatch === true && (
                                    <span style={{ marginLeft: '0.5rem', color: '#10b981', fontSize: '0.75rem', fontWeight: '600' }}>
                                        ✓ 일치
                                    </span>
                                )}
                                {pwMatch === false && (
                                    <span style={{ marginLeft: '0.5rem', color: '#ef4444', fontSize: '0.75rem', fontWeight: '600' }}>
                                        ✗ 불일치
                                    </span>
                                )}
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPw.confirm ? 'text' : 'password'}
                                    className="input-field"
                                    placeholder="새 비밀번호 재입력"
                                    value={passwordForm.confirm}
                                    onChange={(e) => {
                                        setPasswordForm({ ...passwordForm, confirm: e.target.value });
                                        setPwFeedback({ type: '', message: '' });
                                    }}
                                    style={{
                                        paddingRight: '2.8rem',
                                        borderColor: pwMatch === false
                                            ? 'rgba(239,68,68,0.5)'
                                            : pwMatch === true
                                                ? 'rgba(16,185,129,0.5)'
                                                : undefined
                                    }}
                                />
                                <button type="button" onClick={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))}
                                    style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}>
                                    {showPw.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* 인라인 피드백 메시지 */}
                        {pwFeedback.message && (
                            <div style={{
                                display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                                padding: '0.75rem 1rem',
                                borderRadius: '10px',
                                background: pwFeedback.type === 'success'
                                    ? 'rgba(16,185,129,0.08)'
                                    : 'rgba(239,68,68,0.08)',
                                border: `1px solid ${pwFeedback.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                            }}>
                                {pwFeedback.type === 'success'
                                    ? <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '1px' }} />
                                    : <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} />}
                                <span style={{
                                    fontSize: '0.82rem',
                                    color: pwFeedback.type === 'success' ? '#10b981' : '#ef4444',
                                    lineHeight: 1.5
                                }}>
                                    {pwFeedback.message}
                                </span>
                            </div>
                        )}

                        {/* 제출 버튼 */}
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={pwLoading || pwMatch === false}
                            style={{
                                width: '100%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                opacity: (pwLoading || pwMatch === false) ? 0.65 : 1,
                                cursor: pwLoading ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {pwLoading
                                ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> 변경 중...</>
                                : <><Lock size={16} /> 비밀번호 변경 적용</>
                            }
                        </button>
                    </form>
                </section>

            </div>
        </div>
    );
};

export default SettingsTab;
