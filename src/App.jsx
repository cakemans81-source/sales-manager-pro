import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './App.css';
import { supabase } from './lib/supabase';

const DEFAULT_ADMIN = { id: 'admin', password: '@skw208025', name: '대표님', role: 'admin', isApproved: true };

function App() {
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('smp_session_user');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });
    const [users, setUsers] = useState(() => {
        try {
            const saved = localStorage.getItem('smp_users_cache');
            return saved ? JSON.parse(saved) : [DEFAULT_ADMIN];
        } catch {
            return [DEFAULT_ADMIN];
        }
    });

    // 초기 데이터 로드 및 Supabase 동기화
    useEffect(() => {
        const fetchUsers = async () => {
            if (!supabase) {
                const savedUsers = localStorage.getItem('smp_users');
                if (savedUsers) setUsers(JSON.parse(savedUsers));
                return;
            }

            const { data, error } = await supabase.from('user_accounts').select('*');
            if (!error && data && data.length > 0) {
                // employeeId를 id로 매핑 (기존 로직 호환)
                const mapped = data.map(u => ({
                    ...u,
                    id: u.employeeId
                }));
                // 어드민은 항상 포함 (보안책)
                if (!mapped.find(u => u.id === 'admin')) {
                    mapped.push(DEFAULT_ADMIN);
                }
                setUsers(mapped);
                localStorage.setItem('smp_users_cache', JSON.stringify(mapped));
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        localStorage.setItem('smp_users_cache', JSON.stringify(users));
        if (!supabase) {
            localStorage.setItem('smp_users', JSON.stringify(users));
        }
    }, [users]);

    const handleLogin = (userData) => {
        setUser(userData);
        localStorage.setItem('smp_session_user', JSON.stringify(userData));
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('smp_session_user');
    };

    const handleSignup = async (newUser) => {
        if (users.find(u => u.id === newUser.id)) {
            return { success: false, message: '이미 존재하는 아이디입니다.' };
        }

        const userToRegister = {
            employeeId: newUser.id,
            password: newUser.password,
            name: newUser.name,
            role: 'viewer',
            status: 'pending',
            isApproved: false
        };

        if (supabase) {
            const { error } = await supabase.from('user_accounts').insert([userToRegister]);
            if (error) return { success: false, message: '클라우드 저장 실패: ' + error.message };
        }

        setUsers([...users, { ...userToRegister, id: newUser.id }]);
        return { success: true, message: '가입 신청이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.' };
    };

    const handleApproveUser = async (userId, role) => {
        if (supabase) {
            await supabase.from('user_accounts').update({ isApproved: true, role: role, status: 'active' }).eq('employeeId', userId);
        }
        setUsers(users.map(u => u.id === userId ? { ...u, isApproved: true, role: role || u.role } : u));
    };

    const handleRejectUser = async (userId) => {
        if (supabase) {
            await supabase.from('user_accounts').delete().eq('employeeId', userId);
        }
        setUsers(users.filter(u => u.id !== userId));
    };

    const handleChangeUserRole = async (userId, newRole) => {
        if (supabase) {
            await supabase.from('user_accounts').update({ role: newRole }).eq('employeeId', userId);
        }
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    };

    const handleUpdateUser = async (userId, updatedData) => {
        if (supabase) {
            const { error } = await supabase.from('user_accounts').update({
                name: updatedData.name,
                password: updatedData.password
            }).eq('employeeId', userId);
            if (error) throw error;
        }
        setUsers(users.map(u => u.id === userId ? { ...u, ...updatedData } : u));
    };

    return (
        <HashRouter>
            <div className="app-container">
                {!user ? (
                    <Login
                        onLogin={handleLogin}
                        onSignup={handleSignup}
                        users={users}
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
                            onUpdateUser: handleUpdateUser,
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
