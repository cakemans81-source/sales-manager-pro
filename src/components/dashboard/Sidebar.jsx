import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, ShieldCheck, Settings, LogOut, X, ChevronDown, ChevronRight, Briefcase, TrendingUp, CreditCard, Users, Kanban, FileText, ArrowLeftRight } from 'lucide-react';

const Sidebar = ({ user, onLogout, activeTab, setActiveTab, users, roleNames, isSidebarOpen, setIsSidebarOpen, companyMode }) => {
    const navigate = useNavigate();
    const isGachi = companyMode === 'gachi';

    const [openMenus, setOpenMenus] = useState({
        sales: true,
        execution: true,
        settlement: true,
    });

    useEffect(() => {
        if (['estimates', 'pending'].includes(activeTab)) setOpenMenus(prev => ({ ...prev, sales: true }));
        if (['commencement', 'closing'].includes(activeTab)) setOpenMenus(prev => ({ ...prev, execution: true }));
        if (activeTab === 'tax_invoice' || activeTab === 'collection') setOpenMenus(prev => ({ ...prev, settlement: true }));
    }, [activeTab]);

    const toggleMenu = (menu) => {
        setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
    };

    const handleCompanySwitch = () => {
        if (isGachi) {
            navigate('/iru');
        } else {
            navigate('/gachi');
        }
    };

    // 회사별 테마
    const accent = isGachi ? '#f59e0b' : '#818cf8';
    const accentBg = isGachi ? 'rgba(245,158,11,0.12)' : 'rgba(129,140,248,0.12)';
    const companyName = isGachi ? '(주)가치' : '(주)이루';
    const otherCompany = isGachi ? '(주)이루' : '(주)가치';

    return (
        <aside className={`sidebar glass ${isSidebarOpen ? 'mobile-open' : ''}`}>
            <div className="sidebar-brand">
                {isGachi ? (
                    <div className="iru-logo-container">
                        <div style={{
                            width: '42px', height: '42px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.1rem', fontWeight: '900', color: '#fff',
                            letterSpacing: '-0.5px', flexShrink: 0,
                        }}>G</div>
                        <div className="iru-text">
                            <span className="iru-name" style={{ color: '#f59e0b' }}>GACHI</span>
                            <span className="iru-slogan" style={{ color: '#d97706', opacity: 0.7 }}>VALUE BEYOND MEASURE</span>
                        </div>
                    </div>
                ) : (
                    <div className="iru-logo-container">
                        <div className="iru-symbol">
                            <span className="i">i</span>
                            <span className="R">R</span>
                            <div className="iru-circle"></div>
                        </div>
                        <div className="iru-text">
                            <span className="iru-name">IRU</span>
                            <span className="iru-slogan">LET'S MAKE IT HAPPEN</span>
                        </div>
                    </div>
                )}
                <button className="mobile-close-btn" onClick={() => setIsSidebarOpen(false)}>
                    <X size={24} />
                </button>
            </div>

            {/* ── 회사 전환 버튼 ── */}
            <div style={{ padding: '0 0.6rem', marginBottom: '0.4rem' }}>
                <button
                    onClick={handleCompanySwitch}
                    style={{
                        width: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        padding: '0.5rem 0.8rem',
                        borderRadius: '10px',
                        border: `1px solid ${isGachi ? 'rgba(129,140,248,0.4)' : 'rgba(245,158,11,0.4)'}`,
                        background: isGachi ? 'rgba(129,140,248,0.08)' : 'rgba(245,158,11,0.08)',
                        color: isGachi ? '#818cf8' : '#f59e0b',
                        cursor: 'pointer',
                        fontSize: '0.78rem', fontWeight: '700',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = `0 0 12px ${isGachi ? 'rgba(129,140,248,0.3)' : 'rgba(245,158,11,0.3)'}` }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                    <ArrowLeftRight size={15} />
                    {otherCompany}로 전환
                </button>
            </div>

            <nav className="sidebar-nav">
                <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
                    style={activeTab === 'dashboard' && isGachi ? { borderLeft: `3px solid ${accent}`, background: `linear-gradient(135deg, ${accentBg} 0%, transparent 100%)` } : {}}>
                    <LayoutDashboard size={20} /> 대시보드
                </button>

                <button className={`nav-item ${activeTab === 'status' ? 'active' : ''}`} onClick={() => { setActiveTab('status'); setIsSidebarOpen(false); }}
                    style={{
                        fontSize: '0.82rem',
                        ...(activeTab === 'status' && isGachi ? { borderLeft: `3px solid ${accent}`, background: `linear-gradient(135deg, ${accentBg} 0%, transparent 100%)` } : {}),
                    }}>
                    <ClipboardList size={20} /> {companyName} 프로젝트 통합 현황
                </button>

                {/* --- 영업 단계 관리 --- */}
                <div className={`nav-group ${openMenus.sales ? 'open' : ''}`}>
                    <button className="nav-group-header" onClick={() => toggleMenu('sales')}
                        style={isGachi ? { color: accent, opacity: 0.85 } : {}}>
                        <div className="header-title">
                            <Briefcase size={18} /> <span>프로젝트 영업 관리</span>
                        </div>
                        {openMenus.sales ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <div className="nav-sub-items">
                        <button className={`nav-item sub ${activeTab === 'estimates' ? 'active' : ''}`} onClick={() => { setActiveTab('estimates'); setIsSidebarOpen(false); }}
                            style={isGachi && activeTab === 'estimates' ? { borderLeft: `2px solid ${accent}` } : {}}>
                            견적서 제출 현황
                        </button>
                        <button className={`nav-item sub ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => { setActiveTab('pending'); setIsSidebarOpen(false); }}
                            style={isGachi && activeTab === 'pending' ? { borderLeft: `2px solid ${accent}` } : {}}>
                            업체 미선정 현황
                        </button>
                    </div>
                </div>

                {/* --- 수행 단계 관리 --- */}
                <div className={`nav-group ${openMenus.execution ? 'open' : ''}`}>
                    <button className="nav-group-header" onClick={() => toggleMenu('execution')}
                        style={isGachi ? { color: accent, opacity: 0.85 } : {}}>
                        <div className="header-title">
                            <TrendingUp size={18} /> <span>프로젝트 수행 관리</span>
                        </div>
                        {openMenus.execution ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <div className="nav-sub-items">
                        <button className={`nav-item sub ${activeTab === 'commencement' ? 'active' : ''}`} onClick={() => { setActiveTab('commencement'); setIsSidebarOpen(false); }}
                            style={isGachi && activeTab === 'commencement' ? { borderLeft: `2px solid ${accent}` } : {}}>
                            착수 완료 현황
                        </button>
                        <button className={`nav-item sub ${activeTab === 'closing' ? 'active' : ''}`} onClick={() => { setActiveTab('closing'); setIsSidebarOpen(false); }}
                            style={isGachi && activeTab === 'closing' ? { borderLeft: `2px solid ${accent}` } : {}}>
                            완료 마감 대기 현황
                        </button>
                    </div>
                </div>

                {/* --- 정산 관리 --- */}
                <div className={`nav-group ${openMenus.settlement ? 'open' : ''}`}>
                    <button className="nav-group-header" onClick={() => toggleMenu('settlement')}
                        style={isGachi ? { color: accent, opacity: 0.85 } : {}}>
                        <div className="header-title">
                            <CreditCard size={18} /> <span>정산 및 완료 관리</span>
                        </div>
                        {openMenus.settlement ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <div className="nav-sub-items">
                        <button className={`nav-item sub ${activeTab === 'tax_invoice' ? 'active' : ''}`} onClick={() => { setActiveTab('tax_invoice'); setIsSidebarOpen(false); }}
                            style={isGachi && activeTab === 'tax_invoice' ? { borderLeft: `2px solid ${accent}` } : {}}>
                            세금계산서 발행 완료
                        </button>
                        <button className={`nav-item sub ${activeTab === 'collection' ? 'active' : ''}`} onClick={() => { setActiveTab('collection'); setIsSidebarOpen(false); }}
                            style={isGachi && activeTab === 'collection' ? { borderLeft: `2px solid ${accent}` } : {}}>
                            수금 완료
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── 회사소개서 리뉴얼 진입 버튼 ── */}
            <div style={{ padding: '0.5rem 0.6rem 0.2rem' }}>
                <button
                    onClick={() => { setActiveTab('company_intro'); setIsSidebarOpen(false); }}
                    style={{
                        width: '100%',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.6rem 0.9rem',
                        borderRadius: '10px', border: 'none',
                        background: activeTab === 'company_intro'
                            ? 'linear-gradient(135deg, #6366f1, #818cf8)'
                            : 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(129,140,248,0.1))',
                        color: activeTab === 'company_intro' ? '#fff' : '#6366f1',
                        cursor: 'pointer', fontSize: '0.8rem', fontWeight: '800',
                        boxShadow: activeTab === 'company_intro'
                            ? '0 4px 16px rgba(99,102,241,0.4)'
                            : '0 2px 8px rgba(99,102,241,0.12)',
                        transition: 'all 0.2s', letterSpacing: '0.01em',
                        border: activeTab === 'company_intro' ? 'none' : '1px solid rgba(99,102,241,0.25)',
                    }}
                    onMouseEnter={e => { if (activeTab !== 'company_intro') { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(129,140,248,0.18))'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.22)'; } }}
                    onMouseLeave={e => { if (activeTab !== 'company_intro') { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(129,140,248,0.1))'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(99,102,241,0.12)'; } }}
                >
                    ✨ 회사소개서 리뉴얼
                </button>
            </div>

            {/* ── 최하단 고정 메뉴 영역 ── */}
            <div className="sidebar-bottom-nav">
                <div className="nav-divider" style={{ margin: '0 0 0.5rem' }}></div>
                <button className={`nav-item ${activeTab === 'contacts' ? 'active' : ''}`} onClick={() => { setActiveTab('contacts'); setIsSidebarOpen(false); }}>
                    <Users size={18} /> 고객사 담당자 관리
                </button>
                <button className={`nav-item ${activeTab === 'quotation' ? 'active' : ''}`} onClick={() => { setActiveTab('quotation'); setIsSidebarOpen(false); }}>
                    <FileText size={18} /> 견적서 작성 도우미
                </button>
                {user.role === 'admin' && (
                    <button className={`nav-item mobile-hide ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => { setActiveTab('admin'); setIsSidebarOpen(false); }}>
                        <ShieldCheck size={18} /> 사용 인원 관리
                        {users.filter(u => !u.isApproved).length > 0 && <span className="admin-badge">{users.filter(u => !u.isApproved).length}</span>}
                    </button>
                )}
                <button className={`nav-item mobile-hide ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}>
                    <Settings size={18} /> 환경설정
                </button>
            </div>

            <div className="sidebar-footer">
                <div className="user-info">
                    <div className="user-avatar" style={isGachi ? { background: 'linear-gradient(135deg, #f59e0b, #d97706)' } : {}}>{user.name[0]}</div>
                    <div className="user-details">
                        <span className="user-name">{user.name}</span>
                        <span className="user-role">{roleNames[user.role]}</span>
                    </div>
                </div>
                <button className="btn-logout" onClick={onLogout} title="로그아웃"><LogOut size={18} /></button>
            </div>
        </aside>
    );
};

export default Sidebar;
