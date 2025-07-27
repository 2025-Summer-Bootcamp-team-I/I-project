import { create } from "zustand";
import type { MyReportSummary } from "@shared/types/api";

// React Native용 메모리 스토리지 (임시)
const memoryStorage: { [key: string]: string } = {};

export const storage = {
  getItem: (key: string) => memoryStorage[key] || null,
  setItem: (key: string, value: string) => { memoryStorage[key] = value; },
  removeItem: (key: string) => { delete memoryStorage[key]; },
};

// 로그인 시 토큰 저장 함수 (외부에서 호출 가능)
export const setAuthToken = (token: string) => {
  storage.setItem('access_token', token);
};

// 로그아웃 시 토큰 제거 함수 (외부에서 호출 가능)
export const removeAuthToken = () => {
  storage.removeItem('access_token');
};

/**
 * 검사 기록 관리를 위한 상태 인터페이스
 */
interface ReportHistoryState {
  /** 마이페이지용 리포트 요약 목록 */
  myReports: MyReportSummary[];
  
  /** 로딩 상태 */
  isLoading: boolean;
  
  /** 에러 상태 */
  error: string | null;
  
  /** 마이페이지 리포트 목록을 API에서 가져오기 */
  fetchMyReports: () => Promise<void>;
  
  /** 마이페이지 리포트 목록 설정 */
  setMyReports: (reports: MyReportSummary[]) => void;
}

/**
 * 검사 기록 관리를 위한 Zustand 스토어
 * 
 * 사용 예시:
 * ```typescript
 * // 마이페이지 리포트 목록 가져오기
 * const fetchMyReports = useReportHistoryStore((state) => state.fetchMyReports);
 * await fetchMyReports();
 * 
 * // 마이페이지 리포트 목록 가져오기
 * const myReports = useReportHistoryStore((state) => state.myReports);
 * ```
 */
export const useReportHistoryStore = create<ReportHistoryState>((set) => ({
  // 초기 상태: 빈 배열
  myReports: [],
  isLoading: false,
  error: null,
  
  // 마이페이지 리포트 목록 설정
  setMyReports: (myReports) => set({ myReports }),
  
  // 마이페이지 리포트 목록을 API에서 가져오기
  fetchMyReports: async () => {
    // 토큰 체크
    const token = storage.getItem('access_token');
    if (!token) {
      set({ 
        error: '로그인이 필요합니다. 로그인 후 다시 시도해주세요.', 
        isLoading: false 
      });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const { getMyReports } = await import("../api");
      const reports = await getMyReports();
      set({ myReports: reports, isLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch my reports:', error);
      
      let errorMessage = '리포트를 불러오는데 실패했습니다.';
      
      // 401 에러 처리
      if (error.response?.status === 401) {
        errorMessage = '로그인이 만료되었습니다. 다시 로그인해주세요.';
        removeAuthToken(); // 만료된 토큰 제거
      } else if (error.response?.status === 403) {
        errorMessage = '접근 권한이 없습니다.';
      } else if (error.response?.status >= 500) {
        errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      set({ 
        error: errorMessage, 
        isLoading: false 
      });
    }
  }
})); 