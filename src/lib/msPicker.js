/**
 * Microsoft OneDrive/SharePoint 파일 선택 창(File Picker v8) 연동
 * - 직원 본인의 M365 계정으로 로그인(위임 권한, 읽기 전용)하고, 선택한 파일을 내려받아 File 객체로 돌려준다.
 * - 저장은 호출하는 쪽(기존 Supabase 업로드 함수)이 담당한다.
 * - Entra 앱: 'IRU Sales Manager - OneDrive 연동' (클라이언트·테넌트 ID는 공개 식별자)
 * 참고: https://learn.microsoft.com/onedrive/developer/controls/file-pickers/
 */
const MS_CLIENT_ID = import.meta.env.VITE_MS_CLIENT_ID || '028f8735-e01f-4213-b1f8-7692489fcc6e';
const MS_TENANT_ID = import.meta.env.VITE_MS_TENANT_ID || '9fda1dca-2e3c-420e-9a3c-7f9e2a645de8';

const SP_ORIGIN = 'https://iru11.sharepoint.com';
const SP_WEB = `${SP_ORIGIN}/sites/sales_team`;
// 선택 창이 처음 열릴 위치: 영업팀 문서함 > 1. 견적자료 (없으면 문서함 루트)
const ENTRY = { web: SP_WEB, list: 'Shared Documents', folder: '1. 견적자료', fallbackToRoot: true };

export class MsLoginRequiredError extends Error {
    constructor(message = 'Microsoft 로그인이 필요합니다.') {
        super(message);
        this.code = 'MS_LOGIN_REQUIRED';
    }
}

let msalPromise = null;
let msalApp = null; // preloadMs() 완료 후 설정 — 클릭 핸들러가 기다림 없이 팝업을 열 때 사용
let forceInteractiveLogin = false;

const getMsal = () => {
    if (!msalPromise) {
        msalPromise = (async () => {
            const { PublicClientApplication } = await import('@azure/msal-browser');
            const app = new PublicClientApplication({
                auth: {
                    clientId: MS_CLIENT_ID,
                    authority: `https://login.microsoftonline.com/${MS_TENANT_ID}`,
                    redirectUri: window.location.origin,
                },
                cache: { cacheLocation: 'localStorage' },
            });
            await app.initialize();
            const account = app.getActiveAccount() || app.getAllAccounts()[0];
            if (account) app.setActiveAccount(account);
            return app;
        })();
    }
    return msalPromise;
};

const currentAccount = (app) => app.getActiveAccount() || app.getAllAccounts()[0] || null;

/**
 * 모달이 열릴 때 미리 호출해 MSAL을 불러오고 초기화해 둔다.
 * 일부 브라우저(내장 브라우저 등)는 클릭 순간 동기적으로 연 팝업만 허용하므로,
 * 클릭 뒤에 라이브러리를 불러오며 기다리면 팝업이 차단된다.
 */
export const preloadMs = () => getMsal().then((app) => { msalApp = app; return app; });

/** 초기화가 끝나 클릭 즉시 팝업을 열 수 있는지 */
export const isMsReady = () => Boolean(msalApp);

/** 캐시된 Microsoft 계정이 있어 바로 선택 창을 열 수 있는지 (동기) */
export const isMsSignedIn = () => Boolean(msalApp && !forceInteractiveLogin && currentAccount(msalApp));

/** 클릭 핸들러에서 기다림 없이 바로 호출해야 한다 (loginPopup이 즉시 창을 연다). */
export const msLogin = () => {
    if (!msalApp) return Promise.reject(new Error('OneDrive 연결을 준비 중입니다. 잠시 후 다시 눌러주세요.'));
    return msalApp.loginPopup({ scopes: [`${SP_ORIGIN}/.default`], prompt: 'select_account' }).then((result) => {
        msalApp.setActiveAccount(result.account);
        forceInteractiveLogin = false;
        return result.account;
    });
};

const scopesFor = (resource, type) => {
    if (type === 'Graph' || String(resource || '').includes('graph.microsoft.com')) {
        return ['https://graph.microsoft.com/.default'];
    }
    return [`${new URL(resource || SP_ORIGIN).origin}/.default`];
};

const getToken = async (app, resource, type) => {
    const account = currentAccount(app);
    if (!account) throw new MsLoginRequiredError();
    try {
        const res = await app.acquireTokenSilent({ scopes: scopesFor(resource, type), account });
        return res.accessToken;
    } catch (err) {
        // 새로고침 토큰 만료 등으로 조용한 발급이 안 되면 다음 클릭에서 로그인 창을 띄운다
        forceInteractiveLogin = true;
        throw new MsLoginRequiredError(`Microsoft 로그인이 다시 필요합니다. (${err.errorCode || err.message})`);
    }
};

const MIME_BY_EXT = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' };
const mimeFor = (name, fallback) => {
    const ext = String(name).split('.').pop().toLowerCase();
    return MIME_BY_EXT[ext] || fallback || 'application/octet-stream';
};

// 선택한 항목을 내려받아 File 객체로 변환
const downloadItems = async (app, items) => {
    const files = [];
    for (const item of items || []) {
        let name = item.name;
        let url = item['@microsoft.graph.downloadUrl'] || item['@content.downloadUrl'];
        let mime = item.file?.mimeType;
        if (!url || !name) {
            const endpoint = item['@sharePoint.endpoint'];
            const token = await getToken(app, endpoint, 'SharePoint');
            const res = await fetch(`${endpoint}/drives/${item.parentReference.driveId}/items/${item.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`파일 정보를 가져오지 못했습니다 (${res.status})`);
            const meta = await res.json();
            name = meta.name;
            url = meta['@content.downloadUrl'] || meta['@microsoft.graph.downloadUrl'];
            mime = meta.file?.mimeType;
        }
        const res = await fetch(url);
        if (!res.ok) throw new Error(`'${name}' 내려받기 실패 (${res.status})`);
        const blob = await res.blob();
        files.push(new File([blob], name, { type: mimeFor(name, mime || blob.type) }));
    }
    return files;
};

/**
 * 파일 선택 창을 열고, 선택한 파일들을 File[]로 돌려준다 (취소 시 빈 배열).
 * 클릭 핸들러에서 기다림 없이 바로 호출해야 한다 (창을 먼저 동기적으로 연다).
 * @param {{ filters?: string[], multiple?: boolean, title?: string }} opts
 */
export const pickFromOneDrive = (opts = {}) => {
    if (!isMsSignedIn()) return Promise.reject(new MsLoginRequiredError());
    const win = window.open('', 'smpOneDrivePicker', 'width=1080,height=680');
    if (!win) return Promise.reject(new Error('팝업이 차단되었습니다. 브라우저 주소창의 팝업 차단을 해제해 주세요.'));
    return runPicker(msalApp, win, opts);
};

const runPicker = async (app, win, { filters, multiple = false, title } = {}) => {
    win.document.title = 'OneDrive';
    win.document.body.innerHTML = '<p style="font-family:sans-serif;padding:24px;color:#334155">OneDrive 불러오는 중…</p>';

    let spToken;
    try {
        spToken = await getToken(app, SP_WEB, 'SharePoint');
    } catch (err) {
        win.close();
        throw err;
    }

    const channelId = (crypto.randomUUID && crypto.randomUUID()) || `smp-${Date.now()}`;
    const options = {
        sdk: '8.0',
        entry: { sharePoint: { byPath: ENTRY } },
        authentication: {},
        messaging: { origin: window.location.origin, channelId },
        typesAndSources: { mode: 'files', ...(filters?.length ? { filters } : {}) },
        selection: { mode: multiple ? 'multiple' : 'single' },
        commands: { pick: { select: { urls: { download: true } } } },
        ...(title ? { title } : {}),
    };

    return new Promise((resolve, reject) => {
        let port = null;
        let settled = false;
        let downloading = false;

        const cleanup = () => {
            window.removeEventListener('message', onInitialize);
            clearInterval(closedWatcher);
        };
        const settle = (fn, value) => {
            if (settled) return;
            settled = true;
            cleanup();
            fn(value);
        };

        const reply = (id, data) => port && port.postMessage({ type: 'result', id, data });

        const onPortMessage = async (event) => {
            const payload = event.data;
            if (payload?.type !== 'command') return;
            port.postMessage({ type: 'acknowledge', id: payload.id });
            const command = payload.data || {};

            switch (command.command) {
                case 'authenticate':
                    try {
                        const token = await getToken(app, command.resource, command.type);
                        reply(payload.id, { result: 'token', token });
                    } catch (err) {
                        reply(payload.id, { result: 'error', error: { code: 'unableToObtainToken', message: err.message } });
                    }
                    break;
                case 'close':
                    win.close();
                    settle(resolve, []);
                    break;
                case 'pick':
                    downloading = true;
                    reply(payload.id, { result: 'success' });
                    win.close();
                    try {
                        settle(resolve, await downloadItems(app, command.items));
                    } catch (err) {
                        settle(reject, err);
                    }
                    break;
                default:
                    reply(payload.id, { result: 'error', error: { code: 'unsupportedCommand', message: command.command } });
            }
        };

        const onInitialize = (event) => {
            if (event.source !== win) return;
            const message = event.data;
            if (message?.type === 'initialize' && message.channelId === channelId) {
                port = event.ports[0];
                port.addEventListener('message', onPortMessage);
                port.start();
                port.postMessage({ type: 'activate' });
            }
        };
        window.addEventListener('message', onInitialize);

        // 사용자가 창을 X로 닫은 경우 = 취소
        const closedWatcher = setInterval(() => {
            if (win.closed && !downloading) settle(resolve, []);
        }, 700);

        const query = new URLSearchParams({ filePicker: JSON.stringify(options), locale: 'ko-kr' });
        const form = win.document.createElement('form');
        form.setAttribute('action', `${SP_WEB}/_layouts/15/FilePicker.aspx?${query}`);
        form.setAttribute('method', 'POST');
        const tokenInput = win.document.createElement('input');
        tokenInput.setAttribute('type', 'hidden');
        tokenInput.setAttribute('name', 'access_token');
        tokenInput.setAttribute('value', spToken);
        form.appendChild(tokenInput);
        win.document.body.append(form);
        form.submit();
    });
};
