import { create } from 'zustand';

interface ReportIdState {
  reportId: number | undefined;
  chatId: number | null; // 추가
  isAD8Completed: boolean;
  isDrawingCompleted: boolean;
  isChatCompleted: boolean;
  setReportId: (id: number) => void;
  setChatId: (id: number | null) => void; // 추가
  setAD8Completed: (completed: boolean) => void;
  setDrawingCompleted: (completed: boolean) => void;
  setChatCompleted: (completed: boolean) => void;
  resetReportId: () => void;
}

export const useReportIdStore = create<ReportIdState>((set) => ({
  reportId: undefined,
  chatId: null, // 초기값 설정
  isAD8Completed: false,
  isDrawingCompleted: false,
  isChatCompleted: false,
  setReportId: (id) => set({
    reportId: id,
    isAD8Completed: false,
    isDrawingCompleted: false,
    isChatCompleted: false,
  }),
  setChatId: (id) => set({ chatId: id }), // 액션 구현
  setAD8Completed: (completed) => set({ isAD8Completed: completed }),
  setDrawingCompleted: (completed) => set({ isDrawingCompleted: completed }),
  setChatCompleted: (completed) => set({ isChatCompleted: completed }),
  resetReportId: () => set({
    reportId: undefined,
    chatId: null, // chatId 초기화 추가
    isAD8Completed: false,
    isDrawingCompleted: false,
    isChatCompleted: false,
  }),
}));
