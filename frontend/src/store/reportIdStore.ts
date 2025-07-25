import { create } from 'zustand';

interface ReportIdState {
  reportId: number | undefined;
  isAD8Completed: boolean;
  isDrawingCompleted: boolean;
  isChatCompleted: boolean;
  setReportId: (id: number) => void;
  setAD8Completed: (completed: boolean) => void;
  setDrawingCompleted: (completed: boolean) => void;
  setChatCompleted: (completed: boolean) => void;
  resetReportId: () => void;
}

export const useReportIdStore = create<ReportIdState>((set) => ({
  reportId: undefined,
  isAD8Completed: false,
  isDrawingCompleted: false,
  isChatCompleted: false,
  setReportId: (id) => set({
    reportId: id,
    isAD8Completed: false,
    isDrawingCompleted: false,
    isChatCompleted: false,
  }),
  setAD8Completed: (completed) => set({ isAD8Completed: completed }),
  setDrawingCompleted: (completed) => set({ isDrawingCompleted: completed }),
  setChatCompleted: (completed) => set({ isChatCompleted: completed }),
  resetReportId: () => set({
    reportId: undefined,
    isAD8Completed: false,
    isDrawingCompleted: false,
    isChatCompleted: false,
  }),
}));
