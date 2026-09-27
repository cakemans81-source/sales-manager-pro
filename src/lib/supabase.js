import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 로그인 세션 토큰: 모든 요청에 x-smp-token 헤더로 실어 보내고,
// DB의 RLS 정책(smp_request_role)이 이 토큰으로 역할(조회/작성/관리자)을 확인한다.
let authToken = null;
export const setAuthToken = (token) => { authToken = token || null; };

const fetchWithSessionToken = (input, init = {}) => {
    const headers = new Headers(init.headers || {});
    if (authToken) headers.set('x-smp-token', authToken);
    return fetch(input, { ...init, headers });
};

export const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL')
    ? createClient(supabaseUrl, supabaseAnonKey, { global: { fetch: fetchWithSessionToken } })
    : null;

// 데이터 동기화 유틸리티 (대시보드에서 사용)
export const syncSalesData = async () => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('sales_data')
        .select('*')
        .order('date', { ascending: false });

    if (error) {
        console.error('Supabase fetch error:', error);
        return null;
    }
    return data;
};

export const saveSaleEntry = async (entry) => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('sales_data')
        .insert([entry]);

    if (error) {
        console.error('Supabase save error:', error);
        throw error;
    }
    return data;
};
