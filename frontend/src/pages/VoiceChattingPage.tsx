import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import Background from '../components/Background';
import Header from '../components/Header';
import { useVoiceChatStore } from '../store/voiceChatStore';
import { useReportIdStore } from '../store/reportIdStore';
import { speechToText, textToSpeech } from '../api';
import type { ChatLogResponse } from '../types/api';
import voiceChatRobot from '../assets/imgs/voiceChat-Robot.png';

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
`;

const micPulse = keyframes`
  0% { transform: scale(0.7); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: scale(1.2); opacity: 0; }
`;

const PageContainer = styled.div`
  position: relative;
  width: 100%;
  min-height: calc(100vh - 4rem);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  color: white;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 0.5rem;
    min-height: calc(100vh - 3rem);
  }
`;

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
  gap: 1.5rem;
  margin-top: 10vh;

  @media (max-width: 768px) {
    max-width: 95%;
    gap: 1rem;
    margin-top: 6vh;
  }
`;

const QuestionText = styled.p`
  color: #67e8f9;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
  line-height: 1.5;
  padding-bottom: -1rem;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const VoiceAICharacter = styled.div<{ $isListening: boolean }>`
  width: 30vh;
  height: 30vh;
  margin-left: auto;
  margin-right: auto;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  @media (max-width: 768px) {
    width: 25vh;
    height: 25vh;
  }
`;

const MicButton = styled.button<{ $isListening: boolean }>`
  width: 8vh;
  height: 8vh;
  min-width: 4rem;
  min-height: 4rem;
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
    width: 99%;
    height: 99%;
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
    min-width: 3rem;
    min-height: 3rem;
    svg {
      width: 99%;
      height: 99%;
    }
  }
`;

const VoiceStatus = styled.p`
  color: #9ca3af;
  font-size: 1.125rem;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const VoiceChattingPage: React.FC = () => {
  const {
    chatId,
    messages,
    isLoading,
    createChat,
    sendMessage,
    clearMessages,
    addMessage,
  } = useVoiceChatStore();
  const { reportId } = useReportIdStore();
  const [isListening, setIsListening] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (reportId) {
      createChat(reportId);
    }
    return () => {
      clearMessages();
    };
  }, [reportId, createChat, clearMessages]);

  const handleTextToSpeech = async (text: string) => {
    try {
      const audioBlob = await textToSpeech(text);
      const audioUrl = URL.createObjectURL(audioBlob);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = audioUrl;
        audioPlayerRef.current.play();
        // 음성 재생이 시작된 후에 AI 메시지를 화면에 추가
        const aiMessage: ChatLogResponse = {
          id: Math.floor(Math.random() * 1_000_000_000) + 1,
          chat_id: chatId!,
          role: 'ai',
          message: text,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        addMessage(aiMessage);
      }
    } catch (error) {
      console.error("Error with TTS:", error);
    }
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
    setIsListening(!isListening);
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

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size === 0) return;

        const file = new File([audioBlob], "recording.webm", { type: 'audio/webm' });

        try {
          const sttResponse = await speechToText(file);
          if (sttResponse.text && chatId && reportId) {
            const chatRequest = {
              report_id: reportId,
              chat_id: chatId,
              message: sttResponse.text,
            };
            const aiResponseText = await sendMessage(chatRequest);
            if (aiResponseText) {
              handleTextToSpeech(aiResponseText);
            }
          }
        } catch (error) {
          console.error("Error with STT:", error);
        }

        audioChunksRef.current = [];
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
    } catch (err) {
      console.error("Error starting recording:", err);
      if (isListening) {
        setIsListening(false);
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
    }
    navigate(-1);
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
          <QuestionText>
            {messages.length > 0 ? messages[messages.length - 1].message : "안녕하세요! 대화 검사를 시작하겠습니다. 오늘 기분은 어떠신가요?"}
          </QuestionText>
          <VoiceAICharacter $isListening={isListening}>
            <img src={voiceChatRobot} alt="Voice Chat Robot" />
          </VoiceAICharacter>
          <MicButton $isListening={isListening} onClick={handleToggleListening} disabled={isLoading}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
            </svg>
          </MicButton>
          <VoiceStatus>
            {isListening ? '듣고 있어요...' : (isLoading ? '응답을 생성 중입니다...' : '버튼을 누르고 말씀해주세요')}
          </VoiceStatus>
        </ContentWrapper>
        <audio ref={audioPlayerRef} hidden />
      </PageContainer>
    </Background>
  );
};

export default VoiceChattingPage;