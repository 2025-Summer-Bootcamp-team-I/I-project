// API 관련 유틸리티
export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:8000';
  }
  return 'https://your-ec2-domain.com'; // 프로덕션 URL
};

// 토큰 관련 유틸리티
export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
};

export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', token);
  }
};

export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
  }
};

// 날짜 포맷팅 유틸리티
export const formatDate = (date: string | Date) => {
  const d = new Date(date);
  return d.toLocaleDateString('ko-KR');
};

export const formatDateTime = (date: string | Date) => {
  const d = new Date(date);
  return d.toLocaleString('ko-KR');
}; 