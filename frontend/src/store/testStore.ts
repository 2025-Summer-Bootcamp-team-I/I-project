import { create } from 'zustand';

interface TestResult {
  ad8Answers: boolean[];
  ad8Score: number;
  conversationScore?: number;
  drawingScore?: number;
  totalScore?: number;
  completedAt?: Date;
}

interface TestStore {
  currentTest: TestResult;
  testHistory: TestResult[];
  setAD8Result: (answers: boolean[]) => void;
  setConversationScore: (score: number) => void;
  setDrawingScore: (score: number) => void;
  completeTest: () => void;
  resetCurrentTest: () => void;
}

const useTestStore = create<TestStore>((set) => ({
  currentTest: {
    ad8Answers: [],
    ad8Score: 0,
  },
  testHistory: [],

  setAD8Result: (answers) => set((state) => ({
    currentTest: {
      ...state.currentTest,
      ad8Answers: answers,
      ad8Score: answers.filter(ans => ans).length
    }
  })),

  setConversationScore: (score) => set((state) => ({
    currentTest: {
      ...state.currentTest,
      conversationScore: score
    }
  })),

  setDrawingScore: (score) => set((state) => ({
    currentTest: {
      ...state.currentTest,
      drawingScore: score
    }
  })),

  completeTest: () => set((state) => {
    const completedTest = {
      ...state.currentTest,
      completedAt: new Date(),
      totalScore: calculateTotalScore(state.currentTest)
    };

    return {
      testHistory: [completedTest, ...state.testHistory],
      currentTest: {
        ad8Answers: [],
        ad8Score: 0
      }
    };
  }),

  resetCurrentTest: () => set({
    currentTest: {
      ad8Answers: [],
      ad8Score: 0
    }
  })
}));

// 총점 계산 함수 (예시)
function calculateTotalScore(test: TestResult): number {
  const ad8Weight = 0.3;
  const conversationWeight = 0.4;
  const drawingWeight = 0.3;

  const ad8Score = ((8 - test.ad8Score) / 8) * 100; // AD8은 점수가 낮을수록 좋음
  const conversationScore = test.conversationScore || 0;
  const drawingScore = test.drawingScore || 0;

  return Math.round(
    (ad8Score * ad8Weight) +
    (conversationScore * conversationWeight) +
    (drawingScore * drawingWeight)
  );
}

export default useTestStore; 