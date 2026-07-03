import { create } from 'zustand';

const COMPANY_DECK_STORAGE_KEY = 'smp_company_intro_external_deck_v1';

const emptyDeck = {
  slides: [],
  selectedSlideId: null,
  selectedElementId: null,
  savedAt: null,
};

const loadSavedDeck = () => {
  try {
    const raw = localStorage.getItem(COMPANY_DECK_STORAGE_KEY);
    if (!raw) return emptyDeck;
    const parsed = JSON.parse(raw);
    const slides = Array.isArray(parsed.slides) ? parsed.slides : [];
    return {
      slides,
      selectedSlideId: parsed.selectedSlideId || slides[0]?.id || null,
      selectedElementId: null,
      savedAt: parsed.savedAt || null,
    };
  } catch {
    return emptyDeck;
  }
};

const useCompanyIntroStore = create((set, get) => ({
  // ── 선택된 템플릿 ID (1 | 2 | 3 | null)
  selectedTemplate: null,
  setSelectedTemplate: (id) => set({ selectedTemplate: id }),

  // ── 편집 모달 오픈 여부
  isEditModalOpen: false,

  // ── 편집 대상 { id, type: 'text'|'image', label, placeholder }
  editTarget: null,

  // ── 편집된 필드값 { [fieldId]: value }
  fieldValues: {},

  // 모달 열기
  openEditModal: (field) => set({ isEditModalOpen: true, editTarget: field }),

  // 모달 닫기
  closeEditModal: () => set({ isEditModalOpen: false, editTarget: null }),

  // 필드값 저장 후 모달 닫기
  saveFieldValue: (fieldId, value) =>
    set((state) => ({
      fieldValues: { ...state.fieldValues, [fieldId]: value },
      isEditModalOpen: false,
      editTarget: null,
    })),

  // 템플릿 변경 시 필드값 초기화
  changeTemplate: (id) =>
    set({ selectedTemplate: id, fieldValues: {}, isEditModalOpen: false, editTarget: null }),

  // ── 외부 디자인 이미지 기반 deck 편집 상태
  ...loadSavedDeck(),

  addSlides: (newSlides) =>
    set((state) => ({
      slides: [...state.slides, ...newSlides],
      selectedSlideId: state.selectedSlideId || newSlides[0]?.id || null,
      selectedElementId: null,
    })),

  selectSlide: (slideId) => set({ selectedSlideId: slideId, selectedElementId: null }),

  deleteSlide: (slideId) =>
    set((state) => {
      const slides = state.slides.filter(slide => slide.id !== slideId);
      const selectedSlideId = state.selectedSlideId === slideId
        ? slides[0]?.id || null
        : state.selectedSlideId;
      return { slides, selectedSlideId, selectedElementId: null };
    }),

  addElement: (slideId, element) =>
    set((state) => ({
      slides: state.slides.map(slide => (
        slide.id === slideId
          ? { ...slide, elements: [...(slide.elements || []), element] }
          : slide
      )),
      selectedElementId: element.id,
    })),

  updateElement: (slideId, elementId, patch) =>
    set((state) => ({
      slides: state.slides.map(slide => (
        slide.id === slideId
          ? {
              ...slide,
              elements: (slide.elements || []).map(element => (
                element.id === elementId ? { ...element, ...patch } : element
              )),
            }
          : slide
      )),
    })),

  deleteElement: (slideId, elementId) =>
    set((state) => ({
      slides: state.slides.map(slide => (
        slide.id === slideId
          ? { ...slide, elements: (slide.elements || []).filter(element => element.id !== elementId) }
          : slide
      )),
      selectedElementId: state.selectedElementId === elementId ? null : state.selectedElementId,
    })),

  selectElement: (elementId) => set({ selectedElementId: elementId }),

  saveDeckToLocalStorage: () => {
    const { slides, selectedSlideId } = get();
    const savedAt = new Date().toISOString();
    try {
      localStorage.setItem(COMPANY_DECK_STORAGE_KEY, JSON.stringify({ slides, selectedSlideId, savedAt }));
      set({ savedAt });
      return { success: true, savedAt };
    } catch {
      return {
        success: false,
        message: '이미지 용량이 커서 저장하지 못했습니다. 이미지 용량을 줄여 다시 시도해 주세요.',
      };
    }
  },

  resetDeck: () => {
    localStorage.removeItem(COMPANY_DECK_STORAGE_KEY);
    set({ ...emptyDeck });
  },
}));

export default useCompanyIntroStore;
