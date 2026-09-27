// 회사 공용 SharePoint(OneDrive) 견적자료 폴더
// 배포 환경에서 바꾸려면 VITE_ONEDRIVE_FOLDER_URL 환경변수를 설정한다.
export const ONEDRIVE_FOLDER_URL = import.meta.env.VITE_ONEDRIVE_FOLDER_URL
    || 'https://iru11-my.sharepoint.com/shared?id=%2Fsites%2Fsales%5Fteam%2FShared%20Documents%2F1%2E%20%EA%B2%AC%EC%A0%81%EC%9E%90%EB%A3%8C&listurl=https%3A%2F%2Firu11%2Esharepoint%2Ecom%2Fsites%2Fsales%5Fteam%2FShared%20Documents&viewid=d214f89c%2D2df3%2D46c2%2Da685%2D7a06930eada5';

// 윈도우 탐색기에서 보이는 동기화 폴더 경로 (안내 문구용)
export const ONEDRIVE_EXPLORER_HINT = 'iru11 › sales_team - Documents › 1. 견적자료';

export const openOneDriveFolder = () => {
    window.open(ONEDRIVE_FOLDER_URL, '_blank', 'noopener,noreferrer');
};
