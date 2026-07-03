import React, { useState } from 'react';
import { Eye, Edit3, UserX, Settings, X, ShieldCheck } from 'lucide-react';

const AdminTab = ({
    users,
    onApproveUser,
    onRejectUser,
    onChangeUserRole,
    onUpdateUser,
    setNotification,
    roleNames
}) => {
    const [editingUser, setEditingUser] = useState(null);
    const [passwordForm, setPasswordForm] = useState({ new: '' });

    return (
        <div className="animate-fade">
            <header className="content-header">
                <div>
                    <h2>사용 인원 통합 관리 🛡️</h2>
                    <p>사용 인원의 가입을 승인하고 권한을 관리합니다.</p>
                </div>
            </header>

            <section className="admin-section glass-card">
                <div className="section-header">
                    <h3>신규 사용자 승인 대기 ({users.filter(u => !u.isApproved).length})</h3>
                </div>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr><th>이름</th><th>아이디</th><th>상태</th><th>액션 (권한 설정)</th></tr>
                        </thead>
                        <tbody>
                            {users.filter(u => !u.isApproved).map(u => (
                                <tr key={u.id}>
                                    <td style={{ fontWeight: '600' }}>{u.name}</td>
                                    <td>{u.id}</td>
                                    <td><span className="status-badge warning">검증 필요</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn-icon approve" onClick={() => onApproveUser(u.id, 'viewer')} title="열람 전용 승인"><Eye size={16} /> {roleNames.viewer} 승인</button>
                                            <button className="btn-icon approve" style={{ borderColor: '#818cf8', color: '#818cf8' }} onClick={() => onApproveUser(u.id, 'editor')} title="작성 가능 승인"><Edit3 size={16} /> {roleNames.editor} 승인</button>
                                            <button className="btn-icon reject" onClick={() => onRejectUser(u.id)} title="거절"><UserX size={16} /> 반려</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.filter(u => !u.isApproved).length === 0 && (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>현재 승인 대기 중인 사용자가 없습니다.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="admin-section glass-card" style={{ marginTop: '2rem' }}>
                <div className="section-header">
                    <h3>등록 인원 명부 및 관리</h3>
                </div>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr><th>이름</th><th>아이디</th><th>권한 구분</th><th>상태</th><th>액션</th></tr>
                        </thead>
                        <tbody>
                            {users.filter(u => u.isApproved).map(u => (
                                <tr key={u.id}>
                                    <td style={{ fontWeight: '600' }}>{u.name}</td>
                                    <td>{u.id}</td>
                                    <td>{roleNames[u.role]}</td>
                                    <td><span className="status-badge success">활성</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <button className="btn-icon" onClick={() => { setEditingUser(u); setPasswordForm({ new: '' }); }} style={{ borderColor: '#6366f1', color: '#6366f1' }}>
                                                <Settings size={14} /> 정보 수정
                                            </button>
                                            {u.role !== 'admin' && (
                                                <select
                                                    className="input-field minimal"
                                                    value={u.role}
                                                    onChange={(e) => onChangeUserRole(u.id, e.target.value)}
                                                    style={{ padding: '0.3rem', fontSize: '0.75rem', width: 'auto' }}
                                                >
                                                    <option value="viewer">{roleNames.viewer}</option>
                                                    <option value="editor">{roleNames.editor}</option>
                                                </select>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 사용자 정보 수정 모달 (Admin 전용) */}
            {editingUser && (
                <div className="modal-overlay">
                    <div className="modal-content glass" style={{ width: '400px' }}>
                        <div className="modal-header"><h3>사용자 정보 수정</h3><button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', color: '#94a3b8' }}><X /></button></div>
                        <div className="input-group"><label>이름</label><input type="text" id="edit-user-name" className="input-field" defaultValue={editingUser.name} /></div>
                        <div className="input-group"><label>비밀번호 초기화/변경</label><input type="text" className="input-field" placeholder="새 비밀번호 입력" value={passwordForm.new} onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })} /></div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                            <button className="btn btn-ghost" onClick={() => setEditingUser(null)}>취소</button>
                            <button className="btn btn-primary" onClick={async () => {
                                const newName = document.getElementById('edit-user-name').value;
                                try {
                                    await onUpdateUser(editingUser.id, { name: newName, password: passwordForm.new || editingUser.password });
                                    setNotification({ type: 'success', message: `${editingUser.name} 사용자 정보가 클라우드에 업데이트되었습니다.` });
                                    setEditingUser(null);
                                } catch (err) {
                                    setNotification({ type: 'error', message: '업데이트 실패: ' + err.message });
                                }
                            }}>변경 승인</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTab;
