import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Background from '../components/Background';
import Header from '../components/Header'; // Header 컴포넌트 임포트
import { useChatStore } from '../store/chatStore'; // Zustand store 임포트

// Styled Components 정의
const PageContainer = styled.div`
  position: relative;
  width: 100%;
  min-height: 100vh; /* 뷰포트 전체 높이 차지 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center; /* 세로 중앙 정렬 */
  padding: 1rem; /* 기본 패딩 */
  color: white;
  box-sizing: border-box; /* 패딩이 너비/높이에 포함되도록 */

  @media (max-width: 768px) {
    padding: 0.5rem;
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
  max-width: 42rem; /* max-w-2xl (42rem) */
  text-align: center; /* 내부 텍스트 중앙 정렬 */
  display: flex;
  flex-direction: column;
  align-items: center; /* 내부 요소들 (제목, 설명, 버튼 그룹) 가로 중앙 정렬 */
  box-sizing: border-box; /* 패딩이 너비/높이에 포함되도록 */

  @media (max-width: 768px) {
    max-width: 95%;
  }
`;

const AIChatacter = styled.div`
  width: 12rem; /* w-48 */
  height: 12rem; /* h-48 */
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 1rem;
  margin-top: 2rem; /* Added margin-top to push it down */

  svg {
    width: 100%;
    height: 100%;
  }

  @media (max-width: 768px) {
    width: 8rem;
    height: 8rem;
    margin-bottom: 0.5rem;
    margin-top: 1rem; /* Added margin-top for mobile */
  }
`;

const ChatBox = styled.div`
  background: rgba(17, 24, 39, 0.8); /* bg-slate-800/50에서 더 짙게 조정 */
  backdrop-filter: blur(20px);
  border: 1px solid rgba(6, 182, 212, 0.2);
  border-radius: 1rem;
  padding: 1rem;
  width: 100%;

  @media (max-width: 768px) {
    padding: 0.8rem;
  }
`;

const ChatLog = styled.div`
  height: 40vh; /* height from temp.html */
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #4A5568 #2D3748;
  display: flex;
  flex-direction: column;
  padding: 0.5rem;

  /* Custom scrollbar styles from temp.html */
  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-track {
    background: #1e293b;
  }
  &::-webkit-scrollbar-thumb {
    background: #4f46e5;
    border-radius: 4px;
  }

  @media (max-width: 768px) {
    height: 30vh;
    padding: 0.3rem;
  }
`;

const ChatBubble = styled.div<{ $sender: 'ai' | 'user' }>`
  max-width: 75%;
  padding: 10px 15px;
  border-radius: 15px;
  margin-bottom: 10px;

  ${props => props.$sender === 'ai' && `
    background-color: #2d3748;
    align-self: flex-start;
    border-bottom-left-radius: 2px;
  `}

  ${props => props.$sender === 'user' && `
    background-color: #4f46e5;
    align-self: flex-end;
    border-bottom-right-radius: 2px;
  `}

  @media (max-width: 768px) {
    padding: 8px 12px;
    font-size: 0.9rem;
    margin-bottom: 8px;
  }
`;

const ChatInputContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  border-top: 1px solid rgba(6, 182, 212, 0.2);

  @media (max-width: 768px) {
    gap: 0.3rem;
    padding: 0.3rem;
    margin-top: 0.3rem;
  }
`;

const ChatInput = styled.input`
  flex-grow: 1;
  background-color: rgba(17, 24, 39, 0.6);
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  color: white;
  outline: none;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px #22d3ee;
  }

  &::placeholder {
    color: #9ca3af;
  }

  @media (max-width: 768px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }
`;

const SendButton = styled.button`
  background-color: #06b6d4;
  color: white;
  font-weight: 700;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0891b2;
  }

  @media (max-width: 768px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }
`;

const TextChattingPage: React.FC = () => {
  const { messages, inputMessage, addMessage, setInputMessage } = useChatStore();
  const chatLogRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const hasInitialMessageSent = useRef(false); // useRef를 컴포넌트 최상위 레벨로 이동

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // 초기 AI 메시지는 한 번만 추가되도록 수정
    if (!hasInitialMessageSent.current && messages.length === 0) {
      addMessage({ text: "안녕하세요! 대화 검사를 시작하겠습니다. 오늘 기분은 어떠신가요?", sender: 'ai' });
      hasInitialMessageSent.current = true; // 메시지 전송 후 플래그 설정
    }
  }, [messages, addMessage]);

  const handleUserMessage = () => {
    if (inputMessage.trim()) {
      addMessage({ text: inputMessage, sender: 'user' });
      setInputMessage('');

      setTimeout(() => {
        addMessage({ text: "그렇군요. 흥미로운 이야기네요. 조금 더 자세히 말씀해주시겠어요?", sender: 'ai' });
      }, 1500);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Background isSurveyActive={true}>
      <Header showLogoText={true} /> {/* Header 컴포넌트 추가 */}
      <PageContainer>
        <BackButton onClick={handleBack}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
        </BackButton>
        <ContentWrapper>
          <AIChatacter>
            <svg viewBox="0 0 100 100">
              <defs>
                <radialGradient id="ai-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#0e7490" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="50" cy="50" r="45" fill="url(#ai-glow)" />
              <circle cx="50" cy="50" r="30" fill="#083344" />
              <circle cx="50" cy="50" r="28" fill="#020617" stroke="#06b6d4" strokeWidth="1.5" />
              <path id="ai-eye" d="M 35 45 Q 50 55 65 45" stroke="#67e8f9" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path id="ai-mouth" d="M 40 65 Q 50 70 60 65" stroke="#67e8f9" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          </AIChatacter>
          <ChatBox>
            <ChatLog ref={chatLogRef} className="custom-scrollbar">
              {messages.map((msg, index) => (
                <ChatBubble key={index} $sender={msg.sender}>
                  {msg.text}
                </ChatBubble>
              ))}
            </ChatLog>
            <ChatInputContainer>
              <ChatInput
                type="text"
                placeholder="메시지를 입력하세요..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleUserMessage(); }}
              />
              <SendButton onClick={handleUserMessage}>
                전송
              </SendButton>
            </ChatInputContainer>
          </ChatBox>
        </ContentWrapper>
      </PageContainer>
    </Background>
  );
};

export default TextChattingPage;
