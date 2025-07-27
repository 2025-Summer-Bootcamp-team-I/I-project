// API 관련 상수
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
  },
  REPORT: {
    CREATE: '/report/create',
    GET: '/report/{id}',
    LIST: '/report/my-reports',
    FINALIZE: '/report/{id}/finalize',
  },
  CHAT: {
    CREATE: '/chat/create',
    SEND: '/chat/send',
    STREAM: '/chat/stream',
    EVALUATE: '/chat/{id}/evaluate',
  },
  AD8: {
    SUBMIT: '/ad8/submit',
  },
  DRAWING: {
    UPLOAD: '/drawing/upload',
  },
} as const;

// 앱 관련 상수
export const APP_CONFIG = {
  NAME: 'YourApp',
  VERSION: '1.0.0',
  DESCRIPTION: 'AI 기반 인지 기능 검사 앱',
} as const;

// 위험도 상수
export const RISK_LEVELS = {
  GOOD: '양호',
  WARNING: '경계',
  DANGER: '위험',
} as const;

// 페이지 경로 상수
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  MAIN: '/main',
  AD8: '/ad8',
  DRAWING: '/drawing',
  CHAT_SELECT: '/chat-select',
  TEXT_CHAT: '/text-chat',
  VOICE_CHAT: '/voice-chat',
  REPORT: '/report',
  MY_PAGE: '/mypage',
} as const; 