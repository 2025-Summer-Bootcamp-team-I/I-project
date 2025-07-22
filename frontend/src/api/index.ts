import axios from 'axios';
import type { LoginData, RegisterData, Message, AD8Request, AD8Result, ReportResponse, DrawingTestResult } from '../types/api.ts';

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
  try {
    const response = await axiosInstance.post('/user/signup', userData);
    return response.data;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

// 로그인 API: 로그인 성공 시 access_token을 localStorage에 저장
export const loginUser = async (userData: LoginData) => {
  try {
    const response = await axiosInstance.post('/user/login', userData);
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    return response.data;
  } catch (error) {
    console.error('Error logging in user:', error);
    throw error;
  }
};

// 로그아웃 API: 로그아웃 시 localStorage에서 access_token 제거
export const logoutUser = async () => {
  try {
    const response = await axiosInstance.post<Message>('/user/logout');
    localStorage.removeItem('access_token');
    return response.data;
  } catch (error) {
    console.error('Error logging out user:', error);
    throw error;
  }
};

// 사용자 계정 삭제 API
export const deleteUser = async () => {
  try {
    const response = await axiosInstance.delete<Message>('/user/delete');
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// AD8 설문 결과 제출 API
export const submitAD8 = async (ad8Data: AD8Request) => {
  try {
    const response = await axiosInstance.post<AD8Result>('/ad8', ad8Data);
    return response.data;
  } catch (error) {
    console.error('Error submitting AD8:', error);
    throw error;
  }
};

// 빈 리포트 생성 API
export const createEmptyReport = async () => {
  try {
    const response = await axiosInstance.post<ReportResponse>('/reports/empty');
    return response.data;
  } catch (error) {
    console.error('Error creating empty report:', error);
    throw error;
  }
};

// 드로잉 테스트 업로드 API
export const uploadDrawingTest = async (reportId: number, file: File) => {
  try {
    const formData = new FormData();
    formData.append('reportId', reportId.toString());
    formData.append('file', file);

    const response = await axiosInstance.post<DrawingTestResult>('/drawing', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading drawing test:', error);
    throw error;
  }
};

// STT API
export const speechToText = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post<{ text: string }>('/stt', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error with STT API:', error);
    throw error;
  }
};

// TTS API
export const textToSpeech = async (text: string): Promise<Blob> => {
  try {
    const response = await axiosInstance.post('/tts', { text }, { responseType: 'blob' });
    return response.data;
  } catch (error) {
    console.error('Error with TTS API:', error);
    throw error;
  }
};

// 리포트 결과 조회 API
export const getReportResult = async (reportId: number) => {
  try {
    const response = await axiosInstance.get<ReportResponse>(`/reports/${reportId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting report result:', error);
    throw error;
  }
};

