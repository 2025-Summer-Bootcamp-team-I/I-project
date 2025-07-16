import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import Background from '../components/Background';
import Header from '../components/Header'; // Header 컴포넌트 임포트
import { useChatStore } from '../store/chatStore';
import voiceChatRobot from '../assets/imgs/voiceChat-Robot.png'; // 로봇 이미지 임포트

// Keyframes for animations
const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
`;

const micPulse = keyframes`
  0% { transform: scale(0.7); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: scale(1.2); opacity: 0; }
`;

// Styled Components 정의
const PageContainer = styled.div`
  position: relative;
  width: 100%;
  min-height: calc(100vh - 4rem); /* Header 높이 제외한 뷰포트 높이 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center; /* 세로 중앙 정렬 */
  padding: 1rem; /* 기본 패딩 */
  color: white;
  box-sizing: border-box; /* 패딩이 너비/높이에 포함되도록 */

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
  max-width: 42rem; /* max-w-2xl (42rem) */
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box; /* 패딩이 너비/높이에 포함되도록 */
  gap: 1.5rem; /* 자식 요소들 간의 간격 */
  margin-top: 10vh; /* 전체 콘텐츠를 아래로 내림 */

  @media (max-width: 768px) {
    max-width: 95%;
    gap: 1rem;
    margin-top: 6vh; /* 모바일에서 전체 콘텐츠를 아래로 내림 */
  }
`;

const QuestionText = styled.p`
  color: #67e8f9; /* 시안 색상 */
  font-size: 1.5rem;
  font-weight: 600;
  /* margin-bottom: 2rem; 로봇 이미지와의 간격 */
  text-align: center;
  line-height: 1.5;
  padding-bottom: -1rem;

  @media (max-width: 768px) {
    font-size: 1rem;
    /* margin-bottom: 1.5rem; */
  }
`;

const VoiceAICharacter = styled.div<{ $isListening: boolean }>`
  width: 30vh; /* w-64 */
  height: 30vh; /* h-64 */
  margin-left: auto;
  margin-right: auto;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain; /* 이미지가 잘리지 않도록 */
  }

  @media (max-width: 768px) {
    width: 25vh;
    height: 25vh;
  }
`;

const MicButton = styled.button<{ $isListening: boolean }>`
  width: 8vh; /* w-24 */
  height: 8vh; /* h-24 */
  min-width: 4rem; /* 최소 너비 설정 */
  min-height: 4rem; /* 최소 높이 설정 */
  background-color: ${({ $isListening }) => $isListening ? '#ef4444' : '#06b6d4'};
  border-radius: 9999px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: background-color 0.3s ease;
  box-shadow: ${({ $isListening }) =>
    $isListening
      ? '0 0 20px 10px rgba(239, 68, 68, 0.5), 0 0 40px 20px rgba(239, 68, 68, 0.3)'
      : '0 0 20px 10px rgba(14, 116, 144, 0.5), 0 0 40px 20px rgba(14, 116, 144, 0.3)'};
  animation: ${pulse} 2s infinite ease-in-out;

  &:hover {
    background-color: ${({ $isListening }) => $isListening ? '#dc2626' : '#0891b2'};
  }

  &:focus {
    outline: none;
  }

  svg {
    width: 99%; /* 부모 크기에 비례하여 조절 */
    height: 99%; /* 부모 크기에 비례하여 조절 */
    color: white;
  }

  ${props => props.$isListening && css`
    &::after {
      content: '';
      position: absolute;
      top: -10px; left: -10px; right: -10px; bottom: -10px;
      border-radius: 50%;
      border: 2px solid;
      animation: ${micPulse} 1.5s infinite;
    }
  `}

  @media (max-width: 768px) {
    width: 6vh;
    height: 6vh;
    min-width: 3rem; /* 모바일 최소 너비 설정 */
    min-height: 3rem; /* 모바일 최소 높이 설정 */
    svg {
      width: 99%;
      height: 99%;
    }
    /* margin-top: 1.5rem; */
  }
`;

const VoiceStatus = styled.p`
  color: #9ca3af; /* text-gray-400 */
  /* margin-top: 1rem; 마이크 버튼과의 간격 */
  font-size: 1.125rem; /* text-lg */

  @media (max-width: 768px) {
    font-size: 1rem;
    /* margin-top: 0.8rem; */
  }
`;

const VoiceChattingPage: React.FC = () => {
  const { isListening, toggleListening } = useChatStore();
  const navigate = useNavigate();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleToggleListening = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
    toggleListening();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        console.log("Recorded audio URL:", audioUrl);
        // You can now send this audioBlob to a server or play it back
        audioChunksRef.current = [];
        
        // Stop all media tracks to turn off the microphone indicator
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
    } catch (err) {
      console.error("Error starting recording:", err);
      // If there's an error (e.g., permission denied), toggle state back
      if (isListening) {
        toggleListening();
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleBack = () => {
    if (isListening) {
      stopRecording();
      toggleListening();
    }
    navigate(-1);
  };

  return (
    <Background isSurveyActive={true}>
      <Header showLogoText={true} />
      <PageContainer>
        <BackButton onClick={handleBack}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
        </BackButton>
        <ContentWrapper>
          <QuestionText>
            안녕하세요! 대화 검사를 시작하겠습니다.<br />오늘 기분은 어떠신가요?
          </QuestionText>
          <VoiceAICharacter $isListening={isListening}>
            <img src={voiceChatRobot} alt="Voice Chat Robot" />
          </VoiceAICharacter>
          <MicButton $isListening={isListening} onClick={handleToggleListening}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
            </svg>
          </MicButton>
          <VoiceStatus>
            {isListening ? '듣고 있어요...' : '버튼을 누르고 말씀해주세요'}
          </VoiceStatus>
        </ContentWrapper>
      </PageContainer>
    </Background>
  );
};

export default VoiceChattingPage;