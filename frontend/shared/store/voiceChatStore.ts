import { create } from 'zustand';
import {
  createChat as apiCreateChat,
  getChatLogs as apiGetChatLogs,
  evaluateChat as apiEvaluateChat,
  sendChatRequest,
} from '../api';
import type { ChatLogResponse, ChatRequest, ChatResponse } from '../types/api';

interface VoiceChatState {
  chatId: number | null;
  messages: ChatLogResponse[];
  isLoading: boolean;
  error: string | null;
  createChat: (reportId: number) => Promise<number | undefined>;
  loadChatLogs: (chatId: number) => Promise<void>;
  sendMessage: (chatRequest: ChatRequest) => Promise<string>; // AI 응답 텍스트를 반환하도록 변경
  evaluateChat: (chatId: number, reportId: number) => Promise<void>;
  addMessage: (message: ChatLogResponse) => void;
  clearMessages: () => void;
}

export const useVoiceChatStore = create<VoiceChatState>((set, get) => ({
  chatId: null,
  messages: [],
  isLoading: false,
  error: null,

  createChat: async (reportId: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiCreateChat({ report_id: reportId });
      set({ chatId: response.chat_id, isLoading: false });
      await get().loadChatLogs(response.chat_id);
      return response.chat_id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create chat';
      set({ error: errorMessage, isLoading: false });
      console.error(errorMessage);
    }
  },

  loadChatLogs: async (chatId: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiGetChatLogs(chatId);
      set({ messages: response, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load chat logs';
      set({ error: errorMessage, isLoading: false });
      console.error(errorMessage);
    }
  },

  sendMessage: async (chatRequest: ChatRequest) => {
    set({ isLoading: true, error: null });

    // 사용자의 메시지를 화면에 출력하지 않으므로, messages 배열에 추가하지 않습니다.
    // const userMessage: ChatLogResponse = {
    //   id: Math.floor(Math.random() * 1_000_000_000),
    //   chat_id: chatRequest.chat_id,
    //   role: 'user',
    //   message: chatRequest.message,
    //   created_at: new Date().toISOString(),
    //   updated_at: new Date().toISOString(),
    // };
    // get().addMessage(userMessage);

    try {
      const response: ChatResponse = await sendChatRequest(chatRequest);
      set({ isLoading: false }); // 응답을 받았으므로 로딩 상태 해제
      return response.response; // AI 응답 텍스트 반환
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      set({ error: errorMessage, isLoading: false });
      console.error(errorMessage);
      throw error; // 에러를 다시 throw하여 호출자에게 알림
    }
  },

  evaluateChat: async (chatId: number, reportId: number) => {
    set({ isLoading: true, error: null });
    try {
      await apiEvaluateChat(chatId, reportId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to evaluate chat';
      set({ error: errorMessage, isLoading: false });
      console.error(errorMessage);
    } finally {
      set({ isLoading: false });
    }
  },

  addMessage: (message: ChatLogResponse) => {
    set((state) => ({ messages: [...state.messages, message] }));
  },

  clearMessages: () => set({ messages: [], chatId: null, error: null }),
}));