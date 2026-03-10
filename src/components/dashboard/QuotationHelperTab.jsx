import React, { useState, useEffect, useMemo } from 'react';
import { Search, Save, Trash2, Download, Upload, Plus, FileText, Info, Sparkles, Check, ChevronDown, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';

const QuotationHelperTab = ({ user }) => {
    // 🧠 견적 지식 베이스 (품목 정보)
    const [quotationBase, setQuotationBase] = useState(() => {
        const saved = localStorage.getItem('smp_quotation_base');
        return saved ? JSON.parse(saved) : [
            { id: 1, itemName: 'Server Rack Assembly', spec: 'Standard 42U', unitPrice: 2450000, projectName: 'Samsung Gen-AI' },
            { id: 2, itemName: 'Network Switch L3', spec: 'CISCO 24Port', unitPrice: 1750000, projectName: 'SK Hynix Opt' }
        ];
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [notification, setNotification] = useState(null);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    // AI 항목 추천 로직
    const aiSuggestions = useMemo(() => {
        if (!searchQuery || searchQuery.length < 2) return [];
        const q = searchQuery.toLowerCase();
        return quotationBase.filter(item =>
            item.itemName.toLowerCase().includes(q) ||
            item.spec.toLowerCase().includes(q)
        ).slice(0, 10);
    }, [searchQuery, quotationBase]);

    const handleExcelUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

                const formatted = json.map((row, idx) => ({
                    id: Date.now() + idx,
                    itemName: row['품목명'] || row['Item'] || '미지정',
                    spec: row['규격'] || row['Spec'] || '-',
                    unitPrice: parseInt(row['단가'] || row['Price']) || 0,
                    projectName: row['프로젝트명'] || row['Project'] || '-'
                }));

                const newList = [...formatted, ...quotationBase];
                setQuotationBase(newList);
                localStorage.setItem('smp_quotation_base', JSON.stringify(newList));
                setNotification({ type: 'success', message: '✨ 견적 지식이 성공적으로 업데이트되었습니다!' });
            } catch (err) {
                setNotification({ type: 'error', message: '파일 형식이 잘못되었습니다.' });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const downloadTemplate = () => {
        const template = [
            { '품목명': '기본 사양 서버', '규격': 'CPU 16Core / RAM 64GB', '단가': 5000000, '프로젝트명': '예시 프로젝트 A' }
        ];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "QuotationTemplate");
        XLSX.writeFile(wb, "IRU_Quotation_Knowledge_Template.xlsx");
    };

    const deleteItem = (id) => {
        if (window.confirm('이 견적 정보를 삭제하시겠습니까?')) {
            const newList = quotationBase.filter(item => item.id !== id);
            setQuotationBase(newList);
            localStorage.setItem('smp_quotation_base', JSON.stringify(newList));
        }
    };

    return (
        <div className="quotation-helper-container animate-fade">
            {notification && (
                <div className={`toast glass ${notification.type}`} style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000, padding: '15px 25px', borderRadius: '15px', color: 'white', fontWeight: 'bold' }}>
                    {notification.message}
                </div>
            )}

            <div className="quotation-knowledge-layout">
                {/* 🎯 AI 지능형 검색 섹션 */}
                <div className="knowledge-main-panel glass-card">
                    <div className="panel-header">
                        <div className="title-area">
                            <div className="glow-icon"><Sparkles size={24} color="#fbbf24" /></div>
                            <div>
                                <h3>AI 지능형 단가 조회 및 교육</h3>
                                <p>신입 요원도 베테랑처럼! 과거 프로젝트의 핵심 단가 정보를 실시간으로 확인하세요. 🛡️</p>
                            </div>
                        </div>
                    </div>

                    <div className="search-commander glass">
                        <Search size={24} className="search-icon" />
                        <input
                            type="text"
                            placeholder="찾으시는 품목명이나 규격을 입력하세요 (예: 랙, 스위치, 서버...)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="results-container">
                        {aiSuggestions.length > 0 ? (
                            <div className="suggestions-grid">
                                {aiSuggestions.map(item => (
                                    <div key={item.id} className="suggest-card-hq glass animate-slide-up">
                                        <div className="card-top">
                                            <span className="item-name-tag">{item.itemName}</span>
                                            <span className="price-tag">₩{item.unitPrice.toLocaleString()}</span>
                                        </div>
                                        <div className="card-mid">
                                            <div className="spec-info">
                                                <span className="label">규격/상세</span>
                                                <span className="value">{item.spec}</span>
                                            </div>
                                            <div className="project-info">
                                                <span className="label">기록 프로젝트</span>
                                                <span className="value project-name-highlight">[{item.projectName}]</span>
                                            </div>
                                        </div>
                                        <button className="btn-copy-price" onClick={() => {
                                            navigator.clipboard.writeText(item.unitPrice.toString());
                                            setNotification({ type: 'success', message: '단가가 복사되었습니다! 📋' });
                                        }}>단가 복사</button>
                                    </div>
                                ))}
                            </div>
                        ) : searchQuery.length >= 2 ? (
                            <div className="empty-state glass">
                                <Info size={40} color="#64748b" />
                                <p>해당 품목에 대한 과거 기록을 찾지 못했습니다.</p>
                                <span>우측 관리 패널에서 새로운 데이터를 업데이트해 주세요.</span>
                            </div>
                        ) : (
                            <div className="guide-state">
                                <p>상단 검색창에 품목 키워드를 입력하여 지식 조회를 시작하세요.</p>
                                <div className="quick-tags">
                                    <span onClick={() => setSearchQuery('서버')}>#서버</span>
                                    <span onClick={() => setSearchQuery('스위치')}>#스위치</span>
                                    <span onClick={() => setSearchQuery('설치')}>#설치비</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ⚙️ 데이터 관리 패널 */}
                <div className="knowledge-side-panel glass-card">
                    <div className="side-header">
                        <h3>지식 업데이트 센터</h3>
                        <p>최신 단가 정보를 동기화하세요.</p>
                    </div>

                    <div className="admin-actions">
                        <button className="btn-action-main" onClick={() => setIsUploadOpen(!isUploadOpen)}>
                            <Upload size={18} />
                            데이터 업데이트
                        </button>
                        <button className="btn-action-sub" onClick={downloadTemplate}>
                            <Download size={18} />
                            양식 다운로드
                        </button>
                    </div>

                    {isUploadOpen && (
                        <div className="upload-zone-mini animate-fade">
                            <input type="file" id="quote-base-up" hidden accept=".xlsx" onChange={handleExcelUpload} />
                            <label htmlFor="quote-base-up" className="drop-label">
                                <FileText size={32} />
                                <p>엑셀 파일 선택</p>
                            </label>
                        </div>
                    )}

                    <div className="stats-box glass">
                        <div className="stat-item">
                            <span className="s-label">전체 지식 수</span>
                            <span className="s-value">{quotationBase.length}개</span>
                        </div>
                    </div>

                    <div className="raw-data-list">
                        <h4>최근 등록된 지식</h4>
                        <div className="scroll-area">
                            {quotationBase.slice(0, 20).map(item => (
                                <div key={item.id} className="raw-item-card glass">
                                    <div className="info">
                                        <span className="n">{item.itemName}</span>
                                        <span className="p">₩{item.unitPrice.toLocaleString()}</span>
                                    </div>
                                    <button className="btn-del" onClick={() => deleteItem(item.id)}><Trash2 size={12} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .quotation-helper-container { padding: 1.5rem 0; font-family: 'Pretendard', sans-serif; }
                .quotation-knowledge-layout { display: grid; grid-template-columns: 1fr 320px; gap: 1.5rem; height: calc(100vh - 200px); min-height: 600px; }
                
                .knowledge-main-panel { display: flex; flex-direction: column; padding: 2.5rem; }
                .panel-header .title-area { display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 2rem; }
                .glow-icon { background: rgba(251, 191, 36, 0.1); padding: 12px; border-radius: 15px; box-shadow: 0 0 15px rgba(251, 191, 36, 0.2); }
                .panel-header h3 { font-size: 1.5rem; color: #fff; margin-bottom: 0.5rem; }
                .panel-header p { color: #94a3b8; font-size: 0.9rem; }

                .search-commander { display: flex; align-items: center; gap: 1rem; padding: 1.5rem 2rem; border-radius: 20px; background: rgba(0,0,0,0.3); border: 2px solid rgba(255,255,255,0.05); transition: 0.3s; margin-bottom: 2rem; }
                .search-commander:focus-within { border-color: #fbbf24; box-shadow: 0 0 30px rgba(251, 191, 36, 0.1); }
                .search-commander input { background: none; border: none; outline: none; color: #fff; font-size: 1.25rem; width: 100%; font-weight: 500; }
                .search-commander input::placeholder { color: #475569; }

                .results-container { flex: 1; overflow-y: auto; padding-right: 10px; }
                .suggestions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem; }
                
                .suggest-card-hq { padding: 1.5rem; border-radius: 18px; border-left: 5px solid #fbbf24; transition: 0.3s; }
                .suggest-card-hq:hover { background: rgba(255,255,255,0.05); transform: translateY(-5px); }
                .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
                .item-name-tag { font-weight: 800; font-size: 1.1rem; color: #fff; }
                .price-tag { font-size: 1.2rem; color: #fbbf24; font-weight: 900; }
                
                .card-mid { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem; }
                .spec-info, .project-info { display: flex; flex-direction: column; gap: 0.25rem; }
                .spec-info .label, .project-info .label { font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; }
                .spec-info .value { font-size: 0.9rem; color: #cbd5e1; }
                .project-name-highlight { color: #818cf8; font-weight: bold; }

                .btn-copy-price { width: 100%; padding: 0.75rem; background: rgba(251, 191, 36, 0.1); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.2); border-radius: 10px; font-weight: 800; cursor: pointer; transition: 0.2s; }
                .btn-copy-price:hover { background: #fbbf24; color: #1e1e1e; }

                .empty-state { height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; text-align: center; }
                .empty-state p { font-size: 1.1rem; color: #fff; }
                .empty-state span { color: #64748b; font-size: 0.9rem; }

                .guide-state { height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #64748b; }
                .quick-tags { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
                .quick-tags span { padding: 0.5rem 1rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; font-size: 0.85rem; cursor: pointer; transition: 0.2s; }
                .quick-tags span:hover { background: rgba(99, 102, 241, 0.1); color: #818cf8; border-color: #818cf8; }

                /* Side Panel Styling */
                .knowledge-side-panel { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
                .side-header h3 { font-size: 1.1rem; color: #fff; margin-bottom: 0.25rem; }
                .side-header p { font-size: 0.8rem; color: #64748b; }

                .admin-actions { display: flex; flex-direction: column; gap: 0.75rem; }
                .btn-action-main { width: 100%; padding: 1rem; background: var(--primary); border: none; border-radius: 12px; color: white; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
                .btn-action-sub { width: 100%; padding: 1rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; color: #fff; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
                
                .upload-zone-mini { padding: 1.5rem; border: 2px dashed rgba(255,255,255,0.1); border-radius: 15px; text-align: center; }
                .drop-label { cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; color: #64748b; }
                .drop-label:hover { color: #fff; }

                .stat-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(0,0,0,0.2); border-radius: 12px; }
                .s-label { font-size: 0.85rem; color: #94a3b8; }
                .s-value { font-weight: 800; color: #fbbf24; }

                .raw-data-list h4 { font-size: 0.85rem; color: #94a3b8; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.1em; }
                .scroll-area { display: flex; flex-direction: column; gap: 0.5rem; max-height: 250px; overflow-y: auto; padding-right: 5px; }
                .raw-item-card { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border-radius: 10px; font-size: 0.8rem; }
                .raw-item-card .info { display: flex; flex-direction: column; gap: 0.15rem; }
                .raw-item-card .n { font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
                .raw-item-card .p { color: #fbbf24; font-weight: bold; }
                .btn-del { color: #ef4444; background: none; border: none; cursor: pointer; opacity: 0.3; }
                .btn-del:hover { opacity: 1; }

                @media (max-width: 1024px) {
                    .quotation-knowledge-layout { grid-template-columns: 1fr; height: auto; }
                    .knowledge-main-panel { padding: 1.5rem; }
                }
            `}</style>
        </div>
    );
};

export default QuotationHelperTab;
