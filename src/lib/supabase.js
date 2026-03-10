import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL')
    ? createClient(supabaseUrl, supabaseAnonKey)
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
