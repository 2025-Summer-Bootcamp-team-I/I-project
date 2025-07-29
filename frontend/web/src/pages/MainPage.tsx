// src/pages/MainPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import NeuralBackground from '../components/Background';
import Header from "../components/Header";
import { useNavigate, useLocation } from "react-router-dom";
import { useReportIdStore } from "../store/reportIdStore";
import { createEmptyReport } from "../api";


const TitleContainer = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  margin-top: -1rem;
`;

const MainTitle = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  margin: 0;
  color: #fff;
  margin-top: -1rem;
`;

const SubTitle = styled.p`
  color: #9ca3af;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  margin-bottom: 0;
`;

const MainContainer = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
`;

const ContentOverlay = styled.div`
  position: relative;
  z-index: 1;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
  padding: 2rem 1rem;
  box-sizing: border-box;
`;

const CardSliderContainer = styled.div`
  width: 100%;
  max-width: 38rem;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 1500px;
  position: relative;
  margin-top: 0.2rem;
`;

const CardContainer = styled.div`
  min-width: 26rem;
  max-width: 26rem;
  height: 22rem;
  position: relative;
  transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);
  transform-style: preserve-3d;
  display: flex;
  justify-content: center;
`;

const GlassCard = styled.div<{ isActive: boolean; index: number; currentIndex: number; isHovered: boolean }>`
  background: rgba(17, 24, 39, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.5rem;
  padding: 2.2rem 2rem 1.5rem 2rem;
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  gap: 1.2rem;
  transition: all 0.3s ease;
  transform-style: preserve-3d;
  transform: ${({ index, currentIndex, isHovered }) => {
    const dx = (index - currentIndex) * 100;
    const scale = 1 - Math.abs(index - currentIndex) * 0.32;
    const ty = index !== currentIndex ? 'translateY(2.2rem)' : '';
    const hover = isHovered ? 'rotateX(var(--rotate-x, 0deg)) rotateY(var(--rotate-y, 0deg))' : '';
    return `translateX(${dx}%) scale(${scale}) ${ty} ${hover}`;
  }};
  opacity: ${(props: any) => 1 - Math.abs(props.index - props.currentIndex) * 0.5};
  z-index: ${(props: any) => 4 - Math.abs(props.index - props.currentIndex)};

  &:hover {
    transform: ${({ index, currentIndex, isHovered }) => {
      const dx = (index - currentIndex) * 100;
      const scale = 1 - Math.abs(index - currentIndex) * 0.32 + 0.02;
      const ty = index !== currentIndex ? 'translateY(2.2rem)' : '';
      const hover = isHovered ? 'rotateX(var(--rotate-x, 0deg)) rotateY(var(--rotate-y, 0deg))' : '';
      return `translateX(${dx}%) scale(${scale}) ${ty} ${hover}`;
    }};
  }
`;

const CardInnerGlow = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 1rem;
  pointer-events: none;
  background: radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(196, 181, 253, 0.1), transparent 40%);
  opacity: 0;
  transition: opacity 0.3s ease-out;

  ${GlassCard}:hover & {
    opacity: 1;
  }
`;

const NavArrow = styled.button`
  background: rgba(17, 24, 39, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  padding: 0.6rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  z-index: 10;
  color: #fff;
  margin-top: 3.5rem;
  margin-right: 3rem;
  margin-left: 3rem;
  &:hover {
    background: rgba(17, 24, 39, 1);
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: none;
  }
  &:focus {
    outline: none;
    box-shadow: none;
  }
  svg {
    width: 1.7rem;
    height: 1.7rem;
    margin: auto;
  }
`;

const StartTestButton = styled.button`
  background: #8b5cf6;
  color: white;
  font-weight: bold;
  padding: 0.7rem 2.2rem;
  border-radius: 9999px;
  transition: all 0.3s ease;
  z-index: 10;
  position: relative;
  margin-top: -1.2rem;
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
  min-width: 10rem;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background: #7c3aed;
  }
  .button-text {
    font-size: 1.1rem;
  }
`;



const IconContainer = styled.div`
  width: 3.2rem;
  height: 3.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  background: rgba(0, 0, 0, 0.2);
  position: absolute;
  left: 2.2rem;
  top: 2.5rem;
`;

const StepLabel = styled.span`
  color: #c4b5fd;
  font-size: 1.1rem;
  font-weight: 600;
  display: block;
  margin-bottom: 1.2rem;
  margin-top: 1.2rem;
`;

const CardTitle = styled.h2`
  color: white;
  font-size: 2rem;
  font-weight: bold;
  margin: 0.2rem 0 1.2rem 0;
`;

const CardDescription = styled.p`
  color: #9ca3af;
  line-height: 1.5;
  font-size: 1.1rem;
  margin: 0 0 3.5rem 0;
`;

const CardContent = styled.div`
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const dashboardData = [
  {
    id: 'survey',
    step: 1,
    title: '설문 검사',
    description: '일상 생활에서의 변화를 확인하는 8가지 질문으로 인지 기능 저하를 선별합니다.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="#C4B5FD" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
      </svg>
    )
  },
  {
    id: 'conversation',
    step: 2,
    title: '대화 검사',
    description: 'AI와의 자연스러운 대화를 통해 언어 능력, 기억력, 실행 능력을 평가합니다.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="#C4B5FD" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
      </svg>
    )
  },
  {
    id: 'drawing',
    step: 3,
    title: '그림 검사',
    description: '시계를 그리는 과정을 분석하여 시공간 능력 및 실행 기능을 정밀하게 진단합니다.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="#C4B5FD" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
      </svg>
    )
  },
  {
    id: 'report',
    step: 'Final',
    title: '최종 분석 리포트',
    description: '모든 검사 결과를 종합하여 AI가 생성한 맞춤형 인지 건강 리포트를 확인합니다.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="#C4B5FD" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
      </svg>
    )
  }
];

const MainPage = () => {
  const location = useLocation();
  const initialIndex = location.state?.cardIndex ?? 0;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const navigate = useNavigate();
  const resetReportId = useReportIdStore((state) => state.resetReportId);

  useEffect(() => {
    if (location.state?.needsReset) {
      resetReportId();
      const { needsReset, ...restState } = location.state;
      navigate(location.pathname, { replace: true, state: restState });
    }
  }, [location, resetReportId, navigate]);

  const handleNext = () => {
    setCurrentIndex((prev: number) => (prev + 1) % dashboardData.length);
    setHoveredCard(null); // 카드 변경 시 호버 상태 리셋
  };

  const handlePrev = () => {
    setCurrentIndex((prev: number) => (prev - 1 + dashboardData.length) % dashboardData.length);
    setHoveredCard(null); // 카드 변경 시 호버 상태 리셋
  };

  const handleStartTest = async (testId: string) => {
    const { reportId, isAD8Completed, isDrawingCompleted, setReportId } = useReportIdStore.getState();

    if (testId === 'survey') {
      if (isAD8Completed) {
        alert("이미 AD8 검사를 완료하셨습니다.");
        return;
      }
      if (!reportId) {
        try {
          const reportResponse = await createEmptyReport({});
          setReportId(reportResponse.report_id);
          console.log("빈 리포트 생성 성공:", reportResponse);
        } catch (error) {
          alert("리포트 생성에 실패했습니다. 다시 시도해주세요.");
          console.error("리포트 생성 에러:", error);
          return;
        }
      }
      navigate('/ad8');
    } else if (testId === 'conversation') {
      const { isChatCompleted } = useReportIdStore.getState();
      if (isChatCompleted) {
        alert("이미 대화 검사를 완료하셨습니다.");
        return;
      }
      navigate('/chatting-select');
    } else if (testId === 'drawing') {
      if (isDrawingCompleted) {
        alert("이미 그림 검사를 완료하셨습니다.");
        return;
      }
      navigate('/drawing');
    } else {
      navigate('/report');
    }
  };

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 20;
    const rotateY = -(x - centerX) / 20;
    
    // CSS 변수를 사용하여 transform 적용
    card.style.setProperty('--rotate-x', `${rotateX}deg`);
    card.style.setProperty('--rotate-y', `${rotateY}deg`);
    
    const glow = card.querySelector('[data-glow]') as HTMLElement;
    if (glow) {
      glow.style.setProperty('--mouse-x', `${x}px`);
      glow.style.setProperty('--mouse-y', `${y}px`);
    }
  };

  const handleCardMouseEnter = (cardIndex: number) => {
    setHoveredCard(cardIndex);
  };

  const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    // CSS 변수 리셋
    card.style.removeProperty('--rotate-x');
    card.style.removeProperty('--rotate-y');
    setHoveredCard(null);
  };

  // 카드 변경 시 모든 카드의 transform 상태 리셋
  useEffect(() => {
    cardRefs.current.forEach((cardRef) => {
      if (cardRef) {
        cardRef.style.removeProperty('--rotate-x');
        cardRef.style.removeProperty('--rotate-y');
      }
    });
  }, [currentIndex]);

  return (
    <MainContainer>
      <NeuralBackground />
      <Header />
      <ContentOverlay>
        <TitleContainer>
          <MainTitle>기억 건강 진단 프로그램</MainTitle>
          <SubTitle>체계적인 4단계 검사를 통해 당신의 인지 건강을 정밀하게 분석합니다.</SubTitle>
        </TitleContainer>
        
        <CardSliderContainer>
          <NavArrow onClick={handlePrev} aria-label="이전">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </NavArrow>
          <CardContainer>
            {dashboardData.map((item, index) => (
              <GlassCard
                key={item.id}
                ref={(el) => (cardRefs.current[index] = el)}
                isActive={index === currentIndex}
                index={index}
                currentIndex={currentIndex}
                isHovered={hoveredCard === index}
                onMouseEnter={() => handleCardMouseEnter(index)}
                onMouseMove={(e) => handleCardMouseMove(e)}
                onMouseLeave={(e) => handleCardMouseLeave(e)}
              >
                <CardInnerGlow data-glow />
                <IconContainer>{item.icon}</IconContainer>
                <CardContent>
                  <StepLabel>Step {item.step}</StepLabel>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardContent>
                <StartTestButton onClick={() => handleStartTest(item.id)}>
                  <span className="button-text">검사 시작</span>
                </StartTestButton>
              </GlassCard>
            ))}
          </CardContainer>
          <NavArrow onClick={handleNext} aria-label="다음">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </NavArrow>
        </CardSliderContainer>

      </ContentOverlay>
    </MainContainer>
  );
};

export default MainPage;
