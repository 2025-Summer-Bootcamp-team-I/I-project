import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NeuralBackground from '../components/Background';
import Header from '../components/Header';
import useAD8TestStore from '../store/testStore';
import styled from 'styled-components';

const AD8Page = () => {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [showResult, setShowResult] = useState(false);
  const { setResponse, completeTest } = useAD8TestStore();

  const questions = [
    "판단력에 문제가 생겼습니까?",
    "어떤 일에 대한 흥미가 줄었습니까?",
    "같은 질문이나 이야기를 반복합니까?",
    "새로운 것을 배우는 데 어려움이 있습니까?",
    "오늘이 몇 월 며칠인지 잘 모릅니까?",
    "재정 문제를 처리하는 데 어려움이 있습니까?",
    "약속을 기억하는 데 어려움이 있습니까?",
    "생각이나 기억력에 매일 어려움을 겪습니까?"
  ];

  const handleAnswer = (answer: boolean) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    // 현재 질문에 대한 응답을 저장
    setResponse(currentQuestionIndex + 1, answer);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      completeTest();
      setShowResult(true);
    }
  };

  const score = answers.filter(ans => ans).length;

  return (
    <Container>
      <NeuralBackground />
      <Header />
      <Content>
        <BackButton onClick={() => navigate('/main')} aria-label="뒤로가기">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </BackButton>
        <Title>AD-8 설문 검사</Title>
        <Subtitle>최근 1년 동안의 변화에 해당되면 '예'를 선택해주세요.</Subtitle>

        {!showResult ? (
          <>
            <ProgressContainer>
              <ProgressLabel>진행도</ProgressLabel>
              <ProgressBar>
                <Progress progress={(currentQuestionIndex / questions.length) * 100} />
              </ProgressBar>
            </ProgressContainer>
            <QuestionCard>
              <QuestionNumber>질문 {currentQuestionIndex + 1}/{questions.length}</QuestionNumber>
              <Question>{questions[currentQuestionIndex]}</Question>
              <ButtonContainer>
                <AnswerButton onClick={() => handleAnswer(true)}>예</AnswerButton>
                <AnswerButton onClick={() => handleAnswer(false)}>아니오</AnswerButton>
              </ButtonContainer>
            </QuestionCard>
          </>
        ) : (
          <ResultCard>
            <ResultTitle>검사가 완료되었습니다.</ResultTitle>
            <ResultScore>당신의 점수는 <Score>{score}점</Score> 입니다.</ResultScore>
            <ResultMessage $good={score < 2}>
              {score >= 2
                ? "인지 기능 저하가 의심됩니다. 전문가와 상담을 권장합니다."
                : "현재 인지 기능은 양호한 것으로 보입니다."}
            </ResultMessage>
            <HomeButton onClick={() => navigate('/main')}>메인으로 돌아가기</HomeButton>
          </ResultCard>
        )}
      </Content>
    </Container>
  );
};

export default AD8Page;

// --- styled-components ---

const Container = styled.div`
  position: relative;
  min-height: 100vh;
  background: transparent;
  color: white;
  overflow: hidden;
`;

const Content = styled.main`
  position: relative;
  padding: 5.5rem 1.2rem 1.2rem;
  max-width: 550px;    
  margin: 0 auto;
  width: 100%;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const BackButton = styled.button`
  position: absolute;
  top: 7rem;
  left: 0rem;
  background: #131828;
  border: none;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  cursor: pointer;
  outline: none;
  z-index: 100;
  border-radius: 50%;
  width: 48px;
  height: 48px;

  @media (min-width: 1024px) {
    left: -5rem;
  }

  @media (min-width: 1200px) {
    left: -8rem;
  }

  @media (min-width: 1440px) {
    left: -15rem;
  }

  &:hover {
    background: #1a2235;
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #96E7D4;
  margin: 0 0 0.8rem;
  text-align: center;  // 중앙 정렬
  letter-spacing: -1.2px;
  font-weight: 800;
`;

const Subtitle = styled.p`
  color: #94a3b8;
  text-align: center;  // 중앙 정렬
  margin-bottom: 2.3rem;
  font-size: 1.16rem;
`;

const ProgressContainer = styled.div`
  margin-bottom: 2.6rem;
  width: 100%;  // 전체 너비 사용
  padding: 0;   // 패딩 제거
`;

const ProgressLabel = styled.div`
  color: #94a3b8;
  margin-bottom: 0.6rem;
  font-size: 0.9rem;
  margin-left: 0.2rem;
`;

const ProgressBar = styled.div`
  width: 100%;
  background: rgba(148, 163, 184, 0.15);
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
`;

const Progress = styled.div<{ progress: number }>`
  width: ${props => props.progress}%;
  height: 6px;
  background: #96E7D4;
  border-radius: 3px;
  transition: width 0.3s ease;
`;

const QuestionCard = styled.div`
  position: relative;
  background: #131828;
  border-radius: 1.5rem;
  padding: 2.5rem 2rem;
  backdrop-filter: blur(22px);
  border: 1.7px solid #96E7D422;
  box-shadow: 0 2px 38px 0 #96e7d410;
  margin: 0 auto;  // 중앙 정렬
  width: 100%;
`;

const QuestionNumber = styled.div`
  color: #96E7D4;
  margin-bottom: 1.2rem;
  text-align: center;
  font-size: 1.1rem;
`;

const Question = styled.h2`
  font-size: 1.8rem;
  text-align: center;
  margin-bottom: 2.2rem;
  color: #fff;
  font-weight: 600;
  letter-spacing: -0.5px;
  line-height: 1.4;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin-top: 2.5rem;
`;

const AnswerButton = styled.button`
  flex: 1;
  background: #253741;
  border: none;
  color: #B9F3E4;
  font-weight: 600;
  padding: 0.8rem 0;
  border-radius: 999px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  max-width: 140px;

  &:hover {
    background: #2f4450;
  }
`;

const ResultCard = styled(QuestionCard)`
  text-align: center;
  padding: 3rem 2rem;
`;

const ResultTitle = styled.h2`
  font-size: 2rem;
  color: #fff;
  margin-bottom: 1.5rem;
  font-weight: 700;
`;

const ResultScore = styled.p`
  font-size: 1.3rem;
  color: #94a3b8;
  margin-bottom: 1rem;
`;

const Score = styled.span`
  color: #96E7D4;
  font-weight: 700;
`;

const ResultMessage = styled.p<{ $good: boolean }>`
  font-size: 1.2rem;
  color: ${props => props.$good ? '#96E7D4' : '#f87171'};
  margin-bottom: 2rem;
  line-height: 1.5;
`;

const HomeButton = styled.button`
  background: #96E7D4;
  border: none;
  color: #131828;
  font-weight: 600;
  padding: 1rem 2rem;
  border-radius: 999px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 2rem;

  &:hover {
    background: #7fcebb;
  }
`;
