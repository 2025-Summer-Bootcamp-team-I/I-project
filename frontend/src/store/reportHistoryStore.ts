import { create } from "zustand";
import type { ReportResult } from "./reportStore";

/**
 * 검사 기록 관리를 위한 상태 인터페이스
 */
interface ReportHistoryState {
  /** 저장된 모든 검사 결과 목록 */
  reports: ReportResult[];
  
  /** 검사 결과 목록을 한번에 설정 (예: API에서 데이터를 받아올 때 사용) */
  setReports: (reports: ReportResult[]) => void;
  
  /** 새로운 검사 결과를 목록에 추가 */
  addReport: (report: ReportResult) => void;
  
  /** 모든 검사 기록을 초기화 */
  clearReports: () => void;
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
 * // 검사 기록 초기화
 * const clearReports = useReportHistoryStore((state) => state.clearReports);
 * clearReports();
 * ```
 */
export const useReportHistoryStore = create<ReportHistoryState>((set) => ({
  // 초기 상태: 빈 배열
  reports: [],
  
  // 검사 결과 목록 설정
  setReports: (reports) => set({ reports }),
  
  // 새로운 검사 결과 추가
  addReport: (report) => set((state) => ({ 
    reports: [...state.reports, report] 
  })),
  
  // 모든 검사 기록 초기화
  clearReports: () => set({ reports: [] })
}));