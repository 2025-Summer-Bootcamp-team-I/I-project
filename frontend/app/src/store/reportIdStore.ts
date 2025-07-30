import { create } from 'zustand';

interface ReportIdState {
  reportId: number | null;
  chatId: number | null;
  isAD8Completed: boolean;
  isDrawingCompleted: boolean;
  isChatCompleted: boolean;
  setReportId: (id: number) => void;
  setChatId: (id: number | null) => void;
  setAD8Completed: (completed: boolean) => void;
  setDrawingCompleted: (completed: boolean) => void;
  setChatCompleted: (completed: boolean) => void;
  clearReportId: () => void;
  resetReportId: () => void;
}

export const useReportIdStore = create<ReportIdState>((set) => ({
  reportId: null,
  chatId: null,
  isAD8Completed: false,
  isDrawingCompleted: false,
  isChatCompleted: false,
  setReportId: (id) => set({
    reportId: id,
    isAD8Completed: false,
    isDrawingCompleted: false,
    isChatCompleted: false,
  }),
  setChatId: (id) => set({ chatId: id }),
  setAD8Completed: (completed) => set({ isAD8Completed: completed }),
  setDrawingCompleted: (completed) => set({ isDrawingCompleted: completed }),
  setChatCompleted: (completed) => set({ isChatCompleted: completed }),
  clearReportId: () => set({ reportId: null }),
  resetReportId: () => set({
    reportId: null,
    chatId: null,
    isAD8Completed: false,
    isDrawingCompleted: false,
    isChatCompleted: false,
  }),
})); 