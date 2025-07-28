import { create } from 'zustand';
import {
  createChat as apiCreateChat,
  getChatLogs as apiGetChatLogsByReportId,
  getChatLogsByChatId as apiGetChatLogsByChatId,
  streamChat as apiStreamChat,
  evaluateChat as apiEvaluateChat,
} from '../api'; // app/src/api/index.ts를 참조
import type { ChatLogResponse, ChatRequest } from '../types/api'; // app/src/types/api.ts를 참조
import { useReportIdStore } from './reportIdStore'; // app/src/store/reportIdStore.ts를 참조

let isInitializingChat = false; // 이 플래그를 추가합니다.

interface ChatState {
  chatId: number | null;
  messages: ChatLogResponse[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  createChat: (reportId: number) => Promise<number | undefined>;
  loadChatLogsByReportId: (reportId: number) => Promise<void>;
  initializeChatForReport: (reportId: number) => Promise<void>;
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
    set({ isLoading: true, error: null, messages: [] });
    try {
      const response = await apiCreateChat({ report_id: reportId });

      const initialMessage: ChatLogResponse = {
        id: Math.floor(Math.random() * 1_000_000_000),
        chat_id: response.chat_id,
        role: 'ai',
        message: response.message,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      set({
        chatId: response.chat_id,
        messages: [initialMessage],
        isLoading: false,
      });

      useReportIdStore.getState().setChatId(response.chat_id);

      return response.chat_id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create chat';
      set({ error: errorMessage, isLoading: false });
      console.error(errorMessage);
    }
  },

  loadChatLogsByReportId: async (reportId: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiGetChatLogsByReportId(reportId);
      if (response.length > 0) {
        set({ chatId: response[0].chat_id, messages: response, isLoading: false });
      } else {
        set({ messages: [], isLoading: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load chat logs';
      set({ error: errorMessage, isLoading: false });
      console.error(errorMessage);
    }
  },

  initializeChatForReport: async (reportId: number) => {
    // Robust duplicate prevention
    if (isInitializingChat || get().chatId !== null) {
      return;
    }

    isInitializingChat = true; // Set flag
    set({ isLoading: true, error: null, messages: [] });
    try {
      const currentReportChatId = useReportIdStore.getState().chatId;

      if (currentReportChatId) {
        const existingLogs = await apiGetChatLogsByChatId(currentReportChatId);

        if (existingLogs && existingLogs.length > 0) {
          set({
            chatId: currentReportChatId,
            messages: existingLogs,
            isLoading: false,
          });
          return;
        } else {
        }
      }

      // If no existing chat was loaded, create a new one
      await get().createChat(reportId);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize chat';
      set({ error: errorMessage, isLoading: false });
      console.error(`[ChatStore] initializeChatForReport Error:`, errorMessage);
    } finally {
      set({ isLoading: false });
      isInitializingChat = false; // Reset flag
    }
  },

  sendMessage: async (chatRequest: ChatRequest) => {
    set({ isStreaming: true, error: null });

    const currentChatId = get().chatId;
    if (currentChatId === null) {
      set({ error: 'Chat ID is not set. Cannot send message.', isStreaming: false });
      return;
    }

    const userMessage: ChatLogResponse = {
      id: Math.floor(Math.random() * 1_000_000_000),
      chat_id: currentChatId,
      role: 'user',
      message: chatRequest.message,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    get().addMessage(userMessage);

    const aiMessage: ChatLogResponse = {
      id: Math.floor(Math.random() * 1_000_000_000) + 1,
      chat_id: currentChatId,
      role: 'ai',
      message: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    get().addMessage(aiMessage);

    try {
      await apiStreamChat({ ...chatRequest, chat_id: currentChatId }, (data) => {
        const token = data.token;
        if (typeof token === 'string') {
          set((state: ChatState) => {
            const newMessages = state.messages.map((msg) =>
              msg.id === aiMessage.id ? { ...msg, message: msg.message + token } : msg
            );
            return { messages: newMessages };
          });
          
        }
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

  addMessage: (message) => {
    set((state: ChatState) => ({
      messages: [...state.messages, message],
    }));
  },
  
  clearMessages: () => set({ messages: [], chatId: null, error: null }),
}));
