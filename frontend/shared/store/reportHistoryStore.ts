import { create } from "zustand";
import type { ReportResponse } from "./reportStore";
import type { MyReportSummary } from "../types/api";
import { getMyReports } from "../api";

/**
 * 검사 기록 관리를 위한 상태 인터페이스
 */
interface ReportHistoryState {
  /** 저장된 모든 검사 결과 목록 */
  reports: ReportResponse[];
  
  /** 마이페이지용 리포트 요약 목록 */
  myReports: MyReportSummary[];
  
  /** 로딩 상태 */
  isLoading: boolean;
  
  /** 에러 상태 */
  error: string | null;
  
  /** 검사 결과 목록을 한번에 설정 (예: API에서 데이터를 받아올 때 사용) */
  setReports: (reports: ReportResponse[]) => void;
  
  /** 새로운 검사 결과를 목록에 추가 */
  addReport: (report: ReportResponse) => void;
  
  /** 모든 검사 기록을 초기화 */
  clearReports: () => void;
  
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
 * // 검사 기록 가져오기
 * const reports = useReportHistoryStore((state) => state.reports);
 * 
 * // 새 검사 결과 추가하기
 * const addReport = useReportHistoryStore((state) => state.addReport);
 * addReport(newReport);
 * 
 * // 마이페이지 리포트 목록 가져오기
 * const fetchMyReports = useReportHistoryStore((state) => state.fetchMyReports);
 * await fetchMyReports();
 * 
 * // 검사 기록 초기화
 * const clearReports = useReportHistoryStore((state) => state.clearReports);
 * clearReports();
 * ```
 */
export const useReportHistoryStore = create<ReportHistoryState>((set) => ({
  // 초기 상태: 빈 배열
  reports: [],
  myReports: [],
  isLoading: false,
  error: null,
  
  // 검사 결과 목록 설정
  setReports: (reports) => set({ reports }),
  
  // 새로운 검사 결과 추가
  addReport: (report) => set((state) => ({ 
    reports: [...state.reports, report] 
  })),
  
  // 모든 검사 기록 초기화
  clearReports: () => set({ reports: [], myReports: [] }),
  
  // 마이페이지 리포트 목록 설정
  setMyReports: (myReports) => set({ myReports }),
  
  // 마이페이지 리포트 목록을 API에서 가져오기
  fetchMyReports: async () => {
    // 토큰 체크
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ 
        error: '로그인이 필요합니다. 로그인 후 다시 시도해주세요.', 
        isLoading: false 
      });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const reports = await getMyReports();
      set({ myReports: reports, isLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch my reports:', error);
      
      let errorMessage = '리포트를 불러오는데 실패했습니다.';
      
      // 401 에러 처리
      if (error.response?.status === 401) {
        errorMessage = '로그인이 만료되었습니다. 다시 로그인해주세요.';
        localStorage.removeItem('access_token'); // 만료된 토큰 제거
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