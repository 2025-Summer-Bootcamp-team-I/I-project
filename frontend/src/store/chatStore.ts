import { create } from 'zustand';

interface Message {
  text: string;
  sender: 'ai' | 'user';
}

interface ChatState {
  isListening: boolean;
  messages: Message[];
  inputMessage: string;
  toggleListening: () => void;
  addMessage: (message: Message) => void;
  setInputMessage: (message: string) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  isListening: false,
  messages: [],
  inputMessage: '',
  toggleListening: () => set((state) => ({ isListening: !state.isListening })),
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),
  setInputMessage: (message) => set({ inputMessage: message }),
  clearMessages: () => set({ messages: [] }),
}));
