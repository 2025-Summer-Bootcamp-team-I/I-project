import { create } from 'zustand';

interface ReportIdState {
  reportId: number | null;
  chatId: number | null;
  isAD8Completed: boolean;
  isDrawingCompleted: boolean;
  isChatCompleted: boolean;
  isLoading: boolean;
  setReportId: (id: number) => void;
  setChatId: (id: number | null) => void;
  setAD8Completed: (completed: boolean) => void;
  setDrawingCompleted: (completed: boolean) => void;
  setChatCompleted: (completed: boolean) => void;
  clearReportId: () => void;
  resetReportId: () => void;
  loadPersistedState: () => Promise<void>;
}

// localStorage 키들
const STORAGE_KEYS = {
  REPORT_ID: 'reportId',
  CHAT_ID: 'chatId',
  AD8_COMPLETED: 'isAD8Completed',
  DRAWING_COMPLETED: 'isDrawingCompleted',
  CHAT_COMPLETED: 'isChatCompleted',
};

// localStorage 헬퍼 함수들
const storage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('localStorage getItem 오류:', error);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('localStorage setItem 오류:', error);
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('localStorage removeItem 오류:', error);
    }
  },
  multiRemove: (keys: string[]): void => {
    try {
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('localStorage multiRemove 오류:', error);
    }
  }
};

export const useReportIdStore = create<ReportIdState>((set, get) => ({
  reportId: null,
  chatId: null,
  isAD8Completed: false,
  isDrawingCompleted: false,
  isChatCompleted: false,
  isLoading: true,
  
  setReportId: async (id) => {
    set({
      reportId: id,
      isAD8Completed: false,
      isDrawingCompleted: false,
      isChatCompleted: false,
    });
    // 상태를 localStorage에 저장
    storage.setItem(STORAGE_KEYS.REPORT_ID, id.toString());
    storage.setItem(STORAGE_KEYS.AD8_COMPLETED, 'false');
    storage.setItem(STORAGE_KEYS.DRAWING_COMPLETED, 'false');
    storage.setItem(STORAGE_KEYS.CHAT_COMPLETED, 'false');
  },
  
  setChatId: async (id) => {
    set({ chatId: id });
    if (id !== null) {
      storage.setItem(STORAGE_KEYS.CHAT_ID, id.toString());
    } else {
      storage.removeItem(STORAGE_KEYS.CHAT_ID);
    }
  },
  
  setAD8Completed: async (completed) => {
    set({ isAD8Completed: completed });
    storage.setItem(STORAGE_KEYS.AD8_COMPLETED, completed.toString());
    console.log('AD8 완료 상태 저장:', completed);
  },
  
  setDrawingCompleted: async (completed) => {
    set({ isDrawingCompleted: completed });
    storage.setItem(STORAGE_KEYS.DRAWING_COMPLETED, completed.toString());
    console.log('그림 검사 완료 상태 저장:', completed);
  },
  
  setChatCompleted: async (completed) => {
    set({ isChatCompleted: completed });
    storage.setItem(STORAGE_KEYS.CHAT_COMPLETED, completed.toString());
    console.log('대화 검사 완료 상태 저장:', completed);
  },
  
  clearReportId: async () => {
    set({ reportId: null });
    storage.removeItem(STORAGE_KEYS.REPORT_ID);
  },
  
  resetReportId: async () => {
    set({
      reportId: null,
      chatId: null,
      isAD8Completed: false,
      isDrawingCompleted: false,
      isChatCompleted: false,
    });
    // 모든 저장된 상태 삭제
    storage.multiRemove([
      STORAGE_KEYS.REPORT_ID,
      STORAGE_KEYS.CHAT_ID,
      STORAGE_KEYS.AD8_COMPLETED,
      STORAGE_KEYS.DRAWING_COMPLETED,
      STORAGE_KEYS.CHAT_COMPLETED,
    ]);
  },
  
  loadPersistedState: async () => {
    try {
      set({ isLoading: true });
      
      console.log('상태 복원 시작...');
      
      // 즉시 실행하여 빠른 상태 복원
      const reportIdStr = storage.getItem(STORAGE_KEYS.REPORT_ID);
      const chatIdStr = storage.getItem(STORAGE_KEYS.CHAT_ID);
      const ad8CompletedStr = storage.getItem(STORAGE_KEYS.AD8_COMPLETED);
      const drawingCompletedStr = storage.getItem(STORAGE_KEYS.DRAWING_COMPLETED);
      const chatCompletedStr = storage.getItem(STORAGE_KEYS.CHAT_COMPLETED);
      
      console.log('localStorage에서 읽은 값들:', {
        reportIdStr,
        chatIdStr,
        ad8CompletedStr,
        drawingCompletedStr,
        chatCompletedStr,
      });
      
      const restoredState = {
        reportId: reportIdStr ? parseInt(reportIdStr) : null,
        chatId: chatIdStr ? parseInt(chatIdStr) : null,
        isAD8Completed: ad8CompletedStr === 'true',
        isDrawingCompleted: drawingCompletedStr === 'true',
        isChatCompleted: chatCompletedStr === 'true',
        isLoading: false,
      };
      
      // 즉시 상태 설정
      set(restoredState);
      
      console.log('상태 복원 완료:', restoredState);
    } catch (error) {
      console.error('상태 복원 중 오류:', error);
      set({ isLoading: false });
    }
  },
})); 