import { create } from 'zustand';

// AD8 테스트 관련 타입 정의
interface AD8Response {
  question_no: number;
  is_correct: boolean;
}

interface AD8TestState {
  responses: AD8Response[];
  score: number;
  isCompleted: boolean;
  
  // 액션
  setResponse: (questionNo: number, isCorrect: boolean) => void;
  resetTest: () => void;
  completeTest: () => void;
}

const useAD8TestStore = create<AD8TestState>((set) => ({
  responses: [],
  score: 0,
  isCompleted: false,

  setResponse: (questionNo, isCorrect) => set((state) => {
    const newResponses = [...state.responses];
    const existingIndex = newResponses.findIndex(r => r.question_no === questionNo);
    
    if (existingIndex >= 0) {
      newResponses[existingIndex] = { question_no: questionNo, is_correct: isCorrect };
    } else {
      newResponses.push({ question_no: questionNo, is_correct: isCorrect });
    }

    return {
      responses: newResponses,
      score: newResponses.filter(r => r.is_correct).length
    };
  }),

  completeTest: () => set({ isCompleted: true }),

  resetTest: () => set({
    responses: [],
    score: 0,
    isCompleted: false
  })
}));

export default useAD8TestStore; 