import React, { useState } from 'react';
import { UserPlus, UserMinus, UserCheck, Search, Building, Phone, Briefcase, User, FileSpreadsheet, Upload, Download, Users, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';

const ContactsTab = ({ canEdit, supabase, fetchContactsData, contactsData, setNotification, salesData = [], onSyncContact }) => {
    const [isAddMode, setIsAddMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        team: '',
        position: '',
        phone: '',
        customer: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [editingOriginalName, setEditingOriginalName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [syncProjects, setSyncProjects] = useState(true); // 프로젝트 동기화 여부

    const filteredContacts = contactsData.filter(c =>
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.customer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.team || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 이름으로 연결된 프로젝트 수 계산
    const getLinkedProjectCount = (contactName) => {
        if (!salesData.length) return 0;
        return salesData.filter(p =>
            p.customerContact === contactName || p.customerContact2 === contactName
        ).length;
    };

    const downloadTemplate = () => {
        const templateData = [
            { "성함": "홍길동", "고객사": "삼성전자", "소속팀": "디스플레이사업부", "직급": "책임연구원", "연락처": "010-1234-5678" }
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "담당자_업로드_양식");
        XLSX.writeFile(wb, "IRU_Contacts_Upload_Template.xlsx");
    };

    const handleExcelUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !supabase) {
            if (!supabase) setNotification({ type: 'error', message: '클라우드 연결이 필요합니다.' });
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                const mappedData = jsonData.map(item => ({
                    name: item["성함"] || '',
                    customer: item["고객사"] || '',
                    team: item["소속팀"] || '',
                    position: item["직급"] || '',
                    phone: item["연락처"] || ''
                })).filter(item => item.name && item.customer);

                if (mappedData.length === 0) throw new Error("유효한 데이터가 없습니다.");

                const { error } = await supabase.from('customer_contacts').insert(mappedData);
                if (error) throw error;

                setNotification({ type: 'success', message: `${mappedData.length}건의 담당자 정보 업로드 완료` });
                fetchContactsData();
            } catch (error) {
                console.error('Excel Upload Error:', error);
                setNotification({ type: 'error', message: `업로드 실패: ${error.message}` });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            if (supabase) {
                const { error } = editingId
                    ? await supabase.from('customer_contacts').update(formData).eq('id', editingId)
                    : await supabase.from('customer_contacts').insert([formData]);

                if (error) {
                    if (error.message.includes('schema cache') || error.message.includes('not find')) {
                        throw new Error('TABLE_NOT_FOUND');
                    }
                    throw error;
                }
                setNotification({ type: 'success', message: '클라우드 저장 완료' });
            } else {
                throw new Error('NO_SUPABASE');
            }

            // ── 프로젝트 동기화: 수정 모드 + syncProjects 체크된 경우 ──
            if (editingId && syncProjects && editingOriginalName && onSyncContact) {
                await onSyncContact(editingOriginalName, formData);
            }

            setFormData({ name: '', team: '', position: '', phone: '', customer: '' });
            setEditingOriginalName('');
            setIsAddMode(false);
            setEditingId(null);
            fetchContactsData();
        } catch (error) {
            if (error.message === 'TABLE_NOT_FOUND' || error.message === 'NO_SUPABASE') {
                console.warn('DB 미세팅으로 로컬 저장소를 사용합니다.');

                let current = [...contactsData];
                if (editingId) {
                    current = current.map(c => c.id === editingId ? { ...c, ...formData } : c);
                } else {
                    current.push({ ...formData, id: Date.now().toString() });
                }

                localStorage.setItem('iru_contacts', JSON.stringify(current));

                // 로컬 저장 시에도 프로젝트 동기화
                if (editingId && syncProjects && editingOriginalName && onSyncContact) {
                    await onSyncContact(editingOriginalName, formData);
                }

                setNotification({
                    type: 'info',
                    message: 'DB 테이블이 없어 브라우저에 임시 저장되었습니다. (SQL 실행 필요)'
                });

                setFormData({ name: '', team: '', position: '', phone: '', customer: '' });
                setEditingOriginalName('');
                setIsAddMode(false);
                setEditingId(null);
                fetchContactsData();
            } else {
                console.error('담당자 저장 실패:', error);
                setNotification({ type: 'error', message: '저장 실패: ' + error.message });
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (contact) => {
        setFormData({
            name: contact.name,
            team: contact.team || '',
            position: contact.position || '',
            phone: contact.phone || '',
            customer: contact.customer || ''
        });
        setEditingId(contact.id);
        setEditingOriginalName(contact.name); // 수정 전 원본 이름 저장
        setSyncProjects(true);
        setIsAddMode(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        if (!supabase) return;

        try {
            const { error } = await supabase
                .from('customer_contacts')
                .delete()
                .eq('id', id);
            if (error) throw error;
            setNotification({ type: 'success', message: '담당자 정보 삭제 완료' });
            fetchContactsData();
        } catch (error) {
            console.error('삭제 실패:', error);
            setNotification({ type: 'error', message: '삭제 실패' });
        }
    };

    // 수정 모드에서 연결된 프로젝트 미리보기
    const linkedProjects = editingOriginalName
        ? salesData.filter(p => p.customerContact === editingOriginalName || p.customerContact2 === editingOriginalName)
        : [];

    return (
        <div className="animate-fade">
            <header className="content-header">
                <div>
                    <h2>고객사 담당자 관리 👤</h2>
                    <p>작전 기지별 담당 주요 인사 정보를 기록하고 관리합니다.</p>
                </div>
                <div className="header-actions" style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                    <div className="search-box main-search" style={{ background: 'rgba(255,255,255,0.05)', padding: '0.4rem 1rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Search size={18} color="#94a3b8" />
                        <input
                            type="text"
                            placeholder="이름, 고객사, 소속팀 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ background: 'none', border: 'none', color: 'white', outline: 'none', fontSize: '0.9rem' }}
                        />
                    </div>
                    {canEdit && (
                        <>
                            <button className="btn btn-ghost" onClick={downloadTemplate} style={{ color: '#818cf8', borderColor: 'rgba(129, 140, 248, 0.3)' }}>
                                <FileSpreadsheet size={18} /> 양식 받기
                            </button>
                            <button className="btn btn-ghost" onClick={() => document.getElementById('contact-upload-input').click()} style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                                <Upload size={18} /> 엑셀 업로드
                            </button>
                            <input
                                id="contact-upload-input"
                                type="file"
                                accept=".xlsx, .xls"
                                style={{ display: 'none' }}
                                onChange={handleExcelUpload}
                            />
                            <button className="btn btn-primary" onClick={() => {
                                setIsAddMode(!isAddMode);
                                if (!isAddMode) { setFormData({ name: '', team: '', position: '', phone: '', customer: '' }); setEditingId(null); setEditingOriginalName(''); }
                            }}>
                                {isAddMode ? '목록으로 돌아가기' : <><UserPlus size={18} /> 담당자 등록</>}
                            </button>
                        </>
                    )}
                </div>
            </header>

            {isAddMode ? (
                <section className="glass-card animate-slide-up" style={{ padding: '2rem', maxWidth: '640px', margin: '0 auto' }}>
                    <h3 style={{ marginBottom: '1.5rem', color: '#818cf8' }}>{editingId ? '인사 정보 수정' : '신규 인사 등록'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label>담당자 성함</label>
                            <input
                                type="text"
                                className="input-field"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="예: 홍길동"
                            />
                        </div>
                        <div className="input-group">
                            <label>고객사명</label>
                            <input
                                type="text"
                                className="input-field"
                                value={formData.customer}
                                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                                required
                                placeholder="예: 삼성전자"
                            />
                        </div>
                        <div className="row-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="input-group">
                                <label>소속팀</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={formData.team}
                                    onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                                    placeholder="예: 전략기획팀"
                                />
                            </div>
                            <div className="input-group">
                                <label>직급</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={formData.position}
                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                    placeholder="예: 수석연구원"
                                />
                            </div>
                        </div>
                        <div className="input-group">
                            <label>연락처 (전화번호)</label>
                            <input
                                type="text"
                                className="input-field"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="예: 010-0000-0000"
                            />
                        </div>

                        {/* ─── 수정 모드: 프로젝트 동기화 옵션 ─── */}
                        {editingId && (
                            <div style={{
                                marginTop: '1.25rem',
                                background: linkedProjects.length > 0 ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${linkedProjects.length > 0 ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.07)'}`,
                                borderRadius: '12px',
                                padding: '1rem 1.2rem',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: linkedProjects.length > 0 ? '0.75rem' : '0' }}>
                                    <RefreshCw size={15} color="#818cf8" />
                                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#a5b4fc' }}>
                                        연결된 프로젝트 동기화
                                    </span>
                                    <span style={{
                                        fontSize: '0.7rem', fontWeight: '700',
                                        background: linkedProjects.length > 0 ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
                                        color: linkedProjects.length > 0 ? '#818cf8' : '#475569',
                                        padding: '0.15rem 0.55rem', borderRadius: '100px',
                                        border: `1px solid ${linkedProjects.length > 0 ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.08)'}`
                                    }}>
                                        {linkedProjects.length}건
                                    </span>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto', cursor: 'pointer', fontSize: '0.82rem', color: '#94a3b8' }}>
                                        <input
                                            type="checkbox"
                                            checked={syncProjects}
                                            onChange={(e) => setSyncProjects(e.target.checked)}
                                            disabled={linkedProjects.length === 0}
                                            style={{ accentColor: '#818cf8', cursor: 'pointer' }}
                                        />
                                        수정 시 함께 적용
                                    </label>
                                </div>

                                {linkedProjects.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                        {linkedProjects.slice(0, 4).map(p => (
                                            <div key={p.id} style={{
                                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                fontSize: '0.75rem', color: syncProjects ? '#c7d2fe' : '#475569',
                                                padding: '0.3rem 0.6rem',
                                                background: syncProjects ? 'rgba(99,102,241,0.06)' : 'transparent',
                                                borderRadius: '6px', transition: 'all 0.2s'
                                            }}>
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: syncProjects ? '#818cf8' : '#334155', flexShrink: 0 }} />
                                                <span style={{ fontWeight: '600', color: syncProjects ? '#e0e7ff' : '#334155' }}>{p.customer}</span>
                                                <span style={{ color: '#4a5568' }}>·</span>
                                                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.project}</span>
                                                <span style={{
                                                    fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px',
                                                    background: p.customerContact === editingOriginalName ? 'rgba(52,211,153,0.12)' : 'rgba(251,146,60,0.12)',
                                                    color: p.customerContact === editingOriginalName ? '#34d399' : '#fb923c',
                                                    fontWeight: '700'
                                                }}>
                                                    {p.customerContact === editingOriginalName ? '주담당자' : '부담당자'}
                                                </span>
                                            </div>
                                        ))}
                                        {linkedProjects.length > 4 && (
                                            <div style={{ fontSize: '0.7rem', color: '#475569', paddingLeft: '0.6rem' }}>
                                                외 {linkedProjects.length - 4}건 더...
                                            </div>
                                        )}
                                    </div>
                                )}

                                {linkedProjects.length === 0 && (
                                    <p style={{ fontSize: '0.75rem', color: '#475569', margin: 0 }}>
                                        이 담당자로 등록된 프로젝트가 없습니다.
                                    </p>
                                )}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setIsAddMode(false); setEditingOriginalName(''); }} disabled={isSaving}>취소</button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={isSaving}>
                                {isSaving ? '저장 중...' : (editingId ? `수정 완료${syncProjects && linkedProjects.length > 0 ? ` (+프로젝트 ${linkedProjects.length}건 동기화)` : ''}` : '정보 저장')}
                            </button>
                        </div>
                    </form>
                </section>
            ) : (
                <section className="glass-card" style={{ padding: '0' }}>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>성함</th>
                                    <th>고객사</th>
                                    <th>소속팀</th>
                                    <th>직급</th>
                                    <th>연락처</th>
                                    <th style={{ textAlign: 'center' }}>연결 프로젝트</th>
                                    {canEdit && <th style={{ textAlign: 'center' }}>액션</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredContacts.map(contact => {
                                    const linked = getLinkedProjectCount(contact.name);
                                    return (
                                        <tr key={contact.id} className="table-row-hover">
                                            <td style={{ fontWeight: '700' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                    <div style={{ width: '32px', height: '32px', background: 'rgba(129, 140, 248, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                                                        <User size={16} style={{ margin: '0 auto' }} />
                                                    </div>
                                                    {contact.name}
                                                </div>
                                            </td>
                                            <td style={{ color: '#94a3b8' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <Building size={14} /> {contact.customer}
                                                </div>
                                            </td>
                                            <td style={{ color: '#f8fafc' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <Users size={14} color="#818cf8" /> {contact.team || '-'}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <Briefcase size={14} color="#6366f1" /> {contact.position || '-'}
                                                </div>
                                            </td>
                                            <td style={{ color: '#10b981', fontWeight: '600' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <Phone size={14} /> {contact.phone || '-'}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {linked > 0 ? (
                                                    <span style={{
                                                        background: 'rgba(99,102,241,0.15)', color: '#818cf8',
                                                        fontSize: '0.72rem', fontWeight: '700',
                                                        padding: '0.2rem 0.6rem', borderRadius: '100px',
                                                        border: '1px solid rgba(99,102,241,0.3)'
                                                    }}>{linked}건</span>
                                                ) : (
                                                    <span style={{ color: '#334155', fontSize: '0.75rem' }}>-</span>
                                                )}
                                            </td>
                                            {canEdit && (
                                                <td style={{ textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                        <button className="btn-icon approve" onClick={() => handleEdit(contact)} title="수정"><UserCheck size={16} /></button>
                                                        <button className="btn-icon reject" onClick={() => handleDelete(contact.id)} title="삭제"><UserMinus size={16} /></button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                                {filteredContacts.length === 0 && (
                                    <tr>
                                        <td colSpan={canEdit ? 7 : 6} style={{ textAlign: 'center', padding: '5rem', color: '#64748b' }}>
                                            기록된 담당자 정보가 없습니다. 업무에 필요한 인사 정보를 등록하세요.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    );
};

export default ContactsTab;
