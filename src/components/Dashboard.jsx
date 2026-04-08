import React, { useState, useEffect, useMemo, useTransition, useCallback } from 'react';
import { Plus, Check, AlertCircle, Database, Menu, Star, GitMerge } from 'lucide-react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import imageCompression from 'browser-image-compression';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

import './Dashboard.css';

// Sub-components
import Sidebar from './dashboard/Sidebar';

import StatusDistribution from './dashboard/StatusDistribution';
import ActivityLog from './dashboard/ActivityLog';
import TrendsChart from './dashboard/TrendsChart';
import StatusTab from './dashboard/StatusTab';
import AdminTab from './dashboard/AdminTab';
import SettingsTab from './dashboard/SettingsTab';
import ProjectModal from './dashboard/ProjectModal';
import PDFReportTemplate from './dashboard/PDFReportTemplate';
import KanbanTab from './dashboard/KanbanTab';
import CustomerRevenueChart from './dashboard/CustomerRevenueChart';
import QuotationHelperTab from './dashboard/QuotationHelperTab';
import ContactsTab from './dashboard/ContactsTab';
import ZeroEstimateWarning from './dashboard/ZeroEstimateWarning';
import StarredItemsWidget from './dashboard/StarredItemsWidget';
import CompanyIntroPage from './dashboard/CompanyIntroPage';
import MergeModal from './dashboard/MergeModal';
import { formatDate, getTodayFormatted } from '../lib/dateUtils';
import { GripVertical, Lock, Unlock } from 'lucide-react';

import { Responsive, WidthProvider } from 'react-grid-layout';
import '/node_modules/react-grid-layout/css/styles.css';
import '/node_modules/react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const initialSalesData = [
  { id: 1, customer: '삼성전자', representative: '김철수', customerContact: '이민준', customerPosition: '책임연구원', customerPhone: '010-1234-5678', project: 'AI 차세대 엔진 구축', status: '완료 마감 대기', estimateAmount: 55000000, discountAmount: 5000000, date: '2025.1.15' },
  { id: 2, customer: 'SK하이닉스', representative: '박대리', customerContact: '안지화', customerPosition: '선임연구원', customerPhone: '010-2345-6789', project: '반도체 공정 AI 최적화', status: '착수완료 진행', estimateAmount: 78000000, discountAmount: 3000000, date: '2025.2.10' },
  { id: 3, customer: '현대자동차', representative: '이영희', customerContact: '박성함', customerPosition: '팀장', customerPhone: '010-3456-7890', project: '자율주행 UI 디자인', status: '완료 마감 대기', estimateAmount: 42000000, discountAmount: 2000000, date: '2025.3.05' },
];

const Dashboard = ({ user, onLogout, users, onApproveUser, onRejectUser, onChangeUserRole, onUpdateUser, companyMode = 'iru' }) => {
  // 회사 필터 헬퍼
  const isGachi = companyMode === 'gachi';
  const companyFilter = (item) => {
    const c = item.company || '';
    const isGachiCompany = c === '가치' || c === '(주)가치' || c === 'gachi';
    return isGachi ? isGachiCompany : !isGachiCompany;
  };
  const companyName = isGachi ? '(주)가치' : '(주)이루';
  const [salesData, setSalesData] = useState(() => {
    const saved = localStorage.getItem('smp_sales_data');
    if (!saved) return initialSalesData.map(item => ({ ...item, company: '(주)이루' }));
    const parsed = JSON.parse(saved);
    // company 없는 레거시 데이터는 (주)이루로 기본 처리
    return parsed.map(item => ({ ...item, company: item.company || '(주)이루' }));
  });

  // 회사별 필터링된 기반 데이터 (병합된 원본 항목 제외)
  const companySalesData = useMemo(() => salesData.filter(item => companyFilter(item) && !item.mergedInto), [salesData, companyMode]);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYears, setSelectedYears] = useState([2026]);
  const [contactsData, setContactsData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [isPending, startTransition] = useTransition();
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const canEdit = user.role === 'admin' || user.role === 'editor';
  const roleNames = { 'admin': '최고 지휘관', 'editor': '작전 실행요원', 'viewer': '정보 열람요원' };

  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('smp_config');
    const baseConfig = saved ? JSON.parse(saved) : {
      supabaseUrl: '', supabaseAnonKey: '', isDarkMode: true, isCompactView: false, useAutoSync: true
    };
    return {
      ...baseConfig,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || baseConfig.supabaseUrl,
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || baseConfig.supabaseAnonKey
    };
  });

  const [formData, setFormData] = useState({
    customer: '', representative: user.name, project: '', estimateAmount: '', discountAmount: '',
    status: '견적제출중',
    company: isGachi ? '(주)가치' : '(주)이루',
    customerContact: '', customerPosition: '', customerPhone: '',
    customerContact2: '', customerPosition2: '', customerPhone2: '',
    imageMail: null, imageEstimate: null, imageProduct: null,
    notes: '', statusDates: {},
    quotePdfUrl: '',
    mailPdfUrl: '',
    finalProductPhotos: [],
    agreementImages: [],
    taxInvoiceImages: []
  });

  const [editingItemId, setEditingItemId] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [yearlyTargets, setYearlyTargets] = useState(() => {
    const saved = localStorage.getItem('smp_yearly_targets');
    return saved ? JSON.parse(saved) : { 2022: 100000000, 2023: 200000000, 2024: 300000000, 2025: 500000000, 2026: 700000000 };
  });
  const [isSaving, setIsSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [mergeTargetIds, setMergeTargetIds] = useState([]);
  const [statusFilters, setStatusFilters] = useState([]);

  const toggleStatusFilter = (status) => {
    if (status === '전체') { setStatusFilters([]); return; }
    setStatusFilters(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };
  const [yearFilter, setYearFilter] = useState('전체');

  // 대시보드 레이아웃 설정 (관리자 전용)
  const initialLayouts = {
    lg: [
      { i: 'warnings', x: 0, y: 0, w: 6, h: 6 },
      { i: 'distribution', x: 0, y: 6, w: 7, h: 7 },
      { i: 'activity', x: 7, y: 6, w: 5, h: 7 },
      { i: 'trends', x: 0, y: 13, w: 12, h: 10 },
      { i: 'revenue', x: 0, y: 23, w: 8, h: 10 },
      { i: 'starred', x: 8, y: 23, w: 4, h: 10 }
    ]
  };

  const [layouts, setLayouts] = useState(() => {
    const saved = localStorage.getItem('smp_dashboard_layouts');
    if (!saved) return initialLayouts;
    try {
      const parsed = JSON.parse(saved);
      // statGrid가 남아있는 구버전 레이아웃이면 초기화
      const hasStatGrid = (parsed.lg || []).some(item => item.i === 'statGrid');
      if (hasStatGrid) {
        localStorage.removeItem('smp_dashboard_layouts');
        return initialLayouts;
      }
      return parsed;
    } catch { return initialLayouts; }
  });

  const [isLayoutLocked, setIsLayoutLocked] = useState(() => {
    const saved = localStorage.getItem('smp_layout_locked');
    return saved ? JSON.parse(saved) : true;
  });

  const onLayoutChange = (currentLayout, allLayouts) => {
    if (user.role === 'admin' && !isLayoutLocked) {
      setLayouts(allLayouts);
      localStorage.setItem('smp_dashboard_layouts', JSON.stringify(allLayouts));
    }
  };

  const toggleLayoutLock = () => {
    const newVal = !isLayoutLocked;
    setIsLayoutLocked(newVal);
    localStorage.setItem('smp_layout_locked', JSON.stringify(newVal));
    if (newVal) {
      setNotification({ type: 'success', message: '대시보드 배치가 잠금되었습니다.' });
    } else {
      setNotification({ type: 'info', message: '대시보드 배치를 자유롭게 수정할 수 있습니다.' });
    }
  };

  const years = [2022, 2023, 2024, 2025, 2026];
  const yearColors = { '2022': '#94a3b8', '2023': '#10b981', '2024': '#f59e0b', '2025': '#6366f1', '2026': '#ec4899' };

  useEffect(() => { localStorage.setItem('smp_sales_data', JSON.stringify(salesData)); }, [salesData]);
  useEffect(() => { localStorage.setItem('smp_config', JSON.stringify(config)); }, [config]);
  useEffect(() => { localStorage.setItem('smp_yearly_targets', JSON.stringify(yearlyTargets)); }, [yearlyTargets]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchSalesData = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('sales_data').select('*').order('date', { ascending: false });
      if (error) throw error;
      if (data) {
        const formatted = data.map(item => ({
          ...item,
          date: formatDate(item.date),
          company: item.company || '(주)이루',
          isStarred: item.is_starred === true || item.isStarred === true,
          // mergedProjects: DB에서 문자열로 올 수도 있으므로 파싱
          mergedProjects: (() => {
            if (!item.mergedProjects) return [];
            if (typeof item.mergedProjects === 'string') {
              try { return JSON.parse(item.mergedProjects); } catch { return []; }
            }
            return Array.isArray(item.mergedProjects) ? item.mergedProjects : [];
          })(),
        }));
        setSalesData(formatted);
        localStorage.setItem('smp_sales_data', JSON.stringify(formatted));
      }
    } catch (error) {
      setNotification({ type: 'error', message: '클라우드 동기화 실패' });
    }
  };

  const fetchContactsData = async () => {
    try {
      if (supabase) {
        const { data, error } = await supabase.from('customer_contacts').select('*').order('name');
        if (error) {
          console.warn('DB 담당자 로드 실패(테이블 미생성 등):', error.message);
          const local = localStorage.getItem('iru_contacts');
          if (local) setContactsData(JSON.parse(local));
          return;
        }
        if (data) {
          setContactsData(data);
          localStorage.setItem('iru_contacts', JSON.stringify(data));
        }
      } else {
        const local = localStorage.getItem('iru_contacts');
        if (local) setContactsData(JSON.parse(local));
      }
    } catch (error) {
      console.error('담당자 정보 로드 중 오류:', error);
    }
  };

  useEffect(() => {
    fetchSalesData();
    fetchContactsData();
  }, []);

  const toggleYear = (year) => {
    setSelectedYears(prev => {
      if (prev.includes(year)) {
        if (prev.length === 1) return prev;
        return prev.filter(y => y !== year);
      }
      if (prev.length >= 3) return [...prev.slice(1), year];
      return [...prev, year].sort();
    });
    setSelectedMonth(null);
  };

  const chartData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const row = { name: `${i + 1}월` };
      selectedYears.forEach(y => row[y] = 0);
      return row;
    });
    // 세금계산서 발행 완료 / 수금 완료 상태 항목만 집계
    const invoiceItems = companySalesData.filter(item =>
      item.status === '세금계산서 발행 완료' || item.status === '수금 완료'
    );
    invoiceItems.forEach(item => {
      // 발행 날짜: statusDates['세금계산서 발행 완료'] 우선, 없으면 item.date fallback
      const invoiceDate = (item.statusDates && item.statusDates['세금계산서 발행 완료'])
        ? item.statusDates['세금계산서 발행 완료']
        : item.date;
      const parts = String(invoiceDate).split('.');
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      if (selectedYears.includes(year) && month >= 1 && month <= 12) {
        const actualRevenue = (item.discountAmount && item.discountAmount > 0) ? item.discountAmount : item.estimateAmount;
        months[month - 1][year] += actualRevenue;
      }
    });
    return selectedYears.length === 1 ? months.map(m => ({ name: m.name, sales: m[selectedYears[0]] })) : months;
  }, [companySalesData, selectedYears]);

  // ── 날짜 파싱: '2026.1.15' → Date 객체 (비교용) ──
  const parseItemDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = String(dateStr).split('.');
    if (parts.length < 2) return null;
    const y = parseInt(parts[0]);
    const m = parseInt(parts[1]) - 1;
    const d = parts[2] ? parseInt(parts[2]) : 1;
    return new Date(y, m, d);
  };

  // 상태 필터가 활성화되면 해당 상태의 statusDates 날짜를 기준으로 연도/월/범위 필터를 적용
  const getFilterDate = (item) => {
    if (statusFilters.length === 1 && item.statusDates?.[statusFilters[0]]) {
      return item.statusDates[statusFilters[0]];
    }
    if (statusFilters.length > 1 && statusFilters.includes(item.status) && item.statusDates?.[item.status]) {
      return item.statusDates[item.status];
    }
    return item.date;
  };

  const baseFilteredData = useMemo(() => {
    // 연도 필터: 상태 필터 활성 시 해당 상태 날짜 기준
    let filtered = companySalesData.filter(item => {
      const dateStr = String(getFilterDate(item) || '');
      const year = parseInt(dateStr.split('.')[0]);
      return !isNaN(year) && selectedYears.includes(year);
    });

    // 1. 텍스트 검색 필터 (업체명, 프로젝트, 담당요원, 상태, 고객사담당자 통합 검색)
    if (searchTerm) {
      const lowSearch = searchTerm.replace(/\s+/g, '').toLowerCase();
      filtered = filtered.filter(item =>
        (item.customer || '').replace(/\s+/g, '').toLowerCase().includes(lowSearch) ||
        (item.project || '').replace(/\s+/g, '').toLowerCase().includes(lowSearch) ||
        (item.representative || '').replace(/\s+/g, '').toLowerCase().includes(lowSearch) ||
        (item.status || '').replace(/\s+/g, '').toLowerCase().includes(lowSearch) ||
        (item.customerContact || '').replace(/\s+/g, '').toLowerCase().includes(lowSearch)
      );
    }

    // 2. 월 필터 (차트 클릭): 상태 필터 활성 시 해당 상태 날짜 기준
    if (selectedMonth) {
      const targetMonth = parseInt(selectedMonth.replace('월', ''));
      filtered = filtered.filter(item => {
        const dateStr = String(getFilterDate(item) || '');
        return parseInt(dateStr.split('.')[1]) === targetMonth;
      });
    }

    // 3. 날짜 범위 필터 (Date Range Picker): 상태 필터 활성 시 해당 상태 날짜 기준
    if (dateRange.start || dateRange.end) {
      const startDate = dateRange.start ? new Date(dateRange.start) : null;
      const endDate = dateRange.end ? new Date(dateRange.end + 'T23:59:59') : null;
      filtered = filtered.filter(item => {
        const itemDate = parseItemDate(getFilterDate(item));
        if (!itemDate) return false;
        if (startDate && itemDate < startDate) return false;
        if (endDate && itemDate > endDate) return false;
        return true;
      });
    }

    return filtered;
  }, [companySalesData, selectedMonth, selectedYears, searchTerm, dateRange, statusFilters]);

  const sortData = (data) => {
    return [...data].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'amount') {
        aValue = (a.discountAmount && a.discountAmount > 0) ? Number(a.discountAmount) : Number(a.estimateAmount);
        bValue = (b.discountAmount && b.discountAmount > 0) ? Number(b.discountAmount) : Number(b.estimateAmount);
      }

      // statusDates.{statusKey} 형식의 중첩 날짜 정렬 지원
      if (sortConfig.key.startsWith('statusDates.')) {
        const dateKey = sortConfig.key.slice('statusDates.'.length);
        aValue = (a.statusDates && a.statusDates[dateKey]) ? String(a.statusDates[dateKey]) : '';
        bValue = (b.statusDates && b.statusDates[dateKey]) ? String(b.statusDates[dateKey]) : '';
        // 날짜 없는 항목은 항상 뒤로
        if (!aValue && !bValue) return 0;
        if (!aValue) return 1;
        if (!bValue) return -1;
      }

      if (aValue === bValue) return 0;
      let result = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        result = aValue.localeCompare(bValue);
      } else {
        result = aValue > bValue ? 1 : -1;
      }
      return sortConfig.direction === 'asc' ? result : -result;
    });
  };

  const sortedAndFilteredData = useMemo(() => {
    const filtered = statusFilters.length === 0
      ? baseFilteredData
      : baseFilteredData.filter(item => statusFilters.includes(item.status));
    return sortData(filtered);
  }, [baseFilteredData, statusFilters, sortConfig]);

  // 병합 모달 열기
  const handleOpenMerge = (ids) => {
    setMergeTargetIds(ids);
    setIsMergeModalOpen(true);
  };

  // 병합 실행
  const handleMergeConfirm = async (mergeConfig) => {
    const targetProjects = salesData.filter(item => mergeTargetIds.includes(item.id));
    console.log('[병합] mergeTargetIds:', mergeTargetIds, 'targetProjects:', targetProjects.length);
    if (targetProjects.length < 2) {
      setNotification({ type: 'error', message: `병합 대상 프로젝트를 찾을 수 없습니다 (${targetProjects.length}건). 다시 선택해주세요.` });
      return;
    }
    const firstProject = targetProjects[0];
    const now = new Date();
    const dateStr = `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`;
    const newId = Date.now();

    const mergedProject = {
      id: newId,
      company: firstProject.company,
      customer: firstProject.customer,
      customerContact: firstProject.customerContact || '',
      customerPosition: firstProject.customerPosition || '',
      customerPhone: firstProject.customerPhone || '',
      representative: firstProject.representative,
      project: mergeConfig.projectName,
      estimateAmount: Number(mergeConfig.estimateAmount) || 0,
      discountAmount: Number(mergeConfig.discountAmount) || 0,
      status: mergeConfig.status,
      date: dateStr,
      notes: mergeConfig.note,
      statusDates: { [mergeConfig.status]: dateStr },
      isMerged: true,
      mergedProjects: targetProjects,
      quotePdfUrl: '', mailPdfUrl: '',
      finalProductPhotos: [], agreementImages: [], taxInvoiceImages: [],
      isStarred: false,
    };

    try {
      setIsSaving(true);
      if (supabase) {
        const mergePayload = {
          ...mergedProject,
          mergedProjects: JSON.stringify(mergedProject.mergedProjects),
          is_starred: false,
        };
        delete mergePayload.isStarred;
        const { error: insErr } = await supabase.from('sales_data').insert([mergePayload]);
        if (insErr) throw insErr;
        for (const orig of targetProjects) {
          await supabase.from('sales_data').update({ mergedInto: String(newId) }).eq('id', orig.id);
        }
        await fetchSalesData();
      } else {
        setSalesData(prev => [
          ...prev.map(item => mergeTargetIds.includes(item.id) ? { ...item, mergedInto: String(newId) } : item),
          mergedProject,
        ]);
      }
      setSelectedIds([]);
      setIsMergeModalOpen(false);
      setNotification({ type: 'success', message: `${targetProjects.length}건이 1건으로 병합되었습니다.` });
    } catch (err) {
      setNotification({ type: 'error', message: '병합 실패: ' + err.message });
    } finally {
      setIsSaving(false);
    }
  };

  // ── 프로젝트 통합 현황 전용: 연도 필터 없이 전체 데이터 ──
  const getAllFilterDate = (item) => {
    if (statusFilters.length === 1 && item.statusDates?.[statusFilters[0]]) {
      return item.statusDates[statusFilters[0]];
    }
    if (statusFilters.length > 1 && statusFilters.includes(item.status) && item.statusDates?.[item.status]) {
      return item.statusDates[item.status];
    }
    return item.date;
  };

  const allFilteredData = useMemo(() => {
    let filtered = salesData.filter(item => companyFilter(item) && !item.mergedInto);

    // 연도 필터: 상태 필터 활성 시 해당 상태 날짜 기준
    if (yearFilter && yearFilter !== '전체') {
      filtered = filtered.filter(item => {
        const dateStr = String(getAllFilterDate(item) || '');
        return dateStr.split('.')[0] === yearFilter;
      });
    }

    if (searchTerm) {
      const lowSearch = searchTerm.replace(/\s+/g, '').toLowerCase();
      filtered = filtered.filter(item =>
        (item.customer || '').replace(/\s+/g, '').toLowerCase().includes(lowSearch) ||
        (item.project || '').replace(/\s+/g, '').toLowerCase().includes(lowSearch) ||
        (item.representative || '').replace(/\s+/g, '').toLowerCase().includes(lowSearch) ||
        (item.status || '').replace(/\s+/g, '').toLowerCase().includes(lowSearch) ||
        (item.customerContact || '').replace(/\s+/g, '').toLowerCase().includes(lowSearch)
      );
    }

    if (dateRange.start || dateRange.end) {
      const startDate = dateRange.start ? new Date(dateRange.start) : null;
      const endDate = dateRange.end ? new Date(dateRange.end + 'T23:59:59') : null;
      filtered = filtered.filter(item => {
        const itemDate = parseItemDate(getAllFilterDate(item));
        if (!itemDate) return false;
        if (startDate && itemDate < startDate) return false;
        if (endDate && itemDate > endDate) return false;
        return true;
      });
    }

    return filtered;
  }, [salesData, searchTerm, dateRange, yearFilter, companyMode, statusFilters]);

  // 사용 가능한 연도 목록 (내림차순)
  const availableYears = useMemo(() => {
    const yrSet = new Set();
    salesData.forEach(item => {
      const yr = parseInt(String(item.date).split('.')[0]);
      if (!isNaN(yr)) yrSet.add(yr);
    });
    return Array.from(yrSet).sort((a, b) => b - a);
  }, [salesData]);

  // 킭별 statusDates 기준 연도 필터 헬퍼
  const filterByStatusDateYear = (data, statusKey) => {
    if (!yearFilter || yearFilter === '전체') return data;
    return data.filter(item => {
      const d = item.statusDates?.[statusKey] || item.date;
      return String(d).split('.')[0] === yearFilter;
    });
  };

  // 갭색에 고독 없는 검색 필터 적용 (allFilteredData와 동일 로직)
  const applySearch = (data) => {
    if (!searchTerm) return data;
    const lowSearch = searchTerm.replace(/\s+/g, '').toLowerCase();
    return data.filter(item =>
      (item.customer || '').replace(/\s+/g, '').toLowerCase().includes(lowSearch) ||
      (item.project || '').replace(/\s+/g, '').toLowerCase().includes(lowSearch) ||
      (item.representative || '').replace(/\s+/g, '').toLowerCase().includes(lowSearch) ||
      (item.customerContact || '').replace(/\s+/g, '').toLowerCase().includes(lowSearch)
    );
  };

  const allSortedAndFilteredData = useMemo(() => {
    const filtered = statusFilters.length === 0
      ? allFilteredData
      : allFilteredData.filter(item => statusFilters.includes(item.status));
    return sortData(filtered);
  }, [allFilteredData, statusFilters, sortConfig]);

  const yearTotalRev = useMemo(() => {
    const displayYear = Math.max(...selectedYears);
    return companySalesData
      .filter(item => parseInt(String(item.date).split('.')[0]) === displayYear)
      .reduce((acc, curr) => acc + (curr.discountAmount > 0 ? curr.discountAmount : curr.estimateAmount), 0);
  }, [companySalesData, selectedYears]);

  const processDataSave = async (shouldClose = true) => {
    if (!canEdit || isSaving) return;
    setIsSaving(true);
    setNotification({ type: 'info', message: '통신 중...' });

    const now = new Date();
    const timestamp = `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    const originalItem = editingItemId ? salesData.find(i => String(i.id) === String(editingItemId)) : null;

    const updatedStatusDates = { ...(formData.statusDates || {}) };
    if (!updatedStatusDates[formData.status]) {
      updatedStatusDates[formData.status] = getTodayFormatted();
    }

    const fullData = {
      ...formData,
      statusDates: updatedStatusDates,
      estimateAmount: parseInt(formData.estimateAmount) || 0,
      discountAmount: parseInt(formData.discountAmount) || 0,
      lastModifiedBy: user.name,
      lastModifiedAt: timestamp,
      date: originalItem ? originalItem.date : getTodayFormatted()
    };

    try {
      if (supabase) {
        const payload = { ...fullData };
        // 신규 등록 시 id 제거
        if (!editingItemId) delete payload.id;
        // Supabase 스키마에 없는 프론트엔드 전용 필드 제거
        delete payload.isStarred;       // DB 컬럼명은 is_starred
        delete payload.imageMail;       // 레거시 base64 필드
        delete payload.imageEstimate;   // 레거시 base64 필드
        delete payload.imageProduct;    // 레거시 base64 필드
        delete payload.mergedProjects;  // 병합 전용 필드 (일반 저장 시 제외)
        delete payload.mergedInto;      // 병합 전용 필드
        delete payload.isMerged;        // 병합 전용 필드

        const { error } = editingItemId
          ? await supabase.from('sales_data').update(payload).eq('id', editingItemId)
          : await supabase.from('sales_data').insert([payload]);
        if (error) throw error;
        setNotification({ type: 'success', message: '클라우드 동기화 완료!' });
        await fetchSalesData();
      } else {
        if (editingItemId) {
          setSalesData(salesData.map(item => String(item.id) === String(editingItemId) ? { ...item, ...fullData } : item));
        } else {
          setSalesData([{ ...fullData, id: Date.now() }, ...salesData]);
        }
        setNotification({ type: 'success', message: '로컬 저장 완료' });
      }

      if (shouldClose) {
        setIsModalOpen(false);
        setEditingItemId(null);
        setFormData({
          customer: '', representative: user.name, project: '', estimateAmount: '', discountAmount: '', status: '견적제출중',
          company: companyName,
          customerContact: '', customerPosition: '', customerPhone: '',
          customerContact2: '', customerPosition2: '', customerPhone2: '',
          imageMail: null, imageEstimate: null, imageProduct: null, notes: '', statusDates: {},
          quotePdfUrl: '',
          mailPdfUrl: '',
          finalProductPhotos: [],
          agreementImages: [],
          taxInvoiceImages: []
        });
      }
    } catch (error) {
      console.error('Save error:', error);
      setNotification({ type: 'error', message: `저장 실패: ${error.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = useCallback(async (e, id, customer) => {
    e.stopPropagation();
    if (user.role !== 'admin') return setNotification({ type: 'error', message: '권한이 없습니다.' });
    if (!window.confirm(`[${customer}] 기록을 영구 말소하시겠습니까?`)) return;

    try {
      setIsSaving(true);
      if (supabase) {
        const { error } = await supabase.from('sales_data').delete().eq('id', id);
        if (error) throw error;
        await fetchSalesData();
      } else {
        // startTransition: 삭제 클릭 직후 UI 블로킹 모두 해제
        // filter() 연산 자체만 로로우프리티 업데이트로 미룈다
        startTransition(() => {
          setSalesData(prev => prev.filter(item => item.id !== id));
        });
      }
      setNotification({ type: 'success', message: '삭제 완료' });
    } catch (error) {
      setNotification({ type: 'error', message: '삭제 실패' });
    } finally {
      setIsSaving(false);
    }
  }, [user.role, supabase, fetchSalesData, startTransition]);

  const handleBulkDelete = async () => {
    if (user.role !== 'admin' || selectedIds.length === 0) return;
    if (!window.confirm(`선택한 ${selectedIds.length}개의 기록을 삭제하시겠습니까?`)) return;

    try {
      setIsSaving(true);
      if (supabase) {
        const { error } = await supabase.from('sales_data').delete().in('id', selectedIds);
        if (error) throw error;
        await fetchSalesData();
      } else {
        setSalesData(salesData.filter(item => !selectedIds.includes(item.id)));
      }
      setNotification({ type: 'success', message: '일괄 삭제 완료' });
      setSelectedIds([]);
    } catch (error) {
      setNotification({ type: 'error', message: '일괄 삭제 실패' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        if (json.length === 0) {
          setNotification({ type: 'error', message: '엑셀 파일에 데이터가 없습니다. 양식을 확인하세요.' });
          return;
        }

        const parseExcelAmount = (val) => {
          if (typeof val === 'number') return val;
          if (!val) return 0;
          return parseInt(String(val).replace(/[^0-9]/g, '')) || 0;
        };

        // 소속사업자 파싱 헬퍼: 가치 관련 키워드면 (주)가치, 나머지는 (주)이루
        const parseCompany = (val) => {
          if (!val) return '(주)이루';
          const v = String(val).trim();
          if (v.includes('가치') || v === 'gachi') return '(주)가치';
          return '(주)이루';
        };

        const formattedData = json.map(row => ({
          company: parseCompany(row['소속사업자']),
          customer: String(row['고객사'] || '미지정'),
          representative: String(row['담당자'] || user.name),
          project: String(row['프로젝트'] || '신규 프로젝트'),
          status: String(row['상태'] || '견적제출중'),
          estimateAmount: parseExcelAmount(row['견적금액']),
          discountAmount: parseExcelAmount(row['인하금액']),
          date: formatDate(row['날짜']),
          customerContact: String(row['고객담당자1'] || row['고객담당자'] || ''),
          customerPosition: String(row['직급1'] || row['직급'] || ''),
          customerPhone: String(row['연락처1'] || row['연락처'] || ''),
          customerContact2: String(row['고객담당자2'] || ''),
          customerPosition2: String(row['직급2'] || ''),
          customerPhone2: String(row['연락처2'] || ''),
          notes: String(row['메모'] || ''),
          lastModifiedBy: user.name,
          lastModifiedAt: new Date().toLocaleString()
        }));

        if (supabase) {
          let { error } = await supabase.from('sales_data').insert(formattedData);

          // company 컬럼이 DB에 없을 경우 폴백: company 제거 후 재시도
          if (error && (error.message.includes('company') || error.code === '42703')) {
            console.warn('company 컬럼 없음 → company 필드 제거 후 재시도');
            const fallbackData = formattedData.map(({ company, ...rest }) => rest);
            const retry = await supabase.from('sales_data').insert(fallbackData);
            if (retry.error) throw retry.error;
            setNotification({ type: 'success', message: `${formattedData.length}건 업로드 완료 (DB에 company 컬럼 추가 필요)` });
          } else if (error) {
            throw error;
          } else {
            setNotification({ type: 'success', message: `${formattedData.length}건 일괄 등록 완료!` });
          }
          await fetchSalesData();
        } else {
          setSalesData([...formattedData.map((d, i) => ({ ...d, id: Date.now() + i })), ...salesData]);
          setNotification({ type: 'success', message: `${formattedData.length}건 일괄 등록 완료!` });
        }
      } catch (error) {
        console.error('Upload Error:', error);
        // 에러 내용을 상세히 표시
        const msg = error?.message || error?.details || JSON.stringify(error);
        setNotification({ type: 'error', message: `업로드 실패: ${msg}` });
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        '소속사업자': '(주)이루',
        '고객사': '예시_삼성전자',
        '담당자': user.name,
        '프로젝트': '예시_AI 시스템 고도화',
        '상태': '견적제출중',
        '견적금액': 50000000,
        '인하금액': 45000000,
        '날짜': '2025.01.01',
        '고객담당자1': '홍길동',
        '직급1': '부장',
        '연락처1': '010-1234-5678',
        '고객담당자2': '',
        '직급2': '',
        '연락처2': '',
        '메모': '(주)이루 소속 프로젝트 예시'
      },
      {
        '소속사업자': '(주)가치',
        '고객사': '예시_현대자동차',
        '담당자': user.name,
        '프로젝트': '예시_차량 디자인 프로젝트',
        '상태': '착수완료 진행',
        '견적금액': 80000000,
        '인하금액': 75000000,
        '날짜': '2025.03.15',
        '고객담당자1': '김영희',
        '직급1': '팀장',
        '연락처1': '010-9876-5432',
        '고객담당자2': '',
        '직급2': '',
        '연락처2': '',
        '메모': '(주)가치 소속 프로젝트 예시'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    // 컬럼 너비 자동 조정
    const colWidths = Object.keys(templateData[0]).map(key => ({ wch: Math.max(key.length * 2.5, 14) }));
    ws['!cols'] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "IRU_GACHI_Project_Upload_Template.xlsx");
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    // ── 1. 빈칸 검증 ──
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      return setNotification({ type: 'error', message: '모든 비밀번호 항목을 입력해 주세요.' });
    }

    // ── 2. 새 비밀번호 일치 검증 ──
    if (passwordForm.new !== passwordForm.confirm) {
      return setNotification({ type: 'error', message: '새 비밀번호가 일치하지 않습니다.' });
    }

    // ── 3. 새 비밀번호 최소 길이 검증 ──
    if (passwordForm.new.length < 4) {
      return setNotification({ type: 'error', message: '비밀번호는 4자 이상이어야 합니다.' });
    }

    // ── 4. 현재 비밀번호 검증 ──
    // user_accounts 테이블에서 현재 사용자의 실제 비밀번호를 확인
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('user_accounts')
          .select('password')
          .eq('employeeId', user.id)
          .single();

        if (error) throw error;

        if (!data || data.password !== passwordForm.current) {
          return setNotification({ type: 'error', message: '현재 비밀번호가 올바르지 않습니다.' });
        }

        // ── 5. 신규 비밀번호로 업데이트 ──
        const { error: updateError } = await supabase
          .from('user_accounts')
          .update({ password: passwordForm.new })
          .eq('employeeId', user.id);

        if (updateError) throw updateError;

        // 로컬 users 상태도 동기화
        if (onUpdateUser) {
          await onUpdateUser(user.id, { password: passwordForm.new });
        }

        setNotification({ type: 'success', message: '✅ 비밀번호가 성공적으로 변경되었습니다.' });
        setPasswordForm({ current: '', new: '', confirm: '' });

      } catch (err) {
        console.error('비밀번호 변경 오류:', err);
        setNotification({ type: 'error', message: `변경 실패: ${err.message || '알 수 없는 오류'}` });
      }
    } else {
      // ── Supabase 미연결: 로컬 users 배열로 검증 ──
      // App.jsx에서 users 배열을 admin에게만 전달하므로, admin 본인 확인
      const currentPwMatch = user.password === passwordForm.current;
      if (!currentPwMatch) {
        return setNotification({ type: 'error', message: '현재 비밀번호가 올바르지 않습니다.' });
      }

      if (onUpdateUser) {
        try {
          await onUpdateUser(user.id, { password: passwordForm.new });
          setNotification({ type: 'success', message: '✅ 비밀번호가 성공적으로 변경되었습니다.' });
          setPasswordForm({ current: '', new: '', confirm: '' });
        } catch (err) {
          setNotification({ type: 'error', message: `변경 실패: ${err.message || '알 수 없는 오류'}` });
        }
      } else {
        setNotification({ type: 'error', message: '비밀번호 변경 기능을 사용할 수 없습니다.' });
      }
    }
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, [field]: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  // ── 담당자 수정 시 연결된 프로젝트 동기화 ──
  const handleSyncContact = async (originalName, updatedContact) => {
    try {
      // 주담당자(customerContact)가 originalName인 프로젝트 수정
      const primaryMatches = salesData.filter(p => p.customerContact === originalName);
      const secondaryMatches = salesData.filter(p => p.customerContact2 === originalName);

      if (supabase) {
        const updates = [];
        if (primaryMatches.length > 0) {
          updates.push(
            supabase.from('sales_data')
              .update({
                customerContact: updatedContact.name,
                customerPosition: updatedContact.position,
                customerPhone: updatedContact.phone
              })
              .in('id', primaryMatches.map(p => p.id))
          );
        }
        if (secondaryMatches.length > 0) {
          updates.push(
            supabase.from('sales_data')
              .update({
                customerContact2: updatedContact.name,
                customerPosition2: updatedContact.position,
                customerPhone2: updatedContact.phone
              })
              .in('id', secondaryMatches.map(p => p.id))
          );
        }
        if (updates.length > 0) {
          const results = await Promise.all(updates);
          const hasError = results.some(r => r.error);
          if (hasError) throw new Error('일부 프로젝트 업데이트 실패');
        }
      }

      // 로컬 salesData도 즉시 반영
      setSalesData(prev => prev.map(p => {
        if (p.customerContact === originalName) {
          return { ...p, customerContact: updatedContact.name, customerPosition: updatedContact.position, customerPhone: updatedContact.phone };
        }
        if (p.customerContact2 === originalName) {
          return { ...p, customerContact2: updatedContact.name, customerPosition2: updatedContact.position, customerPhone2: updatedContact.phone };
        }
        return p;
      }));

      const total = primaryMatches.length + secondaryMatches.length;
      if (total > 0) {
        setNotification({ type: 'success', message: `담당자 정보 및 연결된 프로젝트 ${total}건 동기화 완료` });
      }
    } catch (err) {
      console.error('프로젝트 동기화 실패:', err);
      setNotification({ type: 'error', message: `프로젝트 동기화 실패: ${err.message}` });
    }
  };

  const openAddModal = () => {
    setEditingItemId(null);
    setFormData({
      customer: '', representative: user.name, project: '', estimateAmount: '', discountAmount: '',
      status: '견적제출중',
      company: companyName,
      customerContact: '', customerPosition: '', customerPhone: '',
      customerContact2: '', customerPosition2: '', customerPhone2: '',
      imageMail: null, imageEstimate: null, imageProduct: null,
      notes: '', statusDates: {},
      quotePdfUrl: '',
      mailPdfUrl: '',
      finalProductPhotos: [],
      agreementImages: [],
      taxInvoiceImages: []
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    if (!canEdit) return;
    setEditingItemId(item.id);
    setFormData({
      ...item,
      discountAmount: item.discountAmount || '',
      notes: item.notes || '',
      customerPosition: item.customerPosition || '',
      customerPhone: item.customerPhone || '',
      customerContact: item.customerContact || '',
      customerPosition2: item.customerPosition2 || '',
      customerPhone2: item.customerPhone2 || '',
      customerContact2: item.customerContact2 || '',
      statusDates: item.statusDates || {},
      quotePdfUrl: item.quotePdfUrl || '',
      mailPdfUrl: item.mailPdfUrl || '',
      finalProductPhotos: item.finalProductPhotos || [],
      agreementImages: item.agreementImages || [],
      taxInvoiceImages: item.taxInvoiceImages || []
    });
    setIsModalOpen(true);
  };

  // ── 별표 토글 (isStarred) ──
  const handleToggleStar = useCallback(async (id) => {
    setSalesData(prev => {
      const updated = prev.map(item =>
        item.id === id ? { ...item, isStarred: !item.isStarred } : item
      );
      localStorage.setItem('smp_sales_data', JSON.stringify(updated));
      if (supabase) {
        const target = updated.find(i => i.id === id);
        if (target) {
          supabase.from('sales_data').update({ is_starred: target.isStarred }).eq('id', id)
            .then(({ error }) => { if (error) console.warn('Supabase star sync:', error.message); });
        }
      }
      return updated;
    });
  }, []);

  // 이미지 압축 유틸리티 함수
  const compressImageForExport = async (base64Str) => {
    if (!base64Str || !base64Str.startsWith('data:image')) return null;
    try {
      const response = await fetch(base64Str).catch(() => null);
      if (!response) return null;
      const blob = await response.blob();
      const file = new File([blob], "image.jpg", { type: "image/jpeg" });

      const options = {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 300,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
      });
    } catch (error) {
      console.error('이미지 압축 중 상세 오류:', error);
      return null;
    }
  };

  // 안전한 데이터 파싱 유틸리티 (null/undefined 방지)
  const safeVal = (val) => (val === null || val === undefined ? "" : String(val));

  const exportToExcel = async () => {
    // 체크된 항목이 있으면 companySalesData 전체 기준으로 필터링 (서브탭 간 체크 누락 방지)
    // 체크 없으면 현재 탭의 baseFilteredData(연도/월/검색 필터 적용) 기준으로 내보내기
    const exportData = selectedIds.length > 0
      ? companySalesData.filter(d => selectedIds.includes(d.id))
      : baseFilteredData;

    if (exportData.length === 0) {
      setNotification({ type: 'error', message: '내보낼 데이터가 없습니다. 필터/검색 조건을 확인하세요.' });
      return;
    }

    try {
      setNotification({ type: 'info', message: `${exportData.length}건 엑셀 리포트 생성 중...` });

      const targetData = exportData;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Selected_Projects');

      worksheet.columns = [
        { header: '소속사업자', key: 'company', width: 14 },
        { header: '등록날짜', key: 'date', width: 14 },
        { header: '견적날짜', key: 'dateEstimate', width: 14 },
        { header: '착수날짜', key: 'dateCommencement', width: 14 },
        { header: '완료마감날짜', key: 'dateClosing', width: 14 },
        { header: '세금계산서날짜', key: 'dateTaxInvoice', width: 16 },
        { header: '수금날짜', key: 'dateCollection', width: 14 },
        { header: '고객사', key: 'customer', width: 20 },
        { header: '고객사 담당자', key: 'clientName', width: 15 },
        { header: '직급', key: 'clientTitle', width: 12 },
        { header: '연락처', key: 'clientPhone', width: 15 },
        { header: '프로젝트명', key: 'project', width: 30 },
        { header: '상태', key: 'status', width: 16 },
        { header: '금액', key: 'amount', width: 16, style: { numFmt: '#,##0' } },
        { header: '견적서 PDF', key: 'quotePdf', width: 20 },
        { header: '메일 PDF', key: 'mailPdf', width: 20 },
        { header: '제품 사진 1', key: 'photo1', width: 20 },
        { header: '제품 사진 2', key: 'photo2', width: 20 },
        { header: '제품 사진 3', key: 'photo3', width: 20 },
      ];

      // 헤더 스타일: 셀 레벨로 직접 적용 (row-level fill이 이후 row에 상속되는 버그 방지)
      const headerRow = worksheet.getRow(1);
      headerRow.height = 28;
      for (let ci = 1; ci <= 19; ci++) {
        const hc = headerRow.getCell(ci);
        hc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
        hc.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
        hc.alignment = { vertical: 'middle', horizontal: 'center' };
        hc.border = {
          bottom: { style: 'thin', color: { argb: 'FF2B4C7E' } },
          right: { style: 'thin', color: { argb: 'FF2B4C7E' } },
        };
      }

      // 날짜 그룹 헤더 셀 별도 강조 (연한 파란색)
      ['dateEstimate', 'dateCommencement', 'dateClosing', 'dateTaxInvoice', 'dateCollection'].forEach(key => {
        const col = worksheet.getColumn(key);
        const headerCell = headerRow.getCell(col.number);
        headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2B4C7E' } };
      });

      for (let i = 0; i < targetData.length; i++) {
        const item = targetData[i];
        const sd = item.statusDates || {};

        // 사진 URL 목록 문자열
        const photoUrls = Array.isArray(item.finalProductPhotos) && item.finalProductPhotos.length > 0
          ? item.finalProductPhotos.join('\n')
          : '';

        // 사진 base64 변환 헬퍼 (fetch 방식 - public 버킷용)
        const toBase64 = (url) => new Promise((resolve) => {
          fetch(url, { mode: 'cors' })
            .then(res => {
              if (!res.ok) { resolve(null); return; }
              return res.blob();
            })
            .then(blob => {
              if (!blob) { resolve(null); return; }
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result.split(',')[1]);
              reader.readAsDataURL(blob);
            })
            .catch(() => resolve(null));
        });


        // 교대 배경색: 흰색(짝수) / 아주 연한 회색(홀수) → 가독성 우선
        const rowBg = i % 2 === 0 ? 'FFFFFFFF' : 'FFF5F7FA';

        const row = worksheet.addRow({
          company: safeVal(item.company || '(주)이루'),
          date: safeVal(item.date),
          dateEstimate: safeVal(sd['견적제출중'] || ''),
          dateCommencement: safeVal(sd['착수완료 진행'] || ''),
          dateClosing: safeVal(sd['완료 마감 대기'] || ''),
          dateTaxInvoice: safeVal(sd['세금계산서 발행 완료'] || ''),
          dateCollection: safeVal(sd['수금 완료'] || ''),
          customer: safeVal(item.customer),
          clientName: safeVal(item.customerContact),
          clientTitle: safeVal(item.customerPosition),
          clientPhone: safeVal(item.customerPhone),
          project: safeVal(item.project),
          status: safeVal(item.status),
          amount: item.discountAmount && Number(item.discountAmount) > 0 ? Number(item.discountAmount) : (Number(item.estimateAmount) || 0),
          quotePdf: item.quotePdfUrl ? item.quotePdfUrl : '',
          mailPdf: item.mailPdfUrl ? item.mailPdfUrl : '',
          photo1: '',
          photo2: '',
          photo3: '',
        });

        row.height = 24;
        row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };

        // ── 행 레벨 fill 먼저 설정 (xlsx에서 customFormat=1로 기록 → 미작성 빈 셀까지 커버) ──
        const rowFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
        const rowFont = { color: { argb: 'FF1A1A2E' }, size: 9 };
        const rowBorder = {
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
        row.fill = rowFill;   // 행 전체 기본 배경 (모든 미작성 셀 포함)

        // ── 컬럼 인덱스(1-based)로 직접 접근하여 셀 레벨 fill 재확인 ──
        for (let colIdx = 1; colIdx <= 19; colIdx++) {
          const c = row.getCell(colIdx);
          c.fill = rowFill;
          c.font = rowFont;
          c.border = rowBorder;
        }

        // 소속사업자 셀: 이루=남색계, 가치=주황계 (배경 연하게)
        const companyCell = row.getCell('company');
        const isGachi = (item.company === '(주)가치' || item.company === '가치' || item.company === 'gachi');
        companyCell.font = { bold: true, color: { argb: isGachi ? 'FFB45309' : 'FF3730A3' }, size: 9 };
        companyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isGachi ? 'FFFFF7ED' : 'FFEFF0FF' } };
        companyCell.alignment = { vertical: 'middle', horizontal: 'center' };

        // 날짜 셀: 가운데 정렬 + 연한 파란 배경
        ['dateEstimate', 'dateCommencement', 'dateClosing', 'dateTaxInvoice', 'dateCollection'].forEach(key => {
          const cell = row.getCell(key);
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          if (cell.value) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F4FD' } };
            cell.font = { color: { argb: 'FF1E3A5F' }, size: 9 };
          }
        });

        // 금액 셀: 오른쪽 정렬 + 굵게
        const amountCell = row.getCell('amount');
        amountCell.alignment = { vertical: 'middle', horizontal: 'right' };
        amountCell.font = { bold: true, color: { argb: 'FF1A5276' }, size: 9 };
        amountCell.numFmt = '#,##0';

        // 상태 셀: 가운데 정렬
        row.getCell('status').alignment = { vertical: 'middle', horizontal: 'center' };

        // 견적서 PDF 하이퍼링크
        if (item.quotePdfUrl) {
          const cell = row.getCell('quotePdf');
          cell.value = { text: '견적서 열기', hyperlink: item.quotePdfUrl };
          cell.font = { color: { argb: 'FF0070C0' }, underline: true, size: 9 };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }

        // 메일 PDF 하이퍼링크
        if (item.mailPdfUrl) {
          const cell = row.getCell('mailPdf');
          cell.value = { text: '메일 PDF 열기', hyperlink: item.mailPdfUrl };
          cell.font = { color: { argb: 'FF0070C0' }, underline: true, size: 9 };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }

        // 제품 사진: 하이퍼링크로 삽입 (최대 3장)
        if (Array.isArray(item.finalProductPhotos) && item.finalProductPhotos.length > 0) {
          const photoKeys = ['photo1', 'photo2', 'photo3'];
          const photosToShow = item.finalProductPhotos.slice(0, 3);
          photosToShow.forEach((photoUrl, pi) => {
            const photoCell = row.getCell(photoKeys[pi]);
            photoCell.value = { text: `클릭하면 사진${pi + 1} 열기`, hyperlink: photoUrl };
            photoCell.font = { color: { argb: 'FF0070C0' }, underline: true, size: 9, bold: true };
            photoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pi === 0 ? 'FFE8F4FD' : pi === 1 ? 'FFEAF7EA' : 'FFFFF3E0' } };
            photoCell.alignment = { vertical: 'middle', horizontal: 'center' };
          });
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `Selected_Projects_${new Date().toISOString().split('T')[0]}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);

      setNotification({ type: 'success', message: '엑셀 다운로드 완료' });
    } catch (error) {
      console.error('Excel Export Error:', error);
      setNotification({ type: 'error', message: '엑셀 파일 생성 중 오류가 발생했습니다.' });
    }
  };

  const exportToPDF = async () => {
    const exportData = selectedIds.length > 0
      ? baseFilteredData.filter(d => selectedIds.includes(d.id))
      : baseFilteredData;

    if (exportData.length === 0) {
      setNotification({ type: 'error', message: '내보낼 데이터가 없습니다. 필터/검색 조건을 확인하세요.' });
      return;
    }

    try {
      setNotification({ type: 'info', message: 'PDF 리포트 생성 중... (한글 폰트 로딩)' });

      const targetData = exportData;
      const FONT_NAME = 'MalgunGothic';
      const FONT_FILE = 'MalgunGothic.ttf';
      let fontLoaded = false;
      let base64Font = null;
      try {
        const fontRes = await fetch(`/${FONT_FILE}`);
        if (!fontRes.ok) throw new Error(`Font fetch failed: ${fontRes.status}`);
        const fontBuffer = await fontRes.arrayBuffer();
        // ArrayBuffer → Base64 (청크 단위로 String.fromCharCode 호출하여 콜 스택 오버플로 방지)
        const uint8 = new Uint8Array(fontBuffer);
        const chunks = [];
        const chunkSize = 4096;
        for (let i = 0; i < uint8.length; i += chunkSize) {
          chunks.push(String.fromCharCode.apply(null, uint8.subarray(i, i + chunkSize)));
        }
        base64Font = btoa(chunks.join(''));
        fontLoaded = true;
        console.log('한글 폰트(맑은고딕) VFS 등록 준비 완료, 크기:', uint8.length, 'bytes');
      } catch (fontErr) {
        console.warn('한글 폰트 로드 실패, 기본 폰트로 대체합니다:', fontErr);
      }

      // ── 2단계: 이미지 압축 (폰트 로드 완료 후 시작) ──
      const tableRows = [];
      for (const item of targetData) {
        const representativeImg = item.imageProduct || item.imageEstimate || item.imageMail || null;
        let compressed = null;
        if (representativeImg) {
          compressed = await compressImageForExport(representativeImg);
        }
        tableRows.push([
          safeVal(item.date),
          safeVal(item.customer),
          safeVal(item.customerContact),
          safeVal(item.customerPosition),
          safeVal(item.customerPhone),
          safeVal(item.project),
          `${(item.discountAmount > 0 ? item.discountAmount : item.estimateAmount || 0).toLocaleString()}`,
          safeVal(item.representative),
          safeVal(item.status),
          { content: '', image: compressed }
        ]);
      }

      // ── 3단계: PDF 렌더링 (이미 로드된 base64Font 재사용) ──
      const doc = new jsPDF('l', 'mm', 'a4');
      if (fontLoaded && base64Font) {
        doc.addFileToVFS(FONT_FILE, base64Font);
        doc.addFont(FONT_FILE, FONT_NAME, 'normal');
        doc.setFont(FONT_NAME);
      }

      doc.setFontSize(16);
      doc.text('PROJECT STRATEGY STATUS REPORT (SELECTED)', 12, 18);
      doc.setFontSize(9);
      doc.text(`출력일시: ${new Date().toLocaleString('ko-KR')} | 대상 건수: ${targetData.length}건`, 12, 25);

      const tableColumn = ["날짜", "고객사", "고객사담당자", "직급", "연락처", "프로젝트명", "금액(W)", "담당요원", "작전상태", "참조이미지"];

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 28,
        styles: {
          fontSize: 8,
          cellPadding: 1.2,
          verticalAlign: 'middle',
          font: fontLoaded ? FONT_NAME : 'helvetica',
          overflow: 'linebreak',
          lineWidth: 0.1,
          lineColor: [200, 200, 200]
        },
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: 255,
          font: fontLoaded ? FONT_NAME : 'helvetica',
          fontStyle: 'normal',
          fontSize: 8,
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 18, halign: 'center' },   // 날짜
          1: { cellWidth: 22 },                      // 고객사
          2: { cellWidth: 22 },                      // 고객사 담당자
          3: { cellWidth: 14 },                      // 직급
          4: { cellWidth: 24 },                      // 연락처
          5: { cellWidth: 'auto' },                  // 프로젝트명: 남은 공간 자동 채움
          6: { cellWidth: 22, halign: 'right' },     // 금액
          7: { cellWidth: 18, halign: 'center' },    // 담당요원
          8: { cellWidth: 22, halign: 'center' },    // 작전상태
          9: { cellWidth: 30, minCellHeight: 18 }    // 참조이미지
        },
        didDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 9) {
            const imgData = data.cell.raw.image;
            if (imgData) {
              const pad = 1.2;
              try {
                doc.addImage(
                  imgData, 'JPEG',
                  data.cell.x + pad, data.cell.y + pad,
                  data.cell.width - pad * 2, data.cell.height - pad * 2
                );
              } catch (e) {
                console.warn('PDF 셀 이미지 삽입 실패:', e);
              }
            }
          }
        },
        margin: { top: 28, left: 12, right: 12 }
      });

      doc.save(`IRU_Selected_Projects_${new Date().getTime()}.pdf`);
      setNotification({ type: 'success', message: `PDF 다운로드 완료 (${fontLoaded ? '한글 폰트 적용됨' : '기본 폰트'})` });
    } catch (error) {
      console.error('PDF Export Error Full Context:', error);
      setNotification({ type: 'error', message: 'PDF 리포트 생성 중 시스템 오류가 발생했습니다.' });
    }
  };

  const handleToggleAllSelection = (currentData) => {
    startTransition(() => {
      if (selectedIds.length > 0 && selectedIds.length === currentData.length) {
        setSelectedIds([]);
      } else {
        setSelectedIds(currentData.map(d => d.id));
      }
    });
  };

  const handleToggleSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className={`dashboard-container ${config.isDarkMode ? 'dark' : ''} ${config.isCompactView ? 'compact-view' : ''}`}>
      {notification && (
        <div className={`toast glass ${notification.type}`}>
          {notification.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          {notification.message}
        </div>
      )}

      <Sidebar
        user={user} onLogout={onLogout} activeTab={activeTab} setActiveTab={setActiveTab}
        users={users} roleNames={roleNames} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
        companyMode={companyMode}
      />

      <main className="main-content">
        <header className="content-header">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1 }}>
            <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={20} /> <span>메뉴</span>
            </button>
            <div>
              <h2>{activeTab === 'dashboard' ? `반갑습니다, ${user.name} 👋` :
                activeTab === 'kanban' ? '작전 단계별 상황판' :
                  activeTab === 'quotation' ? '견적서 작성 도우미' :
                    activeTab === 'status' ? `${companyName} 프로젝트 통합 현황` :
                      activeTab === 'estimates' ? `${companyName} 견적서 제출 현황` :
                        activeTab === 'pending' ? `${companyName} 업체 미선정 현황` :
                          activeTab === 'commencement' ? `${companyName} 착수 완료 현황` :
                            activeTab === 'closing' ? `${companyName} 완료 마감 대기 현황` :
                              activeTab === 'tax_invoice' ? `${companyName} 세금계산서 발행 완료` :
                                activeTab === 'collection' ? `${companyName} 수금 완료 현황` :
                                  activeTab === 'admin' ? '요원 관리 본부' : '시스템 설정'}</h2>
              <p>{activeTab === 'dashboard' ? '오늘의 주요 작전 보고를 확인하세요.' : '데이터 기반의 정밀한 관리를 시작합니다.'}</p>
              {/* 버튼: 제목 아래 좌측 정렬 */}
              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {activeTab === 'dashboard' && user.role === 'admin' && (
                  <button
                    className={`layout-lock-btn ${!isLayoutLocked ? 'is-editing' : ''}`}
                    onClick={toggleLayoutLock}
                    title={isLayoutLocked ? "배치 수정 시작" : "배치 잠금 및 저장"}
                  >
                    {isLayoutLocked ? <Unlock size={18} /> : <Lock size={18} />}
                    {isLayoutLocked ? "레이아웃 편집" : "편집 완료"}
                  </button>
                )}
                {canEdit && (
                  <button className="btn btn-primary" onClick={openAddModal}><Plus size={18} /> 프로젝트 등록</button>
                )}
                {/* 별표 알림 배지 */}
                {(() => {
                  const starCount = salesData.filter(d => d.isStarred).length;
                  if (starCount === 0) return null;
                  return (
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      title={`팀원 요청 항목 ${starCount}건 - 대시보드에서 확인`}
                      style={{
                        position: 'relative',
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        background: 'rgba(245,158,11,0.15)',
                        border: '1px solid rgba(245,158,11,0.4)',
                        color: '#f59e0b',
                        borderRadius: '10px',
                        padding: '0.4rem 0.85rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem', fontWeight: '700',
                        animation: 'pulse-amber 2s infinite',
                      }}
                    >
                      <Star size={15} fill="#f59e0b" color="#f59e0b" />
                      요청 {starCount}건
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="header-search-center">
            <div className="smart-filter-bar glass">
              <div className="search-box main-search">
                <Menu size={16} />
                <input
                  type="text"
                  placeholder="검색 (고객, 프로젝트, 담당자...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0 4px' }}>✕</button>
                )}
              </div>
              <div className="date-range-picker">
                <span className="date-range-label">📅</span>
                <input
                  type="date"
                  className="date-input"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(r => ({ ...r, start: e.target.value }))}
                  title="시작일"
                />
                <span className="date-range-sep">~</span>
                <input
                  type="date"
                  className="date-input"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(r => ({ ...r, end: e.target.value }))}
                  title="종료일"
                />
                {(dateRange.start || dateRange.end) && (
                  <button
                    onClick={() => setDateRange({ start: '', end: '' })}
                    className="date-range-clear"
                    title="기간 필터 초기화"
                  >✕</button>
                )}
              </div>
            </div>
          </div>

          <div className="header-actions">
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="animate-fade" style={{ position: 'relative' }}>


            <ResponsiveGridLayout
              className={`layout ${!isLayoutLocked ? 'is-editing' : ''}`}
              layouts={layouts}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
              rowHeight={30}
              draggableHandle=".edit-mode-overlay"
              isDraggable={user.role === 'admin' && !isLayoutLocked}
              isResizable={user.role === 'admin' && !isLayoutLocked}
              onLayoutChange={onLayoutChange}
              margin={[20, 20]}
            >

              <div key="warnings">
                <div style={{ height: '100%', position: 'relative', overflow: 'auto', borderRadius: '16px' }}>
                  {user.role === 'admin' && !isLayoutLocked && (
                    <div className="edit-mode-overlay">
                      <div className="admin-draggable-handle is-active" style={{ position: 'absolute', top: 0, left: 0, background: '#ef4444' }}>
                        <GripVertical size={16} />
                      </div>
                      <span className="edit-guide-text">이동 및 크기 조절 중...</span>
                    </div>
                  )}
                  <ZeroEstimateWarning salesData={companySalesData} onEdit={openEditModal} />
                </div>
              </div>
              <div key="distribution">
                <div style={{ height: '100%', position: 'relative', overflow: 'auto', borderRadius: '16px' }}>
                  {user.role === 'admin' && !isLayoutLocked && (
                    <div className="edit-mode-overlay">
                      <div className="admin-draggable-handle is-active" style={{ position: 'absolute', top: 0, left: 0, background: '#818cf8' }}>
                        <GripVertical size={16} />
                      </div>
                      <span className="edit-guide-text">이동 및 크기 조절 중...</span>
                    </div>
                  )}
                  <StatusDistribution salesData={companySalesData} onStatusClick={() => setActiveTab('kanban')} />
                </div>
              </div>
              <div key="activity">
                <div style={{ height: '100%', position: 'relative', overflow: 'auto', borderRadius: '16px' }}>
                  {user.role === 'admin' && !isLayoutLocked && (
                    <div className="edit-mode-overlay">
                      <div className="admin-draggable-handle is-active" style={{ position: 'absolute', top: 0, left: 0 }}>
                        <GripVertical size={16} />
                      </div>
                      <span className="edit-guide-text">이동 및 크기 조절 중...</span>
                    </div>
                  )}
                  <ActivityLog salesData={companySalesData} />
                </div>
              </div>
              <div key="trends">
                <div style={{ height: '100%', position: 'relative', overflow: 'auto', background: 'rgba(30, 41, 59, 0.7)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem' }}>
                  {user.role === 'admin' && !isLayoutLocked && (
                    <div className="edit-mode-overlay">
                      <div className="admin-draggable-handle is-active" style={{ position: 'absolute', top: 0, left: 0 }}>
                        <GripVertical size={16} />
                      </div>
                      <span className="edit-guide-text">이동 및 크기 조절 중...</span>
                    </div>
                  )}
                  <TrendsChart
                    selectedYears={selectedYears} chartData={chartData} setSelectedMonth={setSelectedMonth}
                    years={years} toggleYear={toggleYear} yearColors={yearColors}
                    yearTotals={(() => {
                      const totals = {};
                      if (selectedYears.length === 1) {
                        // 단일 연도: chartData는 { name, sales } 구조
                        totals[selectedYears[0]] = chartData.reduce((sum, m) => sum + (m.sales || 0), 0);
                      } else {
                        // 멀티 연도: chartData는 { name, 2022: X, 2026: Y } 구조
                        selectedYears.forEach(y => {
                          totals[y] = chartData.reduce((sum, m) => sum + (m[y] || 0), 0);
                        });
                      }
                      return totals;
                    })()}
                  />
                </div>
              </div>
              <div key="revenue">
                <div style={{ height: '100%', position: 'relative', overflow: 'auto', background: 'rgba(30, 41, 59, 0.7)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem' }}>
                  {user.role === 'admin' && !isLayoutLocked && (
                    <div className="edit-mode-overlay">
                      <div className="admin-draggable-handle is-active" style={{ position: 'absolute', top: 0, left: 0 }}>
                        <GripVertical size={16} />
                      </div>
                      <span className="edit-guide-text">이동 및 크기 조절 중...</span>
                    </div>
                  )}
                  <CustomerRevenueChart salesData={companySalesData} selectedYears={selectedYears} />
                </div>
              </div>
              <div key="starred">
                <div style={{ height: '100%', position: 'relative', overflow: 'auto', borderRadius: '16px' }}>
                  {user.role === 'admin' && !isLayoutLocked && (
                    <div className="edit-mode-overlay">
                      <div className="admin-draggable-handle is-active" style={{ position: 'absolute', top: 0, left: 0, background: '#f59e0b' }}>
                        <GripVertical size={16} />
                      </div>
                      <span className="edit-guide-text">이동 및 크기 조절 중...</span>
                    </div>
                  )}
                  <StarredItemsWidget salesData={companySalesData} onOpenEdit={openEditModal} user={user} />
                </div>
              </div>
            </ResponsiveGridLayout>
          </div>
        )}

        {activeTab === 'kanban' && (
          <KanbanTab
            salesData={sortedAndFilteredData.filter(companyFilter)}
            openEditModal={openEditModal}
            canEdit={canEdit}
          />
        )}

        {activeTab === 'quotation' && (
          <QuotationHelperTab
            user={user}
            salesData={companySalesData}
          />
        )}

        {activeTab === 'status' && (
          <StatusTab
            canEdit={canEdit} downloadTemplate={downloadTemplate} handleExcelUpload={handleExcelUpload}
            exportToExcel={exportToExcel} exportToPDF={exportToPDF} fetchSalesData={fetchSalesData}
            setIsModalOpen={openAddModal} selectedIds={selectedIds} handleBulkDelete={handleBulkDelete}
            salesData={allSortedAndFilteredData} config={config}
            toggleAllSelection={() => handleToggleAllSelection(allSortedAndFilteredData)}
            toggleSelection={(e, id) => { e.stopPropagation(); handleToggleSelection(id); }}
            isPending={isPending}
            openEditModal={openEditModal} handleDeleteItem={handleDeleteItem} user={user}
            isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
            statusFilters={statusFilters} toggleStatusFilter={toggleStatusFilter}
            sortConfig={sortConfig} requestSort={requestSort}
            yearFilter={yearFilter} setYearFilter={setYearFilter} availableYears={availableYears}
            setSelectedIds={setSelectedIds}
            onToggleStar={handleToggleStar}
            onMerge={handleOpenMerge}
          />
        )}

        {activeTab === 'estimates' && (
          <StatusTab
            canEdit={canEdit} downloadTemplate={downloadTemplate} handleExcelUpload={handleExcelUpload}
            exportToExcel={exportToExcel} exportToPDF={exportToPDF} fetchSalesData={fetchSalesData}
            setIsModalOpen={openAddModal} selectedIds={selectedIds} handleBulkDelete={handleBulkDelete}
            salesData={sortData(applySearch(filterByStatusDateYear(salesData.filter(d => d.status === '견적제출중' && companyFilter(d) && !d.mergedInto), '견적제출중')))} config={{ ...config, isCompactView: true }}
            toggleAllSelection={() => handleToggleAllSelection(applySearch(filterByStatusDateYear(salesData.filter(d => d.status === '견적제출중' && companyFilter(d) && !d.mergedInto), '견적제출중')))}
            toggleSelection={(e, id) => { e.stopPropagation(); handleToggleSelection(id); }}
            isPending={isPending}
            openEditModal={openEditModal} handleDeleteItem={handleDeleteItem} user={user}
            isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
            statusFilters={['견적제출중']} toggleStatusFilter={() => { }}
            hideFilter={true}
            yearFilter={yearFilter} setYearFilter={setYearFilter} availableYears={availableYears}
            sortConfig={sortConfig} requestSort={requestSort}
            setSelectedIds={setSelectedIds}
            onToggleStar={handleToggleStar}
            onMerge={handleOpenMerge}
          />
        )}

        {activeTab === 'pending' && (
          <StatusTab
            canEdit={canEdit} downloadTemplate={downloadTemplate} handleExcelUpload={handleExcelUpload}
            exportToExcel={exportToExcel} exportToPDF={exportToPDF} fetchSalesData={fetchSalesData}
            setIsModalOpen={openAddModal} selectedIds={selectedIds} handleBulkDelete={handleBulkDelete}
            salesData={sortData(applySearch(filterByStatusDateYear(salesData.filter(d => d.status === '업체미선정' && companyFilter(d) && !d.mergedInto), '업체미선정')))} config={{ ...config, isCompactView: true }}
            toggleAllSelection={() => handleToggleAllSelection(applySearch(filterByStatusDateYear(salesData.filter(d => d.status === '업체미선정' && companyFilter(d) && !d.mergedInto), '업체미선정')))}
            toggleSelection={(e, id) => { e.stopPropagation(); handleToggleSelection(id); }}
            isPending={isPending}
            openEditModal={openEditModal} handleDeleteItem={handleDeleteItem} user={user}
            isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
            statusFilters={['업체미선정']} toggleStatusFilter={() => { }}
            hideFilter={true}
            yearFilter={yearFilter} setYearFilter={setYearFilter} availableYears={availableYears}
            sortConfig={sortConfig} requestSort={requestSort}
            setSelectedIds={setSelectedIds}
            onToggleStar={handleToggleStar}
            onMerge={handleOpenMerge}
          />
        )}

        {activeTab === 'commencement' && (
          <StatusTab
            canEdit={canEdit} downloadTemplate={downloadTemplate} handleExcelUpload={handleExcelUpload}
            exportToExcel={exportToExcel} exportToPDF={exportToPDF} fetchSalesData={fetchSalesData}
            setIsModalOpen={openAddModal} selectedIds={selectedIds} handleBulkDelete={handleBulkDelete}
            salesData={sortData(applySearch(filterByStatusDateYear(salesData.filter(d => d.status === '착수완료 진행' && companyFilter(d) && !d.mergedInto), '착수완료 진행')))} config={{ ...config, isCompactView: true }}
            toggleAllSelection={() => handleToggleAllSelection(applySearch(filterByStatusDateYear(salesData.filter(d => d.status === '착수완료 진행' && companyFilter(d) && !d.mergedInto), '착수완료 진행')))}
            toggleSelection={(e, id) => { e.stopPropagation(); handleToggleSelection(id); }}
            isPending={isPending}
            openEditModal={openEditModal} handleDeleteItem={handleDeleteItem} user={user}
            isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
            statusFilters={['착수완료 진행']} toggleStatusFilter={() => { }}
            hideFilter={true}
            yearFilter={yearFilter} setYearFilter={setYearFilter} availableYears={availableYears}
            sortConfig={sortConfig} requestSort={requestSort}
            setSelectedIds={setSelectedIds}
            onToggleStar={handleToggleStar}
            onMerge={handleOpenMerge}
          />
        )}

        {activeTab === 'closing' && (
          <StatusTab
            canEdit={canEdit} downloadTemplate={downloadTemplate} handleExcelUpload={handleExcelUpload}
            exportToExcel={exportToExcel} exportToPDF={exportToPDF} fetchSalesData={fetchSalesData}
            setIsModalOpen={openAddModal} selectedIds={selectedIds} handleBulkDelete={handleBulkDelete}
            salesData={sortData(applySearch(filterByStatusDateYear(salesData.filter(d => d.status === '완료 마감 대기' && companyFilter(d) && !d.mergedInto), '완료 마감 대기')))} config={{ ...config, isCompactView: true }}
            toggleAllSelection={() => handleToggleAllSelection(applySearch(filterByStatusDateYear(salesData.filter(d => d.status === '완료 마감 대기' && companyFilter(d) && !d.mergedInto), '완료 마감 대기')))}
            toggleSelection={(e, id) => { e.stopPropagation(); handleToggleSelection(id); }}
            isPending={isPending}
            openEditModal={openEditModal} handleDeleteItem={handleDeleteItem} user={user}
            isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
            statusFilters={['완료 마감 대기']} toggleStatusFilter={() => { }}
            hideFilter={true}
            yearFilter={yearFilter} setYearFilter={setYearFilter} availableYears={availableYears}
            sortConfig={sortConfig} requestSort={requestSort}
            setSelectedIds={setSelectedIds}
            onToggleStar={handleToggleStar}
            onMerge={handleOpenMerge}
          />
        )}

        {activeTab === 'tax_invoice' && (
          <StatusTab
            canEdit={canEdit} downloadTemplate={downloadTemplate} handleExcelUpload={handleExcelUpload}
            exportToExcel={exportToExcel} exportToPDF={exportToPDF} fetchSalesData={fetchSalesData}
            setIsModalOpen={openAddModal} selectedIds={selectedIds} handleBulkDelete={handleBulkDelete}
            salesData={sortData(applySearch(filterByStatusDateYear(salesData.filter(d => d.status === '세금계산서 발행 완료' && companyFilter(d) && !d.mergedInto), '세금계산서 발행 완료')))}
            config={{ ...config, isCompactView: true }}
            toggleAllSelection={() => handleToggleAllSelection(applySearch(filterByStatusDateYear(salesData.filter(d => d.status === '세금계산서 발행 완료' && companyFilter(d) && !d.mergedInto), '세금계산서 발행 완료')))}
            toggleSelection={(e, id) => { e.stopPropagation(); handleToggleSelection(id); }}
            isPending={isPending}
            openEditModal={openEditModal} handleDeleteItem={handleDeleteItem} user={user}
            isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
            statusFilters={['세금계산서 발행 완료']} toggleStatusFilter={() => { }}
            hideFilter={true}
            yearFilter={yearFilter} setYearFilter={setYearFilter} availableYears={availableYears}
            statusDateKey="세금계산서 발행 완료"
            sortConfig={sortConfig} requestSort={requestSort}
            setSelectedIds={setSelectedIds}
            onToggleStar={handleToggleStar}
            onMerge={handleOpenMerge}
          />
        )}

        {activeTab === 'collection' && (
          <StatusTab
            canEdit={canEdit} downloadTemplate={downloadTemplate} handleExcelUpload={handleExcelUpload}
            exportToExcel={exportToExcel} exportToPDF={exportToPDF} fetchSalesData={fetchSalesData}
            setIsModalOpen={openAddModal} selectedIds={selectedIds} handleBulkDelete={handleBulkDelete}
            salesData={sortData(applySearch(filterByStatusDateYear(salesData.filter(d => d.status === '수금 완료' && companyFilter(d) && !d.mergedInto), '수금 완료')))}
            config={{ ...config, isCompactView: true }}
            toggleAllSelection={() => handleToggleAllSelection(applySearch(filterByStatusDateYear(salesData.filter(d => d.status === '수금 완료' && companyFilter(d) && !d.mergedInto), '수금 완료')))}
            toggleSelection={(e, id) => { e.stopPropagation(); handleToggleSelection(id); }}
            isPending={isPending}
            openEditModal={openEditModal} handleDeleteItem={handleDeleteItem} user={user}
            isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
            statusFilters={['수금 완료']} toggleStatusFilter={() => { }}
            hideFilter={true}
            yearFilter={yearFilter} setYearFilter={setYearFilter} availableYears={availableYears}
            statusDateKey="수금 완료"
            sortConfig={sortConfig} requestSort={requestSort}
            setSelectedIds={setSelectedIds}
            onToggleStar={handleToggleStar}
            onMerge={handleOpenMerge}
          />
        )}



        {activeTab === 'contacts' && (
          <ContactsTab
            canEdit={canEdit}
            supabase={supabase}
            fetchContactsData={fetchContactsData}
            contactsData={contactsData}
            setNotification={setNotification}
            salesData={salesData}
            onSyncContact={handleSyncContact}
          />
        )}

        {activeTab === 'admin' && (
          <AdminTab
            users={users} onApproveUser={onApproveUser} onRejectUser={onRejectUser}
            onChangeUserRole={onChangeUserRole} onUpdateUser={onUpdateUser}
            setNotification={setNotification} roleNames={roleNames}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            supabase={supabase} config={config} setConfig={setConfig}
            setNotification={setNotification} yearlyTargets={yearlyTargets}
            setYearlyTargets={setYearlyTargets} years={years} passwordForm={passwordForm}
            setPasswordForm={setPasswordForm} handleUpdatePassword={handleUpdatePassword}
          />
        )}

        {activeTab === 'company_intro' && (
          <CompanyIntroPage />
        )}
      </main >

      {isModalOpen && (
        <ProjectModal
          editingItemId={editingItemId} setIsModalOpen={setIsModalOpen} setEditingItemId={setEditingItemId}
          handleAddData={(e) => { e.preventDefault(); processDataSave(true); }} formData={formData} setFormData={setFormData}
          handleFileChange={handleFileChange} user={user} handleDeleteItem={handleDeleteItem}
          isSaving={isSaving} processDataSave={processDataSave}
          contactsData={contactsData}
        />
      )}

      <MergeModal
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        selectedProjects={salesData.filter(item => mergeTargetIds.includes(item.id))}
        onConfirm={handleMergeConfirm}
      />

      <PDFReportTemplate user={user} salesData={salesData} />
    </div >
  );
};

export default Dashboard;
