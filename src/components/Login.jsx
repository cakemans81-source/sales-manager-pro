import React, { useState } from 'react';
import { LogIn, ShieldCheck, User, Lock, UserPlus, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { isActiveUser } from '../utils/userStatus';

const Login = ({ onLogin, onSignup, users }) => {
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      const foundUser = users.find(u => u.id === userId && u.password === password);

      if (foundUser) {
        if (foundUser.isApproved === true && isActiveUser(foundUser)) {
          onLogin(foundUser);
        } else {
          setError('승인되지 않았거나 비활성화된 계정입니다.');
        }
      } else {
        setError('아이디 또는 비밀번호가 일치하지 않습니다.');
      }
      setIsLoading(false);
    }, 600);
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      const result = onSignup({ id: userId, password, name });
      if (result.success) {
        setSuccessMessage(result.message);
        // 필드 초기화
        setUserId('');
        setPassword('');
        setName('');
      } else {
        setError(result.message);
      }
      setIsLoading(false);
    }, 600);
  };

  if (successMessage) {
    return (
      <div className="login-container">
        <div className="glass login-card animate-fade" style={{ textAlign: 'center' }}>
          <CheckCircle2 size={64} color="#10b981" style={{ margin: '0 auto 1.5rem' }} />
          <h2 style={{ marginBottom: '1rem' }}>신청 완료!</h2>
          <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>{successMessage}</p>
          <button className="btn btn-primary" onClick={() => { setSuccessMessage(''); setIsSignupMode(false); }}>
            로그인 화면으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="glass login-card animate-fade">
        <div className="login-header">
          <div className="logo-circles">
            <div className="circle circle-1"></div>
            <div className="circle circle-2"></div>
          </div>
          <h1 className="gradient-text">SalesManager Pro</h1>
          <p>{isSignupMode ? '새로운 계정 생성을 위한 정보를 입력하세요.' : '프리미엄 영업 관리 시스템에 접속하세요.'}</p>
        </div>

        {!isSignupMode ? (
          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <label><User size={14} style={{ marginRight: '4px' }} /> 아이디 (ID)</label>
              <input
                type="text"
                className="input-field"
                placeholder="아이디를 입력하세요"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label><Lock size={14} style={{ marginRight: '4px' }} /> 비밀번호</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="error-message">{error}</p>}

            <button type="submit" className="btn btn-primary login-btn" disabled={isLoading}>
              {isLoading ? '인증 중...' : (
                <>
                  <LogIn size={18} /> 로그인하기
                </>
              )}
            </button>

            <div className="signup-prompt">
              <span>계정이 없으신가요?</span>
              <button type="button" className="btn-text" onClick={() => setIsSignupMode(true)}>회원가입 신청</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignupSubmit} className="login-form">
            <div className="input-group">
              <label><User size={14} style={{ marginRight: '4px' }} /> 이름</label>
              <input
                type="text"
                className="input-field"
                placeholder="본명을 입력하세요"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label><User size={14} style={{ marginRight: '4px' }} /> 희망 아이디</label>
              <input
                type="text"
                className="input-field"
                placeholder="사용할 아이디 입력"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label><Lock size={14} style={{ marginRight: '4px' }} /> 비밀번호</label>
              <input
                type="password"
                className="input-field"
                placeholder="비밀번호 설정"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="error-message">{error}</p>}

            <button type="submit" className="btn btn-primary login-btn" disabled={isLoading}>
              {isLoading ? '계정 생성 중...' : (
                <>
                  <UserPlus size={18} /> 가입 신청하기
                </>
              )}
            </button>

            <button type="button" className="btn-back" onClick={() => setIsSignupMode(false)}>
              <ArrowLeft size={14} /> 이전으로 돌아가기
            </button>
          </form>
        )}

        <div className="login-footer">
          <ShieldCheck size={14} /> <span>인가된 사용자만 보안 접속이 허용됩니다.</span>
        </div>
      </div>

      <style>{`
        .login-container {
          height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at top right, #1e293b 0%, #0f172a 100%);
        }

        .login-card {
          width: 100%;
          max-width: 440px;
          padding: 3rem;
          border-radius: 28px;
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-header h1 {
          font-size: 2.2rem;
          margin-bottom: 0.5rem;
          font-weight: 800;
        }

        .login-header p {
          color: #94a3b8;
          font-size: 0.9rem;
        }

        .logo-circles {
          display: flex;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          filter: blur(10px);
          opacity: 0.5;
        }

        .circle-1 { background: #6366f1; transform: translateX(12px); }
        .circle-2 { background: #ec4899; transform: translateX(-12px); }

        .login-btn {
          width: 100%;
          justify-content: center;
          padding: 1.1rem;
          margin-top: 1rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .signup-prompt {
            margin-top: 1.5rem;
            text-align: center;
            font-size: 0.85rem;
            color: #94a3b8;
        }

        .btn-text {
            background: none;
            border: none;
            color: #818cf8;
            font-weight: 600;
            margin-left: 0.5rem;
            cursor: pointer;
            text-decoration: underline;
        }

        .btn-back {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            width: 100%;
            margin-top: 1rem;
            background: none;
            border: none;
            color: #64748b;
            font-size: 0.85rem;
            cursor: pointer;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          padding: 0.75rem;
          border-radius: 12px;
          font-size: 0.8rem;
          margin-bottom: 1.25rem;
          text-align: center;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .login-footer {
          margin-top: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: #475569;
          font-size: 0.75rem;
          border-top: 1px solid rgba(255,255,255,0.05);
          padding-top: 1.5rem;
        }
      `}</style>
    </div>
  );
};

export default Login;
