import React, { useRef, useState } from 'react';
import { X, Upload, Type, Image, Check, ChevronLeft, Download, Sparkles } from 'lucide-react';
import useCompanyIntroStore from '../../store/companyIntroStore';

// ────────────────────────────────────────────────────────────
// Stitch AI 생성 템플릿 썸네일 (3종)
// ────────────────────────────────────────────────────────────
const TEMPLATE_THUMBS = {
  1: 'https://lh3.googleusercontent.com/aida/ADBb0ujpMWeZxrz9UlY1oNtunU6PdCXlnrpDWrGKYY3EmG3bX28hJhUogE6J5x7y5dHQZA9eanIasF-o2Ax4-aSx_cuKHBJqylju1xGs4Ckrwx87XhV2AInPTohehlAkveengePDlawc4_7RHVBVhKNxX04RgSU8twZwdHq0xsn5L1ZTedamZ3WIHuSwhKbjlf97VMHInCAWZKZeJp47FOR4XtHiZmH3s5xvC8ER9LNYHCtDggEviBS_6iSSX0lK',
  2: 'https://lh3.googleusercontent.com/aida/ADBb0uhGTLaSZjFYyCanXDVKsArOW42Haxzl1eLhJcslVSyKBhE1X8Jw4VNiEg5cKFUrhPVe8vvGbfHnIB55JT0611axx_epagEwgUGtGHrhOObGORyQd9OA6x7JSNk2HGZhWbo-uRhjJg2qMYeLiEzHSZhQQNu6fFsbt0nwS2UOQgJE5ShsHeYTYZyAPBTUltD_720iotvheHEQ-5WYkHtj7WZSxuh-0TeMX0yj3BmpLNekkseUIAclyJIEonRG',
  3: 'https://lh3.googleusercontent.com/aida/ADBb0ug6jmPx5GzSZvgxztUsliz9vN7-xCLiyZd1uEMRB_0xeYn9vTI5KafrRaDZiLFugHX_-D_MFMLT91n5fFNKxM2FdYwfySu0hMXgZVHwAmoQ4KACrGpYC36eUbNa11RH2UHGmUcvqGblFjXmsVe9gyb0qPVD12ECH86kca47b7QxbD6SziPZPvco-GtaNr-DG5jVM4V07JS5gSJ3PEW5j2m8vHK-QgzSwckGAsnhfiWoHlWvQwxlnnlgK7E',
};

const TEMPLATES = [
  { id: 1, name: 'High-tech Vision', desc: '퍼플 그라데이션 타이포 + 볼드 레이아웃', tag: '미래지향' },
  { id: 2, name: 'Gallery Showcase', desc: '포트폴리오 이미지 중심 미니멀 갤러리', tag: '비주얼' },
  { id: 3, name: 'Trust Timeline', desc: '납품 프로세스 5단계 타임라인', tag: '신뢰감' },
];

// ────────────────────────────────────────────────────────────
// 편집 가능 영역 정의 (템플릿별)
// ────────────────────────────────────────────────────────────
const EDITOR_FIELDS = {
  1: [
    { id: 'logo',     type: 'text',  label: '회사명',        placeholder: 'IRU',                              x:'4%',  y:'6%',  w:'18%', h:'8%' },
    { id: 'headline', type: 'text',  label: '메인 헤드라인', placeholder: 'PRECISION MANUFACTURING TECHNOLOGY', x:'4%',  y:'20%', w:'50%', h:'14%' },
    { id: 'sub',      type: 'text',  label: '서브 헤드라인', placeholder: '자동차 시트 & 조향 부품 전문 기업',  x:'4%',  y:'38%', w:'48%', h:'7%' },
    { id: 'hero_img', type: 'image', label: '메인 제품 사진', placeholder: '제품 사진',                        x:'54%', y:'6%',  w:'42%', h:'72%' },
    { id: 'stat1',    type: 'text',  label: '실적 1',        placeholder: '창업 XX년',                        x:'4%',  y:'82%', w:'28%', h:'12%' },
    { id: 'stat2',    type: 'text',  label: '실적 2',        placeholder: '납품처 XX사',                      x:'36%', y:'82%', w:'28%', h:'12%' },
    { id: 'stat3',    type: 'text',  label: '실적 3',        placeholder: '프로젝트 XXX건+',                  x:'68%', y:'82%', w:'28%', h:'12%' },
  ],
  2: [
    { id: 'brand',   type: 'text',  label: '브랜드명',          placeholder: 'IRU',                  x:'3%',  y:'3%',  w:'10%', h:'6%' },
    { id: 'hero',    type: 'image', label: '대표 이미지 (대형)', placeholder: '대표 포트폴리오',      x:'3%',  y:'12%', w:'56%', h:'72%' },
    { id: 'img2',    type: 'image', label: '이미지 2',           placeholder: '프로젝트 사진 2',     x:'62%', y:'12%', w:'35%', h:'34%' },
    { id: 'img3',    type: 'image', label: '이미지 3',           placeholder: '프로젝트 사진 3',     x:'62%', y:'50%', w:'35%', h:'34%' },
    { id: 'caption', type: 'text',  label: '프로젝트 캡션',      placeholder: '2026 주요 납품 포트폴리오', x:'3%', y:'88%', w:'60%', h:'8%' },
  ],
  3: [
    { id: 'title',  type: 'text', label: '페이지 제목',      placeholder: '고객 니즈부터 최종 조립까지 — IRU', x:'4%',  y:'5%',  w:'70%', h:'8%' },
    { id: 'step1',  type: 'text', label: 'Step 1',           placeholder: '고객 요구사항 분석',               x:'3%',  y:'20%', w:'16%', h:'46%' },
    { id: 'step2',  type: 'text', label: 'Step 2',           placeholder: '설계 & 도면 검토',                 x:'22%', y:'20%', w:'16%', h:'46%' },
    { id: 'step3',  type: 'text', label: 'Step 3 (활성)',    placeholder: '시제품 제작',                      x:'41%', y:'18%', w:'18%', h:'50%' },
    { id: 'step4',  type: 'text', label: 'Step 4',           placeholder: '품질 검수',                        x:'62%', y:'20%', w:'16%', h:'46%' },
    { id: 'step5',  type: 'text', label: 'Step 5',           placeholder: '납품 & 최종 조립',                 x:'81%', y:'20%', w:'16%', h:'46%' },
    { id: 'badge1', type: 'text', label: '신뢰 배지 1',      placeholder: 'ISO 인증',                         x:'4%',  y:'74%', w:'28%', h:'14%' },
    { id: 'badge2', type: 'text', label: '신뢰 배지 2',      placeholder: '납품 실적 XXX건+',                 x:'36%', y:'74%', w:'28%', h:'14%' },
    { id: 'badge3', type: 'text', label: '신뢰 배지 3',      placeholder: '불량률 0.X%',                      x:'68%', y:'74%', w:'28%', h:'14%' },
  ],
};

// ────────────────────────────────────────────────────────────
// 편집 모달
// ────────────────────────────────────────────────────────────
const EditModal = () => {
  const { isEditModalOpen, editTarget, fieldValues, closeEditModal, saveFieldValue } = useCompanyIntroStore();
  const [textVal, setTextVal] = useState('');
  const [imgPreview, setImgPreview] = useState(null);
  const fileRef = useRef();

  // 모달 열릴 때 기존 값 초기화
  const currentVal = editTarget ? (fieldValues[editTarget.id] || '') : '';

  const handleOpen = () => {
    if (editTarget?.type === 'text') setTextVal(currentVal);
    if (editTarget?.type === 'image') setImgPreview(currentVal || null);
  };

  // 파일 선택
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImgPreview(url);
  };

  const handleSave = () => {
    const val = editTarget?.type === 'image' ? (imgPreview || '') : textVal;
    saveFieldValue(editTarget.id, val);
  };

  if (!isEditModalOpen || !editTarget) return null;

  const isImage = editTarget.type === 'image';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(10,10,30,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={closeEditModal}
    >
      <div
        onClick={e => e.stopPropagation()}
        onAnimationEnd={handleOpen}
        style={{
          background: '#fff', borderRadius: '18px',
          padding: '2rem', width: '500px', maxWidth: '95vw',
          boxShadow: '0 24px 80px rgba(99,102,241,0.18), 0 4px 16px rgba(0,0,0,0.08)',
          animation: 'slideUp 0.18s ease',
        }}
      >
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.4rem' }}>
          <div>
            <div style={{
              fontSize: '0.68rem', fontWeight: '800', color: '#6366f1',
              letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '0.25rem',
            }}>
              {isImage ? '🖼️ 이미지 편집' : '✏️ 텍스트 편집'}
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#1a1c1c' }}>
              {editTarget.label}
            </div>
          </div>
          <button
            onClick={closeEditModal}
            style={{
              background: '#f3f4f5', border: 'none', borderRadius: '8px',
              padding: '0.45rem', cursor: 'pointer', display: 'flex',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#e8e8e8'}
            onMouseLeave={e => e.currentTarget.style.background = '#f3f4f5'}
          >
            <X size={18} color="#464554" />
          </button>
        </div>

        {/* 본문 */}
        {isImage ? (
          <div>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                width: '100%', aspectRatio: '16/9',
                background: '#f8f8ff', borderRadius: '12px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                border: '2px dashed rgba(99,102,241,0.35)',
                overflow: 'hidden', marginBottom: '1rem',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.7)'; e.currentTarget.style.background = '#f0f1ff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'; e.currentTarget.style.background = '#f8f8ff'; }}
            >
              {imgPreview ? (
                <img src={imgPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <>
                  <Upload size={30} color="#6366f1" style={{ marginBottom: '0.6rem' }} />
                  <span style={{ fontSize: '0.85rem', color: '#464554', fontWeight: '600' }}>클릭하여 이미지 업로드</span>
                  <span style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.25rem' }}>PNG · JPG · WEBP (최대 20MB)</span>
                </>
              )}
            </div>
            {imgPreview && (
              <button
                onClick={() => { setImgPreview(null); }}
                style={{
                  display: 'block', width: '100%', padding: '0.45rem',
                  background: 'none', border: '1px solid #e8e8e8', borderRadius: '8px',
                  color: '#9ca3af', fontSize: '0.75rem', cursor: 'pointer',
                  marginBottom: '0.8rem',
                }}
              >
                🗑️ 이미지 제거
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
          </div>
        ) : (
          <textarea
            defaultValue={currentVal}
            onChange={e => setTextVal(e.target.value)}
            style={{
              width: '100%', minHeight: '110px', padding: '0.85rem',
              border: '1.5px solid rgba(99,102,241,0.22)', borderRadius: '10px',
              fontSize: '0.92rem', color: '#1a1c1c', resize: 'vertical',
              fontFamily: 'inherit', outline: 'none', background: '#fafafa',
              boxSizing: 'border-box', lineHeight: 1.6,
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
            onBlur={e => e.target.style.borderColor = 'rgba(99,102,241,0.22)'}
            placeholder={editTarget.placeholder}
            autoFocus
          />
        )}

        {/* 버튼 */}
        <div style={{ display: 'flex', gap: '0.7rem', justifyContent: 'flex-end', marginTop: '1.2rem' }}>
          <button
            onClick={closeEditModal}
            style={{
              padding: '0.6rem 1.3rem', borderRadius: '9px',
              border: '1.5px solid #e2e2e2', background: '#fff',
              color: '#464554', cursor: 'pointer', fontSize: '0.85rem',
              fontWeight: '600', transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f3f4f5'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '0.6rem 1.5rem', borderRadius: '9px', border: 'none',
              background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
              color: '#fff', cursor: 'pointer', fontSize: '0.85rem',
              fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem',
              boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.35)'; }}
          >
            <Check size={15} /> {isImage ? '적용' : '저장'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// A4 가로 템플릿 에디터 (편집 오버레이 포함)
// ────────────────────────────────────────────────────────────
const TemplateEditor = ({ templateId }) => {
  const { fieldValues, openEditModal } = useCompanyIntroStore();
  const fields = EDITOR_FIELDS[templateId] || [];

  return (
    <div style={{
      width: '100%',
      aspectRatio: '297 / 210',
      position: 'relative',
      background: '#fff',
      borderRadius: '10px',
      overflow: 'hidden',
      boxShadow: '0 8px 40px rgba(99,102,241,0.14)',
    }}>
      {/* Stitch 생성 배경 썸네일 */}
      <img
        src={TEMPLATE_THUMBS[templateId]}
        alt={`template-${templateId}`}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        draggable={false}
      />

      {/* 편집 가능 영역 오버레이 */}
      {fields.map(field => {
        const val = fieldValues[field.id];
        const hasVal = !!val;

        return (
          <div
            key={field.id}
            onClick={(e) => { e.stopPropagation(); openEditModal(field); }}
            title={`${field.label} 클릭하여 편집`}
            style={{
              position: 'absolute',
              left: field.x, top: field.y,
              width: field.w, height: field.h,
              cursor: 'pointer',
              border: hasVal ? '2px solid rgba(99,102,241,0.75)' : '2px dashed rgba(99,102,241,0.4)',
              borderRadius: '4px',
              background: hasVal
                ? (field.type === 'image' ? 'transparent' : 'rgba(99,102,241,0.08)')
                : 'rgba(99,102,241,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(99,102,241,0.18)';
              e.currentTarget.style.border = '2px solid #6366f1';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = hasVal
                ? (field.type === 'image' ? 'transparent' : 'rgba(99,102,241,0.08)')
                : 'rgba(99,102,241,0.05)';
              e.currentTarget.style.border = hasVal ? '2px solid rgba(99,102,241,0.75)' : '2px dashed rgba(99,102,241,0.4)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {hasVal && field.type === 'image' ? (
              <img src={val} alt={field.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : hasVal ? (
              <span style={{
                fontSize: '0.62rem', color: '#1a1c1c', fontWeight: '700',
                padding: '2px 5px', textAlign: 'center',
                wordBreak: 'break-word', lineHeight: 1.35, maxWidth: '90%',
              }}>{val}</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', opacity: 0.7 }}>
                {field.type === 'image'
                  ? <Image size={13} color="#6366f1" />
                  : <Type size={11} color="#6366f1" />}
                <span style={{ fontSize: '0.52rem', color: '#6366f1', fontWeight: '800', whiteSpace: 'nowrap' }}>
                  {field.label}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// 템플릿 선택 카드
// ────────────────────────────────────────────────────────────
const TemplateCard = ({ tpl }) => {
  const { selectedTemplate, changeTemplate } = useCompanyIntroStore();
  const isSelected = selectedTemplate === tpl.id;

  return (
    <div
      onClick={() => changeTemplate(tpl.id)}
      style={{
        borderRadius: '14px',
        border: isSelected ? '2.5px solid #6366f1' : '2px solid transparent',
        background: isSelected ? 'rgba(99,102,241,0.04)' : '#fff',
        boxShadow: isSelected
          ? '0 0 0 4px rgba(99,102,241,0.14), 0 8px 32px rgba(99,102,241,0.16)'
          : '0 2px 12px rgba(0,0,0,0.06)',
        cursor: 'pointer', overflow: 'hidden',
        transition: 'all 0.2s',
        transform: isSelected ? 'translateY(-1px)' : 'translateY(0)',
      }}
      onMouseEnter={e => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(99,102,241,0.18)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.border = '2px solid rgba(99,102,241,0.3)';
        }
      }}
      onMouseLeave={e => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.border = '2px solid transparent';
        }
      }}
    >
      {/* 썸네일 */}
      <div style={{ width: '100%', aspectRatio: '297/210', background: '#f3f4f5', overflow: 'hidden', position: 'relative' }}>
        <img src={TEMPLATE_THUMBS[tpl.id]} alt={tpl.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {isSelected && (
          <div style={{
            position: 'absolute', top: '0.5rem', right: '0.5rem',
            background: '#6366f1', borderRadius: '50%', width: '24px', height: '24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(99,102,241,0.5)',
          }}>
            <Check size={13} color="#fff" />
          </div>
        )}
      </div>
      {/* 정보 */}
      <div style={{ padding: '0.7rem 0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1a1c1c', marginBottom: '0.15rem' }}>
            {tpl.name}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#767586' }}>{tpl.desc}</div>
        </div>
        <span style={{
          flexShrink: 0, fontSize: '0.6rem', fontWeight: '700',
          padding: '0.2rem 0.55rem', borderRadius: '20px',
          background: isSelected ? 'rgba(99,102,241,0.15)' : '#f3f3f4',
          color: isSelected ? '#6366f1' : '#767586',
          transition: 'all 0.2s',
        }}>{tpl.tag}</span>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// 메인 컴포넌트
// ────────────────────────────────────────────────────────────
const CompanyIntroPage = () => {
  const { selectedTemplate, changeTemplate, fieldValues } = useCompanyIntroStore();
  const pdfRef = useRef();

  return (
    <div style={{
      display: 'flex', height: '100%', minHeight: 'calc(100vh - 60px)',
      background: '#f3f4f5', fontFamily: "'Inter', 'Manrope', sans-serif",
    }}>
      {/* ── LEFT PANEL 40% ───────────────────────────────── */}
      <div style={{
        width: '40%', flexShrink: 0, background: '#fff',
        borderRight: '1px solid #e8e8e8',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* 헤더 */}
        <div style={{ padding: '1.4rem 1.6rem 1rem', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.3rem' }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={15} color="#fff" />
            </div>
            <span style={{ fontSize: '1rem', fontWeight: '800', color: '#1a1c1c' }}>회사소개서 리뉴얼</span>
          </div>
          <p style={{ fontSize: '0.74rem', color: '#767586', margin: 0, lineHeight: 1.5 }}>
            기존 소개서를 참고하여 우측 템플릿을 선택 후 각 영역을 클릭해 편집하세요.
          </p>
        </div>

        {/* 스크롤 영역 */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1.2rem 1.6rem' }}>
          {/* 기존 회사 정보 */}
          <div style={{ fontSize: '0.68rem', fontWeight: '800', color: '#6366f1', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.8rem' }}>
            기존 회사 정보
          </div>
          {[
            { label: '회사명',    value: '(주)이루' },
            { label: '설립',      value: '2014년' },
            { label: '사업 분야', value: '자동차 시트 & 조향 부품 제작' },
            { label: '주요 납품처', value: '현대자동차, GM, 현대모비스 등' },
            { label: '소재지',    value: '경기도 화성시' },
            { label: '슬로건',    value: "LET'S MAKE IT HAPPEN" },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', gap: '0.8rem', padding: '0.65rem 0', borderBottom: '1px solid #f3f4f5' }}>
              <span style={{ width: '80px', flexShrink: 0, fontSize: '0.7rem', color: '#767586', fontWeight: '600' }}>{item.label}</span>
              <span style={{ fontSize: '0.77rem', color: '#1a1c1c', fontWeight: '500' }}>{item.value}</span>
            </div>
          ))}

          {/* 기존 소개서 PDF 업로드 */}
          <div style={{ marginTop: '1.4rem', marginBottom: '1.4rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: '800', color: '#6366f1', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.8rem' }}>
              기존 소개서 (PDF)
            </div>
            <div
              onClick={() => pdfRef.current?.click()}
              style={{
                width: '100%', aspectRatio: '297/210',
                background: 'linear-gradient(135deg, #f8f8ff, #f0f1ff)',
                borderRadius: '10px', border: '1.5px dashed rgba(99,102,241,0.3)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', gap: '0.4rem', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #f0f1ff, #e8eaff)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.55)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #f8f8ff, #f0f1ff)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; }}
            >
              <Upload size={22} color="#6366f1" />
              <span style={{ fontSize: '0.78rem', color: '#6366f1', fontWeight: '700' }}>기존 소개서 PDF 업로드</span>
              <span style={{ fontSize: '0.64rem', color: '#9ca3af' }}>클릭하여 파일 선택</span>
            </div>
            <input ref={pdfRef} type="file" accept=".pdf" style={{ display: 'none' }} />
          </div>

          {/* 강조 키워드 */}
          <div style={{ fontSize: '0.68rem', fontWeight: '800', color: '#6366f1', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.7rem' }}>
            강조 키워드
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {['시제품 제작', '정밀 가공', 'A/S 보증', 'ISO 인증', '자동차 부품', '커스텀 제작', '납기 준수'].map(tag => (
              <span key={tag} style={{
                fontSize: '0.68rem', fontWeight: '600', padding: '0.25rem 0.6rem',
                borderRadius: '20px', background: 'rgba(99,102,241,0.08)',
                color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)',
              }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL 60% ──────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* 패널 헤더 */}
        <div style={{
          padding: '1.1rem 1.6rem', background: '#fff',
          borderBottom: '1px solid #e8e8e8',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {selectedTemplate && (
              <button
                onClick={() => changeTemplate(null)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                  color: '#767586', fontSize: '0.78rem', fontWeight: '600', padding: '0.2rem 0',
                }}
              >
                <ChevronLeft size={16} /> 목록으로
              </button>
            )}
            <span style={{ fontSize: '0.92rem', fontWeight: '800', color: '#1a1c1c' }}>
              {selectedTemplate
                ? `✏️ ${TEMPLATES.find(t => t.id === selectedTemplate)?.name} 편집 중`
                : '✨ 템플릿 선택'}
            </span>
            {!selectedTemplate && (
              <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>A4 가로 규격 (297 : 210)</span>
            )}
          </div>
          {selectedTemplate && (
            <button style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 1.1rem', borderRadius: '9px', border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700',
              boxShadow: '0 3px 12px rgba(99,102,241,0.35)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 5px 18px rgba(99,102,241,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 3px 12px rgba(99,102,241,0.35)'; }}
            >
              <Download size={14} /> 다운로드
            </button>
          )}
        </div>

        {/* 패널 콘텐츠 */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1.4rem 1.6rem' }}>
          {!selectedTemplate ? (
            /* ── 템플릿 선택 그리드 ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.74rem', color: '#767586', margin: '0 0 0.2rem' }}>
                Stitch AI로 생성된 3가지 템플릿 중 하나를 클릭하여 선택하세요.
              </p>
              {TEMPLATES.map(tpl => <TemplateCard key={tpl.id} tpl={tpl} />)}
            </div>
          ) : (
            /* ── 에디터 모드 ── */
            <div>
              <p style={{ fontSize: '0.73rem', color: '#767586', marginBottom: '1rem', lineHeight: 1.6 }}>
                각 <strong style={{ color: '#6366f1' }}>점선 영역을 클릭</strong>하면 텍스트 또는 이미지를 편집할 수 있습니다.
              </p>
              <TemplateEditor templateId={selectedTemplate} />

              {/* 편집 완료 현황 배지 */}
              <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {(EDITOR_FIELDS[selectedTemplate] || []).map(f => {
                  const done = !!fieldValues[f.id];
                  return (
                    <span key={f.id} style={{
                      fontSize: '0.64rem', fontWeight: '600',
                      padding: '0.2rem 0.55rem', borderRadius: '20px',
                      background: done ? 'rgba(16,185,129,0.1)' : '#f3f4f5',
                      color: done ? '#10b981' : '#9ca3af',
                      border: `1px solid ${done ? 'rgba(16,185,129,0.3)' : '#e8e8e8'}`,
                      display: 'flex', alignItems: 'center', gap: '0.25rem',
                    }}>
                      {done && <Check size={9} />}{f.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 편집 모달 (전역 상태 구독) ── */}
      <EditModal />
    </div>
  );
};

export default CompanyIntroPage;
