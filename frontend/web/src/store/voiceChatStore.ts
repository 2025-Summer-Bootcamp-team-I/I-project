import { create } from 'zustand';
import {
  createChat as apiCreateChat,
  getChatLogsByChatId as apiGetChatLogs,
  evaluateChat as apiEvaluateChat,
  startVoiceChat,
  getVoiceChatResult,
} from '../api';
import type { ChatLogResponse } from '../types/api';

const POLLING_INTERVAL = 2000;

interface VoiceChatState {
  chatId: number | null;
  messages: ChatLogResponse[];
  isLoading: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  error: string | null;
  createChat: (reportId: number) => Promise<number | undefined>;
  sendVoiceMessage: (request: {
    reportId: number;
    chatId: number;
    audioFile: File;
  }) => Promise<{ aiMessageText: string; audioBlob: Blob } | null>;
  evaluateChat: (chatId: number, reportId: number) => Promise<void>;
  loadLatestLogs: (chatId: number) => Promise<void>;
  clearMessages: () => void;
  setRecording: (isRecording: boolean) => void;
}

export const useVoiceChatStore = create<VoiceChatState>((set) => ({
  chatId: null,
  messages: [],
  isLoading: false,
  isRecording: false,
  isProcessing: false,
  error: null,

  setRecording: (isRecording: boolean) => set({ isRecording }),

  createChat: async (reportId: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiCreateChat({ report_id: reportId });
      const initialMessage: ChatLogResponse = {
        id: Date.now(),
        chat_id: response.chat_id,
        role: 'ai',
        message: response.message,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      set({ chatId: response.chat_id, messages: [initialMessage], isLoading: false });
      return response.chat_id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create chat';
      set({ error: errorMessage, isLoading: false });
      console.error(errorMessage);
      return undefined;
    }
  },

  sendVoiceMessage: async ({ reportId, chatId, audioFile }) => {
    set({ isProcessing: true, error: null });
    try {
      const { task_id } = await startVoiceChat(reportId, chatId, audioFile);

      return new Promise((resolve, reject) => {
        const intervalId = setInterval(async () => {
          try {
            const result = await getVoiceChatResult(task_id);

            if (result.status === 'SUCCESS') {
              clearInterval(intervalId);
              const taskResult = result.result;

              const aiMessageText = taskResult.ai_response_text;
              const audioBlob = new Blob([new Uint8Array(atob(taskResult.audio_content_base64).split('').map(char => char.charCodeAt(0)))], { type: 'audio/mpeg' });

              set({ isProcessing: false });
              resolve({ aiMessageText, audioBlob });

            } else if (result.status === 'FAILURE' || result.status === 'REVOKED') {
              clearInterval(intervalId);
              const errorMsg = 'Voice processing failed on the server.';
              set({ isProcessing: false, error: errorMsg });
              reject(new Error(errorMsg));
            }
          } catch (pollError) {
            clearInterval(intervalId);
            const errorMsg = 'Failed to get voice chat result.';
            set({ isProcessing: false, error: errorMsg });
            reject(pollError);
          }
        }, POLLING_INTERVAL);
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send voice message';
      set({ isProcessing: false, error: errorMessage });
      console.error(errorMessage);
      return null;
    }
  },

  loadLatestLogs: async (chatId: number) => {
    try {
      const response = await apiGetChatLogs(chatId);
      // 서버에서 받은 순서대로 정렬하여 상태 업데이트
      const sortedMessages = response.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      set({ messages: sortedMessages });
    } catch (error) {
      console.error('Failed to load latest chat logs', error);
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

  clearMessages: () => set({ messages: [], chatId: null, error: null }),
}));