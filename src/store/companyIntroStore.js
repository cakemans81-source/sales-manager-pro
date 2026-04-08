import { create } from 'zustand';

const useCompanyIntroStore = create((set) => ({
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
}));

export default useCompanyIntroStore;
