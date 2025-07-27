import styled, { keyframes } from 'styled-components';
import LoginBackground from "@shared/components/LoginBackground";

/**
 * LoadingPage 컴포넌트 - 데이터 분석 중 로딩 화면
 * 
 * 은하계 테마의 로딩 애니메이션을 표시합니다.
 */
export default function LoadingPage() {
  return (
    <>
      <LoginBackground />
      <Wrapper>
        <ContentContainer>
          <GalaxyLoader>
            <Core />
            <Orbit $nthChild={1} />
            <Orbit $nthChild={2} />
            <Orbit $nthChild={3} />
          </GalaxyLoader>
          <LoadingText>결과를 분석하고 있습니다...</LoadingText>
        </ContentContainer>
      </Wrapper>
    </>
  );
}

// Keyframes for animations
const orbitRotate = keyframes`
  100% { transform: rotateY(360deg) rotateX(360deg); }
`;

const corePulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(0.8); opacity: 0.7; }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
`;

// Styled Components
const Wrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  overflow: hidden;
  z-index: 1; /* LoginBackground 위에 오도록 z-index 조정 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  padding-top: 5rem;
  opacity: 1;
  pointer-events: auto;
  transform: scale(1);
  transition: opacity 0.5s ease-out, transform 0.5s ease-out;
  color: white;
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const GalaxyLoader = styled.div`
  width: 200px;
  height: 200px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Orbit = styled.div<{ $nthChild: number }>`
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid;
  transform-style: preserve-3d;
  animation: ${orbitRotate} 10s linear infinite;

  ${props => props.$nthChild === 1 && `
    transform: rotateY(70deg) rotateX(20deg);
    border-color: #c4b5fd;
    animation-delay: 0s;
  `}
  ${props => props.$nthChild === 2 && `
    transform: rotateY(70deg) rotateX(80deg);
    border-color: #a78bfa;
    animation-delay: -1.5s;
  `}
  ${props => props.$nthChild === 3 && `
    transform: rotateY(70deg) rotateX(140deg);
    border-color: #8b5cf6;
    animation-delay: -3s;
  `}
`;

const Core = styled.div`
  width: 30px;
  height: 30px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 0 20px 10px #fff, 0 0 30px 15px #c4b5fd, 0 0 50px 25px #8b5cf6;
  animation: ${corePulse} 2s ease-in-out infinite;
`;

const LoadingText = styled.h2`
  font-family: 'Noto Sans KR', serif; /* Assuming Noto Sans KR is available or fallback to serif */
  font-size: 1.5rem; /* text-2xl */
  margin-top: 3rem; /* mt-12 */
  color: #d8b4fe; /* text-violet-300 */
  animation: ${pulse} 2s infinite; /* animate-pulse */
`;