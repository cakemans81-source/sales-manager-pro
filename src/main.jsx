import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Microsoft 로그인 팝업이 인증 응답(#code=… / #error=…)을 들고 돌아온 창이면
// 앱을 그리지 않고(HashRouter가 해시를 덮어쓰지 않도록) 응답만 원래 창으로 넘긴다.
const authResponse = `${window.location.hash}&${window.location.search}`;
const isMsAuthPopup = /[#&?](code|error)=/.test(authResponse) && /[#&?]state=/.test(authResponse);

if (isMsAuthPopup) {
    import('@azure/msal-browser/redirect-bridge')
        .then(({ broadcastResponseToMainFrame }) => broadcastResponseToMainFrame())
        .catch((err) => { console.error('Microsoft 로그인 응답 처리 실패:', err); });
} else {
    ReactDOM.createRoot(document.getElementById('root')).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    )
}
