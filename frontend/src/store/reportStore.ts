// src/store/reportStore.ts
import { create } from "zustand";
import exImage from "../assets/imgs/ex.png"; // 예시 이미지, 실제 그림 이미지로 바꿀 것!

export interface ReportResult {
  report_id?: number;
  user_id?: number;
  drawingtest_result: string; // 그림 검사 ai 조건 요약 (text)
  chat_result: string;        // 텍스트 검사 ai 조건 요약 (text)
  ad8test_result: string;     // AD8 검사 ai 조건 요약 (text)
  final_result: string;       // 최종 소견 (text)
  total_score: number;        // 최종 점수
  ad8_score: number;
  drawing_score: number;
  text_score: number;
  memory_score: number;
  Time_Space_score: number;
  Judgment_score: number;
  visual_score: number;
  language_score: number;
  drawing_image?: string;     // 그림 검사 이미지 (base64 또는 url, 없으면 exImage)
}

interface ReportState {
  report: ReportResult | null;
  setReport: (data: ReportResult) => void;
}

export const useReportStore = create<ReportState>((set) => ({
  report: {
    report_id: 1,
    user_id: 1,
    drawingtest_result: "원을 잘 그렸습니다. 공간구성력이 양호합니다.",
    chat_result: "대화의 흐름 이해와 언어 표현이 매우 양호합니다.",
    ad8test_result: "모든 항목에 대해 변화가 없다고 답변하셨습니다.",
    final_result: "전반적인 인지 기능이 양호한 수준입니다.",
    total_score: 88,
    ad8_score: 15,
    drawing_score: 90,
    text_score: 88,
    memory_score: 95,
    Time_Space_score: 80,
    Judgment_score: 82,
    visual_score: 88,
    language_score: 93,
    drawing_image: exImage, // src/assets/imgs/ex.png 사용
  },
  setReport: (data) => set({ report: data }),
}));
