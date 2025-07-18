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
}

export interface ReportCreate {
  user_id: number;
  drawingtest_result?: string;
  chat_result?: string;
  ad8test_result?: string;
  soundtest_result?: string;
  final_result?: string;
  recommendation?: string;
  total_score?: number;
  sound_score?: number;
  ad8_score?: number;
  drawing_score?: number;
  text_score?: number;
  memory_score?: number;
  time_space_score?: number;
  judgment_score?: number;
  visual_score?: number;
  language_score?: number;
}

export interface ReportResponse {
  report_id: number;
  user_id: number;
  drawingtest_result: string;
  chat_result: string;
  ad8test_result: string;
  soundtest_result: string;
  recommendation: string;
  total_score: number;
}