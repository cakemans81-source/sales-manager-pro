import React, { useState, useRef } from 'react';
import { X, Upload, Type, Image, Check, ChevronLeft, Download, Sparkles } from 'lucide-react';

// ── Stitch 생성 템플릿 썸네일 URL ──────────────────────────────
const TEMPLATE_THUMBS = {
  1: 'https://lh3.googleusercontent.com/aida/ADBb0ujpMWeZxrz9UlY1oNtunU6PdCXlnrpDWrGKYY3EmG3bX28hJhUogE6J5x7y5dHQZA9eanIasF-o2Ax4-aSx_cuKHBJqylju1xGs4Ckrwx87XhV2AInPTohehlAkveengePDlawc4_7RHVBVhKNxX04RgSU8twZwdHq0xsn5L1ZTedamZ3WIHuSwhKbjlf97VMHInCAWZKZeJp47FOR4XtHiZmH3s5xvC8ER9LNYHCtDggEviBS_6iSSX0lK',
  2: 'https://lh3.googleusercontent.com/aida/ADBb0uhGTLaSZjFYyCanXDVKsArOW42Haxzl1eLhJcslVSyKBhE1X8Jw4VNiEg5cKFUrhPVe8vvGbfHnIB55JT0611axx_epagEwgUGtGHrhOObGORyQd9OA6x7JSNk2HGZhWbo-uRhjJg2qMYeLiEzHSZhQQNu6fFsbt0nwS2UOQgJE5ShsHeYTYZyAPBTUltD_720iotvheHEQ-5WYkHtj7WZSxuh-0TeMX0yj3BmpLNekkseUIAclyJIEonRG',
  3: 'https://lh3.googleusercontent.com/aida/ADBb0ug6jmPx5GzSZvgxztUsliz9vN7-xCLiyZd1uEMRB_0xeYn9vTI5KafrRaDZiLFugHX_-D_MFMLT91n5fFNKxM2FdYwfySu0hMXgZVHwAmoQ4KACrGpYC36eUbNa11RH2UHGmUcvqGblFjXmsVe9gyb0qPVD12ECH86kca47b7QxbD6SziPZPvco-GtaNr-DG5jVM4V07JS5gSJ3PEW5j2m8vHK-QgzSwckGAsnhfiWoHlWvQwxlnnlgK7E',
};

const TEMPLATES = [
  {
    id: 1,
    name: 'High-tech Vision',
    desc: '퍼플 그라데이션 타이포 + 볼드 레이아웃',
    tag: '미래지향',
  },
  {
    id: 2,
    name: 'Gallery Showcase',
    desc: '포트폴리오 이미지 중심 미니멀 갤러리',
    tag: '비주얼',
  },
  {
    id: 3,
    name: 'Trust Timeline',
    desc: '납품 프로세스 5단계 타임라인',
    tag: '신뢰감',
  },
];

// ── 에디터 필드 정의 (템플릿별) ──────────────────────────────
const EDITOR_FIELDS = {
  1: [
    { id: 'logo', type: 'text', label: '회사명', placeholder: 'IRU', x: '4%', y: '6%', w: '18%', h: '8%' },
    { id: 'headline', type: 'text', label: '메인 헤드라인', placeholder: 'PRECISION MANUFACTURING TECHNOLOGY', x: '4%', y: '20%', w: '50%', h: '14%' },
    { id: 'sub', type: 'text', label: '서브 헤드라인', placeholder: '자동차 시트 & 조향 부품 전문 기업', x: '4%', y: '38%', w: '48%', h: '7%' },
    { id: 'hero_img', type: 'image', label: '메인 제품 사진', placeholder: '제품 사진', x: '54%', y: '6%', w: '42%', h: '72%' },
    { id: 'stat1', type: 'text', label: '실적 1', placeholder: '창업 XX년', x: '4%', y: '82%', w: '28%', h: '12%' },
    { id: 'stat2', type: 'text', label: '실적 2', placeholder: '납품처 XX사', x: '36%', y: '82%', w: '28%', h: '12%' },
    { id: 'stat3', type: 'text', label: '실적 3', placeholder: '프로젝트 XXX건+', x: '68%', y: '82%', w: '28%', h: '12%' },
  ],
  2: [
    { id: 'brand', type: 'text', label: '브랜드명', placeholder: 'IRU', x: '3%', y: '3%', w: '10%', h: '6%' },
    { id: 'hero', type: 'image', label: '대표 이미지 (대형)', placeholder: '대표 포트폴리오', x: '3%', y: '12%', w: '56%', h: '72%' },
    { id: 'img2', type: 'image', label: '이미지 2', placeholder: '프로젝트 사진 2', x: '62%', y: '12%', w: '35%', h: '34%' },
    { id: 'img3', type: 'image', label: '이미지 3', placeholder: '프로젝트 사진 3', x: '62%', y: '50%', w: '35%', h: '34%' },
    { id: 'caption', type: 'text', label: '프로젝트 캡션', placeholder: '2026 주요 납품 포트폴리오', x: '3%', y: '88%', w: '60%', h: '8%' },
  ],
  3: [
    { id: 'title', type: 'text', label: '페이지 제목', placeholder: '고객 니즈부터 최종 조립까지 — IRU', x: '4%', y: '5%', w: '70%', h: '8%' },
    { id: 'step1', type: 'text', label: 'Step 1 설명', placeholder: '고객 요구사항 분석', x: '3%', y: '20%', w: '16%', h: '46%' },
    { id: 'step2', type: 'text', label: 'Step 2 설명', placeholder: '설계 & 도면 검토', x: '22%', y: '20%', w: '16%', h: '46%' },
    { id: 'step3', type: 'text', label: 'Step 3 설명 (활성)', placeholder: '시제품 제작', x: '41%', y: '18%', w: '18%', h: '50%' },
    { id: 'step4', type: 'text', label: 'Step 4 설명', placeholder: '품질 검수', x: '62%', y: '20%', w: '16%', h: '46%' },
    { id: 'step5', type: 'text', label: 'Step 5 설명', placeholder: '납품 & 최종 조립', x: '81%', y: '20%', w: '16%', h: '46%' },
    { id: 'badge1', type: 'text', label: '신뢰 배지 1', placeholder: 'ISO 인증', x: '4%', y: '74%', w: '28%', h: '14%' },
    { id: 'badge2', type: 'text', label: '신뢰 배지 2', placeholder: '납품 실적 XXX건+', x: '36%', y: '74%', w: '28%', h: '14%' },
    { id: 'badge3', type: 'text', label: '신뢰 배지 3', placeholder: '불량률 0.X%', x: '68%', y: '74%', w: '28%', h: '14%' },
  ],
};

// ── 편집 모달 ───────────────────────────────────────────────
const EditModal = ({ field, value, onSave, onClose }) => {
  const [val, setVal] = useState(value || '');
  const [imgPreview, setImgPreview] = useState(value || null);
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImgPreview(url);
    setVal(url);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.45)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: '16px',
        padding: '2rem', width: '480px', maxWidth: '95vw',
        boxShadow: '0 24px 80px rgba(99,102,241,0.15)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#6366f1', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
              {field.type === 'image' ? '이미지 편집' : '텍스트 편집'}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#1a1c1c' }}>{field.label}</div>
          </div>
          <button onClick={onClose} style={{ background: '#f3f4f5', border: 'none', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer', display: 'flex' }}>
            <X size={18} color="#464554" />
          </button>
        </div>

        {field.type === 'image' ? (
          <div>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                width: '100%', aspectRatio: '16/9',
                background: '#f3f3f4', borderRadius: '10px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', border: '2px dashed rgba(99,102,241,0.3)',
                overflow: 'hidden', marginBottom: '1rem',
              }}
            >
              {imgPreview ? (
                <img src={imgPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <>
                  <Upload size={28} color="#6366f1" style={{ marginBottom: '0.5rem' }} />
                  <span style={{ fontSize: '0.82rem', color: '#464554' }}>클릭하여 이미지 업로드</span>
                  <span style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.2rem' }}>PNG, JPG, WEBP (최대 20MB)</span>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
          </div>
        ) : (
          <textarea
            value={val}
            onChange={e => setVal(e.target.value)}
            style={{
              width: '100%', minHeight: '100px', padding: '0.8rem',
              border: '1.5px solid rgba(99,102,241,0.25)', borderRadius: '8px',
              fontSize: '0.9rem', color: '#1a1c1c', resize: 'vertical',
              fontFamily: 'inherit', outline: 'none', background: '#fafafa',
              boxSizing: 'border-box',
            }}
            placeholder={field.placeholder}
            autoFocus
          />
        )}

        <div style={{ display: 'flex', gap: '0.7rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button onClick={onClose} style={{
            padding: '0.55rem 1.2rem', borderRadius: '8px',
            border: '1px solid #e2e2e2', background: '#fff',
            color: '#464554', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600',
          }}>취소</button>
          <button onClick={() => onSave(val)} style={{
            padding: '0.55rem 1.4rem', borderRadius: '8px', border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}>
            <Check size={15} /> 적용
          </button>
        </div>
      </div>
    </div>
  );
};

// ── A4 가로 템플릿 에디터 ────────────────────────────────────
const TemplateEditor = ({ templateId, fieldValues, onFieldClick }) => {
  const fields = EDITOR_FIELDS[templateId] || [];
  const thumb = TEMPLATE_THUMBS[templateId];

  return (
    <div style={{
      width: '100%',
      aspectRatio: '297 / 210',
      position: 'relative',
      background: '#fff',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 8px 40px rgba(99,102,241,0.12)',
    }}>
      {/* Stitch 생성 디자인 배경 */}
      <img
        src={thumb}
        alt={`template-${templateId}`}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        draggable={false}
      />
      {/* 편집 오버레이 영역들 */}
      {fields.map(field => {
        const val = fieldValues[field.id];
        const hasVal = val && val !== '';
        return (
          <div
            key={field.id}
            onClick={() => onFieldClick(field)}
            title={`클릭하여 편집: ${field.label}`}
            style={{
              position: 'absolute',
              left: field.x, top: field.y,
              width: field.w, height: field.h,
              cursor: 'pointer',
              border: hasVal ? '2px solid rgba(99,102,241,0.6)' : '2px dashed rgba(99,102,241,0.35)',
              borderRadius: '4px',
              background: hasVal
                ? field.type === 'image'
                  ? 'transparent'
                  : 'rgba(99,102,241,0.08)'
                : 'rgba(99,102,241,0.04)',
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.15)'; e.currentTarget.style.border = '2px solid rgba(99,102,241,0.8)'; }}
            onMouseLeave={e => {
              e.currentTarget.style.background = hasVal ? (field.type === 'image' ? 'transparent' : 'rgba(99,102,241,0.08)') : 'rgba(99,102,241,0.04)';
              e.currentTarget.style.border = hasVal ? '2px solid rgba(99,102,241,0.6)' : '2px dashed rgba(99,102,241,0.35)';
            }}
          >
            {hasVal && field.type === 'image' ? (
              <img src={val} alt={field.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : hasVal && field.type === 'text' ? (
              <span style={{ fontSize: '0.65rem', color: '#1a1c1c', fontWeight: '600', padding: '2px 4px', textAlign: 'center', wordBreak: 'break-word', lineHeight: 1.3 }}>{val}</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', opacity: 0.6 }}>
                {field.type === 'image' ? <Image size={14} color="#6366f1" /> : <Type size={12} color="#6366f1" />}
                <span style={{ fontSize: '0.55rem', color: '#6366f1', fontWeight: '700', whiteSpace: 'nowrap' }}>{field.label}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── 템플릿 선택 카드 ─────────────────────────────────────────
const TemplateCard = ({ tpl, isSelected, onClick }) => (
  <div
    onClick={onClick}
    style={{
      borderRadius: '12px',
      border: isSelected ? '2px solid #6366f1' : '2px solid transparent',
      background: isSelected ? 'rgba(99,102,241,0.04)' : '#fff',
      boxShadow: isSelected ? '0 0 0 3px rgba(99,102,241,0.15)' : '0 2px 12px rgba(0,0,0,0.06)',
      cursor: 'pointer', overflow: 'hidden',
      transition: 'all 0.2s',
    }}
    onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.18)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
    onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; } }}
  >
    {/* 썸네일 */}
    <div style={{ width: '100%', aspectRatio: '297/210', background: '#f3f4f5', overflow: 'hidden' }}>
      <img src={TEMPLATE_THUMBS[tpl.id]} alt={tpl.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
    {/* 정보 */}
    <div style={{ padding: '0.65rem 0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
      <div>
        <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#1a1c1c', marginBottom: '0.15rem' }}>{tpl.name}</div>
        <div style={{ fontSize: '0.65rem', color: '#767586' }}>{tpl.desc}</div>
      </div>
      <span style={{
        flexShrink: 0, fontSize: '0.6rem', fontWeight: '700',
        padding: '0.2rem 0.5rem', borderRadius: '20px',
        background: isSelected ? 'rgba(99,102,241,0.15)' : '#f3f3f4',
        color: isSelected ? '#6366f1' : '#767586',
      }}>{tpl.tag}</span>
    </div>
  </div>
);

// ── 메인 컴포넌트 ────────────────────────────────────────────
const CompanyIntroPage = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [fieldValues, setFieldValues] = useState({});
  const [editingField, setEditingField] = useState(null);

  const handleFieldClick = (field) => {
    setEditingField(field);
  };

  const handleSave = (val) => {
    setFieldValues(prev => ({ ...prev, [editingField.id]: val }));
    setEditingField(null);
  };

  return (
    <div style={{
      display: 'flex', height: '100%', minHeight: 'calc(100vh - 60px)',
      background: '#f3f4f5', fontFamily: "'Inter', 'Manrope', sans-serif",
    }}>
      {/* ── LEFT PANEL (40%) ─────────────────────────────── */}
      <div style={{
        width: '40%', flexShrink: 0,
        background: '#fff', borderRight: '1px solid #e8e8e8',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* 헤더 */}
        <div style={{
          padding: '1.4rem 1.6rem 1rem',
          borderBottom: '1px solid #f0f0f0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '7px',
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={14} color="#fff" />
            </div>
            <span style={{ fontSize: '1rem', fontWeight: '800', color: '#1a1c1c' }}>회사소개서 리뉴얼</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#767586', margin: 0 }}>
            기존 소개서를 참고하여 우측에서 템플릿을 선택 후 편집하세요.
          </p>
        </div>

        {/* 기존 소개서 데이터 */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1.2rem 1.6rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6366f1', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.8rem' }}>
            기존 회사 정보
          </div>

          {[
            { label: '회사명', value: '(주)이루' },
            { label: '설립', value: '2014년' },
            { label: '사업 분야', value: '자동차 시트 & 조향 부품 제작' },
            { label: '주요 납품처', value: '현대자동차, GM, 현대모비스 등' },
            { label: '주소', value: '경기도 화성시' },
            { label: '슬로건', value: "LET'S MAKE IT HAPPEN" },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex', gap: '0.8rem', padding: '0.7rem 0',
              borderBottom: '1px solid #f3f4f5',
            }}>
              <span style={{ width: '80px', flexShrink: 0, fontSize: '0.72rem', color: '#767586', fontWeight: '600' }}>{item.label}</span>
              <span style={{ fontSize: '0.78rem', color: '#1a1c1c', fontWeight: '500' }}>{item.value}</span>
            </div>
          ))}

          {/* 기존 소개서 PDF 영역 */}
          <div style={{ marginTop: '1.4rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6366f1', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.8rem' }}>
              기존 소개서 (PDF)
            </div>
            <div style={{
              width: '100%', aspectRatio: '297/210',
              background: 'linear-gradient(135deg, #f8f8ff 0%, #f0f1ff 100%)',
              borderRadius: '10px', border: '1.5px dashed rgba(99,102,241,0.3)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', gap: '0.5rem',
            }}>
              <Upload size={24} color="#6366f1" />
              <span style={{ fontSize: '0.78rem', color: '#6366f1', fontWeight: '700' }}>기존 소개서 PDF 업로드</span>
              <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>클릭하여 파일 선택</span>
            </div>
          </div>

          {/* 주요 키워드 태그 */}
          <div style={{ marginTop: '1.4rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6366f1', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.7rem' }}>
              강조 키워드
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {['시제품 제작', '정밀 가공', 'A/S 보증', 'ISO 인증', '자동차 부품', '커스텀 제작', '납기 준수'].map(tag => (
                <span key={tag} style={{
                  fontSize: '0.68rem', fontWeight: '600',
                  padding: '0.25rem 0.6rem', borderRadius: '20px',
                  background: 'rgba(99,102,241,0.08)', color: '#6366f1',
                  border: '1px solid rgba(99,102,241,0.2)',
                }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (60%) ────────────────────────────── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        overflow: 'hidden', background: '#f3f4f5',
      }}>
        {/* 패널 헤더 */}
        <div style={{
          padding: '1.1rem 1.6rem', background: '#fff',
          borderBottom: '1px solid #e8e8e8',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            {selectedTemplate && (
              <button
                onClick={() => { setSelectedTemplate(null); setFieldValues({}); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#767586', fontSize: '0.78rem', fontWeight: '600' }}
              >
                <ChevronLeft size={16} /> 목록으로
              </button>
            )}
            <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1a1c1c' }}>
              {selectedTemplate
                ? `✏️ ${TEMPLATES.find(t => t.id === selectedTemplate)?.name} 편집`
                : '✨ 템플릿 선택'}
            </span>
            {!selectedTemplate && (
              <span style={{ fontSize: '0.7rem', color: '#767586' }}>— A4 가로 규격 (297:210)</span>
            )}
          </div>
          {selectedTemplate && (
            <button style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 1.1rem', borderRadius: '8px', border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700',
            }}>
              <Download size={14} /> 다운로드
            </button>
          )}
        </div>

        {/* 패널 컨텐츠 */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1.4rem 1.6rem' }}>
          {!selectedTemplate ? (
            /* ── 템플릿 선택 그리드 ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#767586', marginBottom: '0.2rem' }}>
                Stitch AI로 생성된 3가지 템플릿 중 하나를 선택하여 편집하세요.
              </div>
              {TEMPLATES.map(tpl => (
                <TemplateCard
                  key={tpl.id}
                  tpl={tpl}
                  isSelected={selectedTemplate === tpl.id}
                  onClick={() => { setSelectedTemplate(tpl.id); setFieldValues({}); }}
                />
              ))}
            </div>
          ) : (
            /* ── 에디터 모드 ── */
            <div>
              <div style={{ fontSize: '0.73rem', color: '#767586', marginBottom: '1rem', lineHeight: 1.5 }}>
                각 영역을 <strong style={{ color: '#6366f1' }}>클릭</strong>하면 텍스트 또는 이미지를 편집할 수 있습니다.
                점선 테두리 = 미편집 / 실선 테두리 = 편집 완료
              </div>
              <TemplateEditor
                templateId={selectedTemplate}
                fieldValues={fieldValues}
                onFieldClick={handleFieldClick}
              />
              {/* 편집 현황 */}
              <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {(EDITOR_FIELDS[selectedTemplate] || []).map(f => {
                  const done = !!fieldValues[f.id];
                  return (
                    <span key={f.id} style={{
                      fontSize: '0.65rem', fontWeight: '600',
                      padding: '0.2rem 0.55rem', borderRadius: '20px',
                      background: done ? 'rgba(16,185,129,0.1)' : '#f3f4f5',
                      color: done ? '#10b981' : '#9ca3af',
                      border: `1px solid ${done ? 'rgba(16,185,129,0.3)' : '#e8e8e8'}`,
                      display: 'flex', alignItems: 'center', gap: '0.25rem',
                    }}>
                      {done && <Check size={9} />} {f.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 편집 모달 ── */}
      {editingField && (
        <EditModal
          field={editingField}
          value={fieldValues[editingField.id] || ''}
          onSave={handleSave}
          onClose={() => setEditingField(null)}
        />
      )}
    </div>
  );
};

export default CompanyIntroPage;
