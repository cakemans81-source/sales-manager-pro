/**
 * 엑셀 시리얼 번호 또는 다양한 날짜 형식을 'YYYY.M.D' 형식으로 변환합니다.
 */
export const formatDate = (val) => {
    if (!val) return '-';

    // JS Date 객체인 경우
    if (val instanceof Date) {
        if (isNaN(val.getTime())) return '-';
        return `${val.getFullYear()}.${val.getMonth() + 1}.${val.getDate()}`;
    }

    // 숫자형태(엑셀 시리얼 번호)인 경우
    if (typeof val === 'number') {
        const date = new Date((val - 25569) * 86400 * 1000);
        if (isNaN(date.getTime())) return String(val);
        return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
    }

    if (typeof val === 'string') {
        const trimmed = val.trim();

        // 유효하지 않은 문자열 (".", "..", 공백, 빈 문자열 등) → 빈 값으로 처리
        if (!trimmed || /^[.\s]+$/.test(trimmed)) return '-';

        // 문자열이 숫자로만 구성된 경우 (엑셀 시리얼 번호 문자열)
        if (/^[0-9]+(\.[0-9]+)?$/.test(trimmed)) {
            const num = Number(trimmed);
            const date = new Date((num - 25569) * 86400 * 1000);
            if (!isNaN(date.getTime()) && date.getFullYear() > 1990) {
                return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
            }
        }

        // 이미 날짜 형식이거나 다른 문자열: 하이픈을 점으로만 변환
        return trimmed.replace(/-/g, '.');
    }

    return String(val);
};

export const getTodayFormatted = () => {
    const now = new Date();
    return `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`;
};
