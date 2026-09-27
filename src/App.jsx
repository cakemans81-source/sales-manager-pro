import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './App.css';
import { supabase, setAuthToken } from './lib/supabase';
import * as auth from './lib/auth';

const SESSION_KEY = 'smp_session_user';

// 예전 버전이 남긴 키 제거: 비밀번호 포함 사용자 캐시, 삭제된 회사소개서 편집기 데이터
['smp_users_cache', 'smp_users', 'smp_company_intro_external_deck_v1'].forEach(key => {
    try { localStorage.removeItem(key); } catch { /* 저장소 접근 불가 시 무시 */ }
});

const loadSession = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
        // 서버 세션 토큰이 없는 예전 세션(비밀번호 포함 가능)은 폐기하고 재로그인 요구
        if (!saved || (supabase && !saved.token) || 'password' in saved) {
            localStorage.removeItem(SESSION_KEY);
            return null;
        }
        // 첫 데이터 조회(대시보드)보다 먼저 요청 헤더에 토큰이 실리도록 동기적으로 설정
        setAuthToken(saved.token);
        return saved;
    } catch {
        return null;
    }
};

function App() {
    const [user, setUser] = useState(loadSession);
    const [users, setUsers] = useState([]);

    const handleLogout = useCallback(() => {
        auth.logout(user?.token);
        setAuthToken(null);
        setUser(null);
        setUsers([]);
        localStorage.removeItem(SESSION_KEY);
    }, [user?.token]);

    // 관리자 전용: 사용자 목록은 서버에서 비밀번호 없이 받아온다
    const refreshUsers = useCallback(async () => {
        if (!supabase || user?.role !== 'admin' || !user?.token) return;
        try {
            const list = await auth.adminListUsers(user.token);
            setUsers(Array.isArray(list) ? list : []);
        } catch (err) {
            if (auth.isSessionExpiredError(err)) handleLogout();
            else console.error('사용자 목록 조회 실패:', err);
        }
    }, [user?.role, user?.token, handleLogout]);

    useEffect(() => { refreshUsers(); }, [refreshUsers]);

    // 복원된 세션이 서버에서 만료됐으면(RLS가 빈 목록만 돌려주므로) 로그아웃해 재로그인 유도
    useEffect(() => {
        if (!supabase || !user?.token) return;
        auth.validateSession().then(valid => { if (valid === false) handleLogout(); });
    }, [user?.token, handleLogout]);

    const handleLogin = async (employeeId, password) => {
        const result = await auth.login(employeeId, password);
        if (result.success) {
            setAuthToken(result.user.token);
            setUser(result.user);
            localStorage.setItem(SESSION_KEY, JSON.stringify(result.user));
        }
        return result;
    };

    const handleSignup = (newUser) => auth.signup(newUser);

    // 관리자 작업 공통 처리: 실행 후 목록 갱신, 세션 만료 시 로그아웃
    const runAdmin = async (fn) => {
        try {
            const result = await fn(user.token);
            await refreshUsers();
            return result;
        } catch (err) {
            if (auth.isSessionExpiredError(err)) handleLogout();
            throw err;
        }
    };

    const handleApproveUser = (userId, role) => runAdmin(token => auth.adminApproveUser(token, userId, role || 'viewer'));
    const handleRejectUser = (userId) => runAdmin(token => auth.adminRejectUser(token, userId));
    const handleChangeUserRole = (userId, newRole) => runAdmin(token => auth.adminChangeRole(token, userId, newRole));
    const handleDeactivateUser = (userId) => runAdmin(token => auth.adminDeactivateUser(token, userId));
    const handleUpdateUser = (userId, updatedData) =>
        runAdmin(token => auth.adminUpdateUser(token, userId, updatedData.name, updatedData.password));

    // 본인 비밀번호 변경 (현재 비밀번호는 서버에서 검증)
    const handleChangeOwnPassword = async (current, next) => {
        const result = await auth.changePassword(user.token, current, next);
        if (!result.success && result.message.includes('SESSION_EXPIRED')) handleLogout();
        return result;
    };

    return (
        <HashRouter>
            <div className="app-container">
                {!user ? (
                    <Login
                        onLogin={handleLogin}
                        onSignup={handleSignup}
                    />
                ) : (
                    (() => {
                        const dashboardProps = {
                            user,
                            onLogout: handleLogout,
                            users: user.role === 'admin' ? users : [],
                            onApproveUser: handleApproveUser,
                            onRejectUser: handleRejectUser,
                            onChangeUserRole: handleChangeUserRole,
                            onDeactivateUser: handleDeactivateUser,
                            onUpdateUser: handleUpdateUser,
                            onChangeOwnPassword: handleChangeOwnPassword,
                        };
                        return (
                            <Routes>
                                <Route path="/iru" element={<Dashboard {...dashboardProps} companyMode="iru" />} />
                                <Route path="/gachi" element={<Dashboard {...dashboardProps} companyMode="gachi" />} />
                                <Route path="*" element={<Navigate to="/iru" replace />} />
                            </Routes>
                        );
                    })()
                )}
            </div>
        </HashRouter>
    );
}

export default App;
