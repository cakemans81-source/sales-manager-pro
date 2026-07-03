import React, { useRef, useState } from 'react';
import { X, Upload, Type, Image, Check, ChevronLeft, Download, Sparkles, Trash2, Save, RotateCcw, FileImage } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
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

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const clampPercent = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));

const ExternalDeckEditor = () => {
  const {
    slides,
    selectedSlideId,
    selectedElementId,
    selectSlide,
    deleteSlide,
    addElement,
    updateElement,
    deleteElement,
    selectElement,
    saveDeckToLocalStorage,
    resetDeck,
    savedAt,
  } = useCompanyIntroStore();
  const [isExporting, setIsExporting] = useState(false);
  const [dragState, setDragState] = useState(null);
  const overlayImageRef = useRef(null);
  const canvasRef = useRef(null);
  const exportRefs = useRef({});

  const selectedSlide = slides.find(slide => slide.id === selectedSlideId) || slides[0] || null;
  const selectedElement = selectedSlide?.elements?.find(element => element.id === selectedElementId) || null;

  const addTextElement = () => {
    if (!selectedSlide) return;
    addElement(selectedSlide.id, {
      id: `text_${Date.now()}`,
      type: 'text',
      text: '수정할 문구',
      x: 12,
      y: 14,
      width: 34,
      height: 12,
      fontSize: 30,
      fontWeight: 700,
      color: '#111827',
      align: 'left',
    });
  };

  const handleOverlayImageUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !selectedSlide) return;
    if (!file.type.startsWith('image/')) {
      alert('PNG/JPG/WebP 이미지 파일만 추가할 수 있습니다.');
      return;
    }

    const src = await readFileAsDataUrl(file);
    addElement(selectedSlide.id, {
      id: `image_${Date.now()}`,
      type: 'image',
      src,
      x: 58,
      y: 16,
      width: 28,
      height: 28,
    });
  };

  const updateSelectedElement = (patch) => {
    if (!selectedSlide || !selectedElement) return;
    updateElement(selectedSlide.id, selectedElement.id, patch);
  };

  const handlePointerDown = (event, element) => {
    if (!selectedSlide || !canvasRef.current) return;
    event.stopPropagation();
    selectElement(element.id);
    setDragState({
      id: element.id,
      startX: event.clientX,
      startY: event.clientY,
      initialX: element.x,
      initialY: element.y,
    });
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!dragState || !selectedSlide || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const dx = ((event.clientX - dragState.startX) / rect.width) * 100;
    const dy = ((event.clientY - dragState.startY) / rect.height) * 100;
    const element = selectedSlide.elements.find(item => item.id === dragState.id);
    const maxX = 100 - (element?.width || 10);
    const maxY = 100 - (element?.height || 10);
    updateElement(selectedSlide.id, dragState.id, {
      x: clampPercent(dragState.initialX + dx, 0, maxX),
      y: clampPercent(dragState.initialY + dy, 0, maxY),
    });
  };

  const renderSlideCanvas = (slide, { exportMode = false } = {}) => (
    <div
      ref={exportMode ? (node) => { exportRefs.current[slide.id] = node; } : canvasRef}
      onPointerMove={!exportMode ? handlePointerMove : undefined}
      onPointerUp={!exportMode ? () => setDragState(null) : undefined}
      onPointerCancel={!exportMode ? () => setDragState(null) : undefined}
      onClick={!exportMode ? () => selectElement(null) : undefined}
      style={{
        width: exportMode ? '1280px' : '100%',
        aspectRatio: '16 / 9',
        position: 'relative',
        background: '#fff',
        overflow: 'hidden',
        borderRadius: exportMode ? 0 : '10px',
        boxShadow: exportMode ? 'none' : '0 8px 40px rgba(99,102,241,0.14)',
      }}
    >
      <img
        src={slide.backgroundImage}
        alt={slide.title}
        draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }}
      />
      {(slide.elements || []).map(element => {
        const isSelected = !exportMode && selectedElementId === element.id;
        return (
          <div
            key={element.id}
            onPointerDown={!exportMode ? (event) => handlePointerDown(event, element) : undefined}
            onClick={!exportMode ? (event) => { event.stopPropagation(); selectElement(element.id); } : undefined}
            style={{
              position: 'absolute',
              left: `${element.x}%`,
              top: `${element.y}%`,
              width: `${element.width}%`,
              height: `${element.height}%`,
              cursor: exportMode ? 'default' : 'move',
              border: exportMode ? 'none' : `2px ${isSelected ? 'solid #6366f1' : 'dashed rgba(99,102,241,0.35)'}`,
              background: element.type === 'text' ? 'rgba(255,255,255,0.72)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: element.align === 'center' ? 'center' : element.align === 'right' ? 'flex-end' : 'flex-start',
              overflow: 'hidden',
              padding: element.type === 'text' ? '0.35rem' : 0,
              boxSizing: 'border-box',
            }}
          >
            {element.type === 'image' ? (
              <img src={element.src} alt="overlay" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <span style={{
                width: '100%',
                color: element.color,
                fontSize: `${element.fontSize}px`,
                fontWeight: element.fontWeight,
                textAlign: element.align,
                lineHeight: 1.18,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {element.text}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );

  const handleSaveDeck = () => {
    const result = saveDeckToLocalStorage();
    alert(result.success ? '회사소개서를 저장했습니다.' : result.message);
  };

  const handleResetDeck = () => {
    if (!window.confirm('저장된 외부 디자인 deck을 초기화하시겠습니까?')) return;
    resetDeck();
  };

  const handlePdfDownload = async () => {
    if (slides.length === 0) {
      alert('PDF로 출력할 슬라이드가 없습니다.');
      return;
    }

    try {
      setIsExporting(true);
      const pdf = new jsPDF('l', 'mm', [297, 167.0625]);
      for (let index = 0; index < slides.length; index += 1) {
        const node = exportRefs.current[slides[index].id];
        if (!node) continue;
        const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
        const image = canvas.toDataURL('image/jpeg', 0.96);
        if (index > 0) pdf.addPage([297, 167.0625], 'l');
        pdf.addImage(image, 'JPEG', 0, 0, 297, 167.0625);
      }
      pdf.save(`Company_Deck_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('Company deck PDF export failed:', error);
      alert('PDF 다운로드 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!selectedSlide) {
    return (
      <div style={{ padding: '2.5rem', textAlign: 'center', border: '1px dashed #d1d5db', borderRadius: '12px', background: '#fff' }}>
        <FileImage size={34} color="#6366f1" />
        <p style={{ margin: '0.8rem 0 0.2rem', fontSize: '0.95rem', fontWeight: '800', color: '#1f2937' }}>슬라이드 이미지를 업로드해 주세요</p>
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>PNG, JPG, WebP 파일을 가져오면 각 이미지가 한 장의 슬라이드가 됩니다.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '150px minmax(0, 1fr) 270px', gap: '1rem', alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => selectSlide(slide.id)}
            style={{
              border: selectedSlide.id === slide.id ? '2px solid #6366f1' : '1px solid #e5e7eb',
              background: '#fff',
              borderRadius: '8px',
              padding: '0.35rem',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ aspectRatio: '16 / 9', background: '#f9fafb', overflow: 'hidden', borderRadius: '5px' }}>
              <img src={slide.backgroundImage} alt={slide.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ marginTop: '0.35rem', fontSize: '0.68rem', fontWeight: '800', color: '#374151' }}>{index + 1}. {slide.title}</div>
          </button>
        ))}
      </div>

      <div>
        {renderSlideCanvas(selectedSlide)}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.8rem' }}>
          <button className="btn btn-ghost" onClick={addTextElement}><Type size={16} /> 텍스트 추가</button>
          <button className="btn btn-ghost" onClick={() => overlayImageRef.current?.click()}><Image size={16} /> 이미지 추가</button>
          <button className="btn btn-ghost" onClick={handleSaveDeck}><Save size={16} /> 회사소개서 저장</button>
          <button className="btn btn-ghost" onClick={handlePdfDownload} disabled={isExporting}><Download size={16} /> {isExporting ? 'PDF 생성 중...' : 'PDF 다운로드'}</button>
          <button className="btn btn-ghost" onClick={() => deleteSlide(selectedSlide.id)}><Trash2 size={16} /> 슬라이드 삭제</button>
          <button className="btn btn-ghost" onClick={handleResetDeck}><RotateCcw size={16} /> 초기화</button>
          <input ref={overlayImageRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={handleOverlayImageUpload} />
        </div>
        <p style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.6rem' }}>
          이미지는 브라우저 저장공간을 사용하므로 너무 큰 파일은 저장되지 않을 수 있습니다.
          {savedAt && ` 마지막 저장: ${new Date(savedAt).toLocaleString('ko-KR')}`}
        </p>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1rem' }}>
        <h3 style={{ margin: '0 0 0.8rem', fontSize: '0.9rem', color: '#111827' }}>선택 요소 편집</h3>
        {!selectedElement ? (
          <p style={{ fontSize: '0.74rem', color: '#6b7280', lineHeight: 1.6, margin: 0 }}>슬라이드 위 텍스트나 이미지를 클릭하면 위치와 크기를 조정할 수 있습니다. 요소는 드래그로 이동할 수 있습니다.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {selectedElement.type === 'text' && (
              <>
                <label style={{ fontSize: '0.7rem', fontWeight: '800', color: '#4b5563' }}>문구</label>
                <textarea className="input-field" value={selectedElement.text} rows={4} onChange={e => updateSelectedElement({ text: e.target.value })} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <input className="input-field" type="number" value={selectedElement.fontSize} onChange={e => updateSelectedElement({ fontSize: Number(e.target.value) })} title="글자 크기" />
                  <select className="input-field" value={selectedElement.fontWeight} onChange={e => updateSelectedElement({ fontWeight: Number(e.target.value) })}>
                    <option value={400}>보통</option>
                    <option value={700}>굵게</option>
                    <option value={900}>매우 굵게</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <input className="input-field" type="color" value={selectedElement.color} onChange={e => updateSelectedElement({ color: e.target.value })} />
                  <select className="input-field" value={selectedElement.align} onChange={e => updateSelectedElement({ align: e.target.value })}>
                    <option value="left">왼쪽</option>
                    <option value="center">가운데</option>
                    <option value="right">오른쪽</option>
                  </select>
                </div>
              </>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {['x', 'y', 'width', 'height'].map(key => (
                <label key={key} style={{ fontSize: '0.68rem', fontWeight: '800', color: '#4b5563' }}>
                  {key.toUpperCase()}
                  <input
                    className="input-field"
                    type="number"
                    min="0"
                    max="100"
                    value={Math.round(selectedElement[key] * 10) / 10}
                    onChange={e => updateSelectedElement({ [key]: clampPercent(e.target.value) })}
                    style={{ marginTop: '0.25rem' }}
                  />
                </label>
              ))}
            </div>
            <button className="btn btn-ghost" onClick={() => deleteElement(selectedSlide.id, selectedElement.id)} style={{ color: '#ef4444' }}>
              <Trash2 size={16} /> 요소 삭제
            </button>
          </div>
        )}
      </div>

      <div style={{ position: 'fixed', left: '-10000px', top: 0, width: '1280px', pointerEvents: 'none' }}>
        {slides.map(slide => <div key={slide.id} style={{ width: '1280px', height: '720px', marginBottom: '20px' }}>{renderSlideCanvas(slide, { exportMode: true })}</div>)}
      </div>
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
  const { selectedTemplate, changeTemplate, fieldValues, addSlides, slides } = useCompanyIntroStore();
  const slideUploadRef = useRef();
  const [activeWorkspace, setActiveWorkspace] = useState('external');

  const handleSlideImageUpload = async (event) => {
    const files = Array.from(event.target.files || []).filter(file => file.type.startsWith('image/'));
    event.target.value = '';
    if (files.length === 0) {
      alert('PNG/JPG/WebP 이미지 파일을 선택해 주세요.');
      return;
    }

    try {
      const importedSlides = await Promise.all(files.map(async (file, index) => ({
        id: `slide_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 7)}`,
        title: file.name.replace(/\.[^.]+$/, '') || `Slide ${slides.length + index + 1}`,
        backgroundImage: await readFileAsDataUrl(file),
        elements: [],
      })));
      addSlides(importedSlides);
      setActiveWorkspace('external');
    } catch {
      alert('이미지를 불러오는 중 오류가 발생했습니다.');
    }
  };

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

          {/* 외부 디자인 이미지 업로드 */}
          <div style={{ marginTop: '1.4rem', marginBottom: '1.4rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: '800', color: '#6366f1', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.8rem' }}>
              외부 디자인 가져오기
            </div>
            <div
              onClick={() => slideUploadRef.current?.click()}
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
              <span style={{ fontSize: '0.78rem', color: '#6366f1', fontWeight: '700' }}>슬라이드 이미지 업로드</span>
              <span style={{ fontSize: '0.64rem', color: '#9ca3af' }}>PNG/JPG/WebP 여러 장 선택 가능</span>
            </div>
            <input ref={slideUploadRef} type="file" accept="image/png,image/jpeg,image/webp" multiple style={{ display: 'none' }} onChange={handleSlideImageUpload} />
            <div style={{ marginTop: '0.55rem', fontSize: '0.66rem', color: '#9ca3af', lineHeight: 1.5 }}>
              PDF/PPTX 객체 복원은 후속 지원 예정입니다. 1차에서는 Claude Design 등에서 내보낸 슬라이드 이미지를 배경으로 사용합니다.
            </div>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {activeWorkspace === 'template' && selectedTemplate && (
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
              {activeWorkspace === 'external'
                ? '🖼️ 외부 디자인 편집'
                : selectedTemplate
                ? `✏️ ${TEMPLATES.find(t => t.id === selectedTemplate)?.name} 편집 중`
                : '✨ 템플릿 선택'}
            </span>
            {activeWorkspace === 'template' && !selectedTemplate && (
              <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>A4 가로 규격 (297 : 210)</span>
            )}
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                onClick={() => setActiveWorkspace('external')}
                style={{
                  border: activeWorkspace === 'external' ? '1px solid #6366f1' : '1px solid #e5e7eb',
                  background: activeWorkspace === 'external' ? 'rgba(99,102,241,0.08)' : '#fff',
                  color: activeWorkspace === 'external' ? '#6366f1' : '#6b7280',
                  borderRadius: '8px',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                }}
              >
                외부 디자인
              </button>
              <button
                onClick={() => setActiveWorkspace('template')}
                style={{
                  border: activeWorkspace === 'template' ? '1px solid #6366f1' : '1px solid #e5e7eb',
                  background: activeWorkspace === 'template' ? 'rgba(99,102,241,0.08)' : '#fff',
                  color: activeWorkspace === 'template' ? '#6366f1' : '#6b7280',
                  borderRadius: '8px',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                }}
              >
                Stitch 템플릿
              </button>
            </div>
          </div>
          {activeWorkspace === 'template' && selectedTemplate && (
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
          {activeWorkspace === 'external' ? (
            <ExternalDeckEditor />
          ) : !selectedTemplate ? (
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
