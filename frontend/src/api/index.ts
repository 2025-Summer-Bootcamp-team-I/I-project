import axios from 'axios';
import type { LoginData, RegisterData, Message, AD8Request, AD8Result, ReportCreate, ReportResponse } from '../types/api.ts';

//axios 인스턴스 생성
const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000',
});

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

// 로그인 API
export const loginUser = async (userData: LoginData) => {
  try {
    const response = await axiosInstance.post('/user/login', userData);
    return response.data;
  } catch (error) {
    console.error('Error logging in user:', error);
    throw error;
  }
};

// 로그아웃 API
export const logoutUser = async () => {
  try {
    const response = await axiosInstance.post<Message>('/user/logout');
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
export const createEmptyReport = async (reportData: ReportCreate) => {
  try {
    const response = await axiosInstance.post<ReportResponse>('/reports/empty', reportData);
    return response.data;
  } catch (error) {
    console.error('Error creating empty report:', error);
    throw error;
  }
};
