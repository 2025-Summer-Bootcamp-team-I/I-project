import { create } from 'zustand';
import {
  createChat as apiCreateChat,
  getChatLogs as apiGetChatLogs,
  streamChat as apiStreamChat,
  evaluateChat as apiEvaluateChat,
} from '../api';
import type { ChatLogResponse, ChatRequest } from '../types/api';

interface ChatState {
  chatId: number | null;
  messages: ChatLogResponse[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  createChat: (reportId: number) => Promise<number | undefined>;
  loadChatLogs: (chatId: number) => Promise<void>;
  sendMessage: (chatRequest: ChatRequest) => Promise<void>;
  evaluateChat: (chatId: number, reportId: number) => Promise<void>;
  addMessage: (message: ChatLogResponse) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chatId: null,
  messages: [],
  isLoading: false,
  isStreaming: false,
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
    set({ isStreaming: true, error: null });

    const userMessage: ChatLogResponse = {
      id: Date.now(),
      chat_id: chatRequest.chat_id,
      role: 'user',
      message: chatRequest.message,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    get().addMessage(userMessage);

    const aiMessage: ChatLogResponse = {
      id: Date.now() + 1,
      chat_id: chatRequest.chat_id,
      role: 'ai',
      message: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    get().addMessage(aiMessage);

    try {
      await apiStreamChat(chatRequest, (chunk) => {
        console.log("Received chunk:", chunk); // 진단용 로그 추가
        set((state) => {
          const newMessages = state.messages.map((msg) =>
            msg.id === aiMessage.id ? { ...msg, message: msg.message + chunk } : msg
          );
          console.log("Updated messages state:", newMessages); // 진단용 로그 추가
          return { messages: newMessages };
        });
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      set({ error: errorMessage });
      console.error(errorMessage);
    } finally {
      set({ isStreaming: false });
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