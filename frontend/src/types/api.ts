export type RiskLevel = '양호' | '경계' | '위험' | null;

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
}

export interface Message {
  msg: string;
}

export interface ResponseItem {
  questionNo: number;
  isCorrect: boolean;
}

export interface AD8Request {
  report_id: number;
  responses: ResponseItem[];
}

export interface AD8Result {
  risk_score: number;
  message: string;
  risk_level: RiskLevel;
}

export interface EmptyReportCreate {
  drawingtest_result?: string;
  chat_result?: string;
  ad8test_result?: string;
  final_result?: string;
  recommendation?: string;
  total_score?: number;
  ad8_score?: number;
  drawing_score?: number;
  memory_score?: number;
  time_space_score?: number;
  judgment_score?: number;
  visual_score?: number;
  language_score?: number;
  ad8_risk?: RiskLevel;
  drawing_risk?: RiskLevel;
  chat_risk?: RiskLevel;
  final_risk?: RiskLevel;
}

export interface SimpleReportResponse {
  report_id: number;
  user_id: number;
}

export interface ReportResponse {
  report_id: number;
  user_id: number;
  drawingtest_result: string;
  chat_result: string;
  ad8test_result: string;
  final_result: string;
  recommendation: string;
  total_score: number;
  ad8_score: number;
  drawing_score: number;
  memory_score: number;
  time_space_score: number;
  judgment_score: number;
  visual_score: number;
  language_score: number;
  ad8_risk: RiskLevel;
  drawing_risk: RiskLevel;
  chat_risk: RiskLevel;
  final_risk: RiskLevel;
  drawing_image_url: string | null;
  ad8_details: {
    total_responses: number;
    correct_responses: number;
  } | null;
}

export interface DrawingTestResult {
  drawing_id: number;
  report_id: number;
  image_url: string;
  risk_score: number;
  drawing_score: number;
  drawingtest_result: string;
  risk_level: RiskLevel;
}

export interface CreateChatRequest {
  report_id: number;
}

export interface CreateChatResponse {
  chat_id: number;
  message: string;
}

export interface ChatRequest {
  report_id: number;
  chat_id: number;
  message: string;
}

export interface ChatLogResponse {
  id: number;
  chat_id: number;
  role: 'user' | 'ai';
  message: string;
  created_at: string;
  updated_at: string;
}

export interface EvaluateChatResponse {
  chat_result: string;
  chat_risk: RiskLevel;
  message: string;
}

// 마이페이지 API 관련 타입들
export interface MyReportSummary {
  report_id: number;
  created_at: string; // ISO 날짜 문자열
  final_risk?: RiskLevel;
  ad8_risk?: RiskLevel;
  chat_risk?: RiskLevel;
  drawing_risk?: RiskLevel;
}
