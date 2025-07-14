import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Background from '../components/Background';
import Header from '../components/Header';

// Styled Components 정의
const PageContainer = styled.div`
  width: 100%;
  min-height: calc(100vh - 4rem); /* Header 높이 제외한 뷰포트 높이 */
  display: flex;
  flex-direction: column;
  align-items: center; /* 가로 중앙 정렬 */
  justify-content: center; /* 세로 중앙 정렬 */
  padding: 1rem; /* 기본 패딩 */
  color: #fff; /* text-white */

  @media (max-width: 768px) {
    padding: 0.5rem;
    min-height: calc(100vh - 3rem); /* 모바일 Header 높이 제외 */
  }
`;

const BackButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  position: fixed; /* 뷰포트 기준으로 고정 */
  top: 5rem; /* Header 아래에 위치하도록 조정 */
  left: 2rem; /* 좌측에서 2rem */
  z-index: 30;
  border-radius: 9999px;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  svg {
    width: 1.5rem;
    height: 1.5rem;
  }

  @media (max-width: 768px) {
    top: 4rem; /* 모바일 Header 아래에 위치하도록 조정 */
    left: 1rem;
    padding: 0.4rem;
    svg {
      width: 1.2rem;
      height: 1.2rem;
    }
  }
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 48rem; /* max-w-2xl */
  text-align: center; /* 텍스트 중앙 정렬 */
  display: flex;
  flex-direction: column;
  align-items: center; /* 내부 요소들 (제목, 설명, 버튼 그룹) 가로 중앙 정렬 */
  /* transform: translateY(-5%); /* 상하 중앙에서 위로 5% 이동 */
  /* margin-top: 4rem; /* Added margin-top to push it down */

  @media (max-width: 768px) {
    max-width: 95%;
    /* transform: translateY(-3%); /* 모바일에서 위로 3% 이동 */
    /* margin-top: 2rem; /* Added margin-top for mobile */
  }
`;

const Title = styled.h2`
  font-size: 1.875rem; /* text-3xl */
  line-height: 2.25rem;
  font-weight: 700; /* font-bold */
  color: #67e8f9; /* text-cyan-300 */
  margin-bottom: 0.5rem;

  @media (max-width: 768px) {
    font-size: 1.5rem;
    line-height: 1.8rem;
  }
`;

const Description = styled.p`
  color: #9ca3af; /* text-gray-400 */
  margin-top: 0.5rem;
  margin-bottom: 3rem;
  font-size: 0.9rem; /* 글씨 크기 더 작게 조정 */

  @media (max-width: 768px) {
    font-size: 0.8rem;
    margin-bottom: 2rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column; /* flex-col */
  gap: 1.5rem; /* gap-6 */
  justify-content: center;
  width: 100%; /* 모바일에서 전체 너비 사용 */
  
  @media (min-width: 768px) { /* md:flex-row */
    flex-direction: row;
    width: auto; /* 데스크톱에서 너비 자동 조정 */
  }
`;

const ChatOptionButton = styled.button`
  background: rgba(6, 182, 212, 0.1); /* bg-cyan-500/10 */
  border: 1px solid rgba(6, 182, 212, 0.3); /* border border-cyan-500/30 */
  color: #a5f3fc; /* text-cyan-200 */
  transition: all 0.2s ease;
  font-size: 1.125rem;
  font-weight: 700;
  padding: 2rem 2.5rem; /* py-8 px-10 */
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%; /* w-full */

  @media (min-width: 768px) {
    width: 16rem; /* md:w-64 */
  }

  &:hover {
    background: rgba(6, 182, 212, 0.2);
    border-color: rgba(6, 182, 212, 0.7);
  }

  svg {
    width: 3rem;
    height: 3rem;
    color: currentColor;
  }

  @media (max-width: 768px) {
    padding: 1.5rem 1.8rem;
    font-size: 1rem;
    gap: 0.8rem;
    svg {
      width: 2.5rem;
      height: 2.5rem;
    }
  }
`;

const ChattingSelectPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSelectChat = (type: 'voice' | 'text') => {
    if (type === 'voice') {
      navigate('/chatting/voice');
    } else {
      navigate('/chatting/text');
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Background isSurveyActive={false}> {/* isSurveyActive를 false로 변경 */}
      <Header showLogoText={true} /> {/* Header 컴포넌트 추가 */}
      <PageContainer>
        <BackButton onClick={handleBack}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
        </BackButton>
        <ContentWrapper>
          <Title>대화 검사 시작</Title>
          <Description>검사 방식을 선택해주세요.</Description>
          <ButtonGroup>
            <ChatOptionButton onClick={() => handleSelectChat('voice')}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
              </svg>
              <span>음성으로 시작</span>
            </ChatOptionButton>
            <ChatOptionButton onClick={() => handleSelectChat('text')}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
              </svg>
              <span>텍스트로 시작</span>
            </ChatOptionButton>
          </ButtonGroup>
        </ContentWrapper>
      </PageContainer>
    </Background>
  );
};

export default ChattingSelectPage;