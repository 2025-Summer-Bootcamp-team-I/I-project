import { create } from "zustand";

/**
 * 스토어에서 사용될 일관된 리포트 데이터 구조입니다.
 * API 응답과 약간 다를 수 있으며, null 값들이 기본값으로 처리된 상태입니다.
 */
export interface ReportResponse {
  report_id?: number;
  user_id?: number;
  drawingtest_result: string; // 그림 검사 ai 조건 요약 (text)
  chat_result: string;        // 텍스트 검사 ai 조건 요약 (text)
  ad8test_result: string;     // AD8 검사 ai 조건 요약 (text)
  final_result: string;       // 최종 소견 (text)
  total_score: number;        // 최종 점수
  ad8_score: number;
  drawing_score: number;
  memory_score: number;
  visual_score: number;
  language_score: number;
  ad8_risk: string | null;
  drawing_risk: string | null;
  chat_risk: string | null;
  final_risk: string | null;
  drawing_image_url: string; // 스토어에서는 항상 URL 문자열을 갖도록 처리 (null 없음)
  presigned_url?: string; // presigned URL (선택적)
  ad8_details: {
    total_responses: number | null,
    correct_responses: number | null
  }; // 스토어에서는 항상 객체 형태를 유지 (null 없음)
}

/**
 * API에서 실제로 응답으로 오는 데이터 구조입니다.
 * 스토어 타입과 달리 일부 속성이 null일 수 있습니다.
 */
interface ApiReportResponse extends Omit<ReportResponse, 'drawing_image_url' | 'ad8_details' | 'presigned_url'> {
    drawing_image_url: string | null;
    presigned_url?: string | null;
    ad8_details: {
        total_responses: number;
        correct_responses: number;
    } | null;
}

interface ReportState {
  report: ReportResponse | null;
  setReport: (data: ApiReportResponse) => void; // 파라미터 타입을 API 응답 타입으로 명시
}

export const useReportStore = create<ReportState>((set) => ({
  report: null,
  /**
   * API에서 받은 데이터를 스토어 상태에 맞게 가공하여 저장합니다.
   * @param data API에서 받은 원본 리포트 데이터
   */
  setReport: (data) => {
    // 스토어에 저장하기 전에 데이터를 가공합니다.
    const processedReport: ReportResponse = {
      ...data,
      // ad8_details가 null이면 기본 객체를, 아니면 기존 값을 사용합니다.
      ad8_details: data.ad8_details ?? { total_responses: null, correct_responses: null },
      // drawing_image_url이 null이면 빈 문자열을, 아니면 기존 URL을 사용합니다.
      drawing_image_url: data.drawing_image_url ?? '',
      // presigned_url이 null이면 undefined로, 아니면 기존 값을 사용합니다.
      presigned_url: data.presigned_url ?? undefined,
    };
    
    set({ report: processedReport });
  },
})); 