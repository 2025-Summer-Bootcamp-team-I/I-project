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
  ChatResponse,
} from '@shared/types/api';
import { storage } from '../store/reportHistoryStore';

// 환경에 따른 API baseURL 설정
export const getBaseURL = () => {
  // React Native 환경인지 확인
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    // React Native 환경에서는 Android 에뮬레이터용 IP 사용
    return 'http://10.0.2.2:8000';
  }
  
  // 웹 환경에서는 현재 도메인 기반으로 설정
  if (typeof window !== 'undefined') {
    // 개발 환경
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8000';
    }
    // 배포 환경 - 현재 도메인과 같은 포트 사용
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  
  // 기본값
  return 'http://localhost:8000';
};

// axios 인스턴스 생성
const axiosInstance = axios.create({
  baseURL: getBaseURL(),
});

// 요청 인터셉터: 모든 요청에 access_token을 헤더에 추가
axiosInstance.interceptors.request.use(
  (config: any) => {
    const token = storage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// 회원가입 API
export const registerUser = async (userData: RegisterData) => {
  const response = await axiosInstance.post<Message>('/user/signup', userData);
  return response.data;
};

// 로그인 API: 로그인 성공 시 access_token을 반환 (상태 관리는 호출하는 쪽에서 처리)
export const loginUser = async (userData: LoginData) => {
  const response = await axiosInstance.post('/user/login', userData);
  return response.data;
};

// 로그아웃 API: 로그아웃 요청만 처리 (상태 관리는 호출하는 쪽에서 처리)
export const logoutUser = async () => {
  const response = await axiosInstance.post<Message>('/user/logout');
  return response.data;
};

// 사용자 계정 삭제 API: 삭제 요청만 처리 (상태 관리는 호출하는 쪽에서 처리)
export const deleteUser = async () => {
  const response = await axiosInstance.delete<Message>('/user/delete');
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

// 드로잉 테스트 업로드 API (React Native에서는 파일 업로드 방식이 다를 수 있음)
export const uploadDrawingTest = async (reportId: number, file: any) => {
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

// 채팅 생성 API
export const createChat = async (chatData: CreateChatRequest) => {
  const response = await axiosInstance.post<CreateChatResponse>('/chat/create', chatData);
  return response.data;
};

// 채팅 로그 조회 API
export const getChatLogs = async (reportId: number) => {
  const response = await axiosInstance.get<ChatLogResponse[]>(`/chat/logs/${reportId}`);
  return response.data;
};

// 채팅 ID로 로그 조회 API
export const getChatLogsByChatId = async (chatId: number) => {
  const response = await axiosInstance.get<ChatLogResponse[]>(`/chat/logs/${chatId}`);
  return response.data;
};

// 스트림 채팅 API (React Native에서는 다르게 구현될 수 있음)
export const streamChat = async (chatRequest: ChatRequest, onData: (data: any) => void) => {
  try {
    const response = await fetch(`${getBaseURL()}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${storage.getItem('access_token')}`,
      },
      body: JSON.stringify(chatRequest),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is null');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            return;
          }
          try {
            const parsed = JSON.parse(data);
            onData(parsed);
          } catch (e) {
            console.error('Failed to parse SSE data:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('Stream chat error:', error);
    throw error;
  }
};

// 채팅 평가 API
export const evaluateChat = async (chatId: number, reportId: number) => {
  const response = await axiosInstance.post<EvaluateChatResponse>(
    `/chat/chats/${chatId}/evaluate`,
    null, // 요청 본문은 비워둡니다.
    { params: { report_id: reportId } } // report_id를 쿼리 매개변수로 전달합니다.
  );
  return response.data;
};

// 리포트 최종화 API
export const finalizeReport = async (reportId: number) => {
  const response = await axiosInstance.put(`/reports/${reportId}/finalize`);
  return response.data;
};

// 음성-텍스트 변환 API (React Native에서는 파일 처리 방식이 다를 수 있음)
export const speechToText = async (file: any) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axiosInstance.post<{ text: string }>('/stt', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// 텍스트-음성 변환 API
export const textToSpeech = async (text: string): Promise<Blob> => {
  const response = await axiosInstance.post('/tts', { text }, { responseType: 'blob' });
  return response.data;
};

// 채팅 요청 전송 API
export const sendChatRequest = async (chatRequest: ChatRequest) => {
  const response = await axiosInstance.post<ChatResponse>('/chat', chatRequest);
  return response.data;
};

// 마이페이지 - 사용자의 모든 리포트 목록 조회 API
export const getMyReports = async () => {
  try {
    const response = await axiosInstance.get<MyReportSummary[]>('/mypage/reports');
    return response.data;
  } catch (error) {
    console.error('Error getting my reports:', error);
    throw error;
  }
}; 