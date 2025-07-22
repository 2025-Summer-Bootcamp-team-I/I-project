import axios from 'axios';
import type {
  LoginData,
  RegisterData,
  Message,
  AD8Request,
  AD8Result,
  ReportResponse,
  DrawingTestResult,
  EmptyReportCreate,
  SimpleReportResponse,
  MyReportSummary,
  CreateChatRequest,
  CreateChatResponse,
  ChatRequest,
  ChatLogResponse,
  EvaluateChatResponse,
} from '../types/api';

// axios 인스턴스 생성
const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000',
});

// 요청 인터셉터: 모든 요청에 access_token을 헤더에 추가
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 회원가입 API
export const registerUser = async (userData: RegisterData) => {
  const response = await axiosInstance.post<Message>('/user/signup', userData);
  return response.data;
};

// 로그인 API: 로그인 성공 시 access_token을 localStorage에 저장
export const loginUser = async (userData: LoginData) => {
  const response = await axiosInstance.post('/user/login', userData);
  if (response.data.access_token) {
    localStorage.setItem('access_token', response.data.access_token);
  }
  return response.data;
};

// 로그아웃 API: 로그아웃 시 localStorage에서 access_token 제거
export const logoutUser = async () => {
  const response = await axiosInstance.post<Message>('/user/logout');
  localStorage.removeItem('access_token');
  return response.data;
};

// 사용자 계정 삭제 API
export const deleteUser = async () => {
  const response = await axiosInstance.delete<Message>('/user/delete');
  localStorage.removeItem('access_token');
  return response.data;
};

// AD8 설문 결과 제출 API
export const submitAD8 = async (ad8Data: AD8Request) => {
  const response = await axiosInstance.post<AD8Result>('/ad8', ad8Data);
  return response.data;
};

// 빈 리포트 생성 API
export const createEmptyReport = async (reportData: EmptyReportCreate) => {
  const response = await axiosInstance.post<SimpleReportResponse>('/reports/empty', reportData);
  return response.data;
};

// 드로잉 테스트 업로드 API
export const uploadDrawingTest = async (reportId: number, file: File) => {
  const formData = new FormData();
  formData.append('reportId', reportId.toString());
  formData.append('file', file);

  const response = await axiosInstance.post<DrawingTestResult>('/drawing', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// 리포트 결과 조회 API
export const getReportResult = async (reportId: number) => {
  const response = await axiosInstance.get<ReportResponse>(`/reports/${reportId}`);
  return response.data;
};

// 마이페이지 리포트 목록 조회 API
export const getMyReports = async () => {
  const response = await axiosInstance.get<MyReportSummary[]>('/mypage/reports');
  return response.data;
};

// 채팅방 생성 API
export const createChat = async (chatData: CreateChatRequest) => {
  const response = await axiosInstance.post<CreateChatResponse>('/chat/create', chatData);
  return response.data;
};

// 채팅 로그 조회 API
export const getChatLogs = async (chatId: number) => {
  const response = await axiosInstance.get<ChatLogResponse[]>(`/chat/logs/${chatId}`);
  return response.data;
};

// 채팅 스트리밍 API
export const streamChat = async (chatRequest: ChatRequest, onData: (data: string) => void) => {
  const response = await fetch(`${axiosInstance.defaults.baseURL}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    },
    body: JSON.stringify(chatRequest),
  });

  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      console.log("Raw chunk:", chunk); // 진단용 로그 추가
      // SSE 데이터 형식(data: ...\n\n)을 파싱
      const lines = chunk.split('\n\n').filter(line => line.startsWith('data:'));
      console.log("Parsed lines:", lines); // 진단용 로그 추가
      for (const line of lines) {
        console.log("Parsed line:", line); // 진단용 로그 추가
        const data = line.substring(5).trim();
        console.log("Extracted data:", data); // 진단용 로그 추가
        onData(data);
      }
    }
  } finally {
    reader.releaseLock();
  }
};


// 채팅 평가 및 결과 저장 API
export const evaluateChat = async (chatId: number, reportId: number) => {
  const response = await axiosInstance.post<EvaluateChatResponse>(`/chat/chats/${chatId}/evaluate`, { report_id: reportId });
  return response.data;
};

// STT API
export const speechToText = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axiosInstance.post<{ text: string }>('/stt', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// TTS API
export const textToSpeech = async (text: string): Promise<Blob> => {
  const response = await axiosInstance.post('/tts', { text }, { responseType: 'blob' });
  return response.data;
};