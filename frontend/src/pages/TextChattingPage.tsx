import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Background from '../components/Background';
import Header from '../components/Header';
import { useChatStore } from '../store/chatStore';
import { useReportIdStore } from '../store/reportIdStore';

const PageContainer = styled.div`
  position: relative;
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  color: white;
  box-sizing: border-box;
  padding-bottom: 8rem; /* Add padding to create space at the bottom for the button bar */

  @media (max-width: 768px) {
    padding: 0.5rem;
    padding-bottom: 7rem; /* Adjust for smaller screens */
  }
`;;

const BackButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  position: fixed;
  top: 5rem;
  left: 2rem;
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
    top: 4rem;
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
  max-width: 42rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;

  @media (max-width: 768px) {
    max-width: 95%;
  }
`;

const AIChatacter = styled.div`
  width: 12rem;
  height: 12rem;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 1rem;
  margin-top: 2rem;

  svg {
    width: 100%;
    height: 100%;
  }

  @media (max-width: 768px) {
    width: 8rem;
    height: 8rem;
    margin-bottom: 0.5rem;
    margin-top: 1rem;
  }
`;

const ChatBox = styled.div`
  background: rgba(17, 24, 39, 0.8);
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
  height: 40vh;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #4A5568 #2D3748;
  display: flex;
  flex-direction: column;
  padding: 0.5rem;

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
  color: white;

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

const BlinkingCursor = styled.span`
  display: inline-block;
  width: 8px;
  height: 1em;
  background-color: white;
  animation: blink 1s step-end infinite;
  @keyframes blink {
    from, to { background-color: transparent }
    50% { background-color: white; }
  }
`;

const ErrorMessage = styled.p`
  color: #f87171;
  margin-top: 1rem;
`;

const BottomButtonBar = styled.div`
  position: fixed;
  left: 0; right: 0; bottom: 0;
  width: 100vw;
  display: flex;
  justify-content: center;
  gap: 1.3rem;
  background: transparent;
  padding: 2rem 0 1.5rem 0;
  z-index: 99;
`;

const ActionBtn = styled.button<{ $pdf?: boolean }>`
  background: ${({ $pdf }) => ($pdf ? "#7C3AED" : "rgba(124, 58, 237, 0.1)")};
  color: ${({ $pdf }) => ($pdf ? "#FFFFFF" : "#A78BFA")};
  font-weight: 600;
  border-radius: 1rem;
  border: 1px solid ${({ $pdf }) => ($pdf ? "#7C3AED" : "rgba(167, 139, 250, 0.2)")};
  font-size: 1.1rem;
  padding: 0.8rem 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    background: ${({ $pdf }) => ($pdf ? "#6D28D9" : "rgba(124, 58, 237, 0.15)")};
    border-color: ${({ $pdf }) => ($pdf ? "#6D28D9" : "rgba(167, 139, 250, 0.3)")};
  }
`;

const TextChattingPage: React.FC = () => {
  const {
    chatId,
    messages,
    isLoading,
    isStreaming,
    error,
    createChat,
    sendMessage,
    evaluateChat,
    clearMessages,
  } = useChatStore();
  const { reportId } = useReportIdStore();
  const [inputMessage, setInputMessage] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const chatLogRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (reportId) {
      createChat(reportId);
    }
    return () => {
      clearMessages();
    };
  }, [reportId, createChat, clearMessages]);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (inputMessage.trim() && chatId && reportId) {
      const chatRequest = {
        report_id: reportId,
        chat_id: chatId,
        message: inputMessage,
      };
      sendMessage(chatRequest);
      setInputMessage('');
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleTerminateChat = async () => {
    if (!chatId || !reportId || isEvaluating) return;

    setIsEvaluating(true);
    try {
      await evaluateChat(chatId, reportId);
      alert("채팅 평가가 완료되었습니다.");
      navigate('/chatting-select');
    } catch (err) {
      console.error("Failed to evaluate chat:", err);
      alert("채팅 평가 중 오류가 발생했습니다.");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <Background isSurveyActive={true}>
      <Header showLogoText={true} />
      <PageContainer>
        <BackButton onClick={handleBack}>
          <svg fill="none" stroke="white" viewBox="0 0 24 24">
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
              {messages.map((msg) => (
                <ChatBubble key={msg.id} $sender={msg.role}>
                  {msg.message}
                </ChatBubble>
              ))}
              {isStreaming && messages[messages.length - 1]?.role === 'ai' && (
                <ChatBubble $sender="ai">
                  <BlinkingCursor />
                </ChatBubble>
              )}
            </ChatLog>
            <ChatInputContainer>
              <ChatInput
                type="text"
                placeholder="메시지를 입력하세요..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                disabled={isLoading || isStreaming}
              />
              <SendButton onClick={handleSendMessage} disabled={isLoading || isStreaming}>
                {isStreaming ? '응답 중...' : '전송'}
              </SendButton>
            </ChatInputContainer>
          </ChatBox>
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </ContentWrapper>
        <BottomButtonBar>
          <ActionBtn onClick={handleTerminateChat} disabled={isEvaluating}>
            {isEvaluating ? "제출 중..." : "채팅 종료"}
          </ActionBtn>
        </BottomButtonBar>
      </PageContainer>
    </Background>
  );
};

export default TextChattingPage;