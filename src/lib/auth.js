/**
 * 서버측 인증 RPC 래퍼
 * - 비밀번호 검증/해시는 Supabase DB 함수(smp_*)에서만 수행하고, 브라우저는 비밀번호 목록을 받지 않는다.
 * - 로그인 시 발급되는 세션 토큰으로 관리자 기능 권한을 서버에서 확인한다.
 */
import { supabase } from './supabase';

const LOGIN_MESSAGES = {
    INVALID: '아이디 또는 비밀번호가 일치하지 않습니다.',
    NOT_ACTIVE: '승인되지 않았거나 비활성화된 계정입니다.',
};

const SIGNUP_MESSAGES = {
    DUPLICATE: '이미 존재하는 아이디입니다.',
    PASSWORD_TOO_SHORT: '비밀번호는 4자 이상이어야 합니다.',
    INVALID_INPUT: '아이디, 비밀번호, 이름을 모두 입력해 주세요.',
};

const ADMIN_ERRORS = {
    SESSION_EXPIRED: '로그인 세션이 만료되었습니다. 다시 로그인해 주세요.',
    FORBIDDEN: '관리자 권한이 필요합니다.',
    INVALID_ROLE: '올바르지 않은 권한입니다.',
    CANNOT_TARGET_SELF: '현재 로그인한 본인 계정은 삭제할 수 없습니다.',
    LAST_ADMIN: '마지막 관리자는 삭제할 수 없습니다.',
    NOT_FOUND: '사용자를 찾을 수 없습니다.',
    PASSWORD_TOO_SHORT: '비밀번호는 4자 이상이어야 합니다.',
};

export const isSessionExpiredError = (err) => String(err?.message || '').includes('SESSION_EXPIRED');

const requireClient = () => {
    if (!supabase) throw new Error('클라우드(Supabase) 연결이 필요합니다.');
    return supabase;
};

const call = async (fn, args) => {
    const { data, error } = await requireClient().rpc(fn, args);
    if (error) {
        const code = Object.keys(ADMIN_ERRORS).find(k => String(error.message || '').includes(k));
        const err = new Error(code ? ADMIN_ERRORS[code] : error.message);
        if (code === 'SESSION_EXPIRED') err.message = `${ADMIN_ERRORS.SESSION_EXPIRED} (SESSION_EXPIRED)`;
        throw err;
    }
    return data;
};

export const login = async (employeeId, password) => {
    const res = await call('smp_login', { p_employee_id: employeeId, p_password: password });
    if (!res?.ok) return { success: false, message: LOGIN_MESSAGES[res?.reason] || '로그인에 실패했습니다.' };
    return { success: true, user: { ...res.user, token: res.token } };
};

export const logout = async (token) => {
    if (!supabase || !token) return;
    try { await supabase.rpc('smp_logout', { p_token: token }); } catch { /* 로그아웃은 실패해도 로컬 세션은 정리 */ }
};

export const signup = async ({ id, password, name }) => {
    const res = await call('smp_signup', { p_employee_id: id, p_password: password, p_name: name });
    if (!res?.ok) return { success: false, message: SIGNUP_MESSAGES[res?.reason] || '가입 신청에 실패했습니다.' };
    return { success: true, message: '가입 신청이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.' };
};

export const changePassword = async (token, current, next) => {
    const res = await call('smp_change_password', { p_token: token, p_current: current, p_new: next });
    if (res?.ok) return { success: true };
    const messages = {
        WRONG_PASSWORD: '현재 비밀번호가 올바르지 않습니다.',
        PASSWORD_TOO_SHORT: '비밀번호는 4자 이상이어야 합니다.',
        SESSION_EXPIRED: `${ADMIN_ERRORS.SESSION_EXPIRED} (SESSION_EXPIRED)`,
    };
    return { success: false, message: messages[res?.reason] || '비밀번호 변경에 실패했습니다.' };
};

export const adminListUsers = (token) => call('smp_admin_list_users', { p_token: token });
export const adminApproveUser = (token, target, role) => call('smp_admin_approve_user', { p_token: token, p_target: target, p_role: role });
export const adminRejectUser = (token, target) => call('smp_admin_reject_user', { p_token: token, p_target: target });
export const adminChangeRole = (token, target, role) => call('smp_admin_change_role', { p_token: token, p_target: target, p_role: role });
export const adminUpdateUser = (token, target, name, newPassword) =>
    call('smp_admin_update_user', { p_token: token, p_target: target, p_name: name, p_new_password: newPassword || null });

export const adminDeactivateUser = async (token, target) => {
    const res = await call('smp_admin_deactivate_user', { p_token: token, p_target: target });
    if (res?.ok) return { success: true, message: '사용자가 삭제 처리되었습니다. 기존 프로젝트 기록은 유지됩니다.' };
    return { success: false, message: ADMIN_ERRORS[res?.reason] || '삭제 처리에 실패했습니다.' };
};
