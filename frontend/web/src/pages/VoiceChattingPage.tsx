import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import Background from '../components/Background';
import Header from '../components/Header';
import { useVoiceChatStore } from '../store/voiceChatStore';
import { useReportIdStore } from '../store/reportIdStore';
import voiceChatRobot1 from '../assets/imgs/robot-character1.png';
import voiceChatRobot2 from '../assets/imgs/robot-character2.png';
import voiceChatRobot3 from '../assets/imgs/robot-character3.png';

// Styled-components and keyframes definitions should be here
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
  overflow-y: auto;
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
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 42rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  gap: 0;
  margin-top: 0;
`;

const QuestionText = styled.p`
  color: #67e8f9;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
  line-height: 1.5;
  padding-bottom: 0;
  margin-top: 2rem; 
  min-height: 9rem;
`;

const VoiceAICharacter = styled.div<{ $isListening: boolean }>`
  width: 30vh;
  height: 30vh;
  margin-top: 5rem;
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
`;

const VoiceStatus = styled.p`
  color: #9ca3af;
  font-size: 1.125rem;
`;

const BottomButtonBar = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.3rem;
  background: transparent;
  padding: 0 0 1rem 0;
`;

const ActionBtn = styled.button<{ $pdf?: boolean }>`
  background-color: #06b6d4;
  color: white;
  font-weight: 700;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0891b2;
  }
`;

const VoiceChattingPage: React.FC = () => {
  const {
    chatId,
    isLoading,
    isRecording,
    isProcessing,
    createChat,
    sendVoiceMessage,
    loadLatestLogs,
    evaluateChat,
    clearMessages,
    setRecording,
  } = useVoiceChatStore();
  const { reportId, setChatCompleted } = useReportIdStore();
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentRobotImage, setCurrentRobotImage] = useState(voiceChatRobot1);
  const [displayedAiMessage, setDisplayedAiMessage] = useState('안녕하세요! 대화 검사를 시작하겠습니다. 오늘 기분은 어떠신가요?');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const animationIntervalRef = useRef<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (reportId) {
      createChat(reportId).then(() => {
        const initialMessage = useVoiceChatStore.getState().messages[0]?.message;
        if (initialMessage) {
          setDisplayedAiMessage(initialMessage);
        }
      });
    }
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
      clearMessages();
    };
  }, [reportId, createChat, clearMessages]);

  const handleTextToSpeech = (text: string, audioBlob: Blob) => {
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
    }

    const audioUrl = URL.createObjectURL(audioBlob);
    if (!audioPlayerRef.current) return;

    const audio = audioPlayerRef.current;
    audio.src = audioUrl;

    audio.onloadedmetadata = () => {
      const duration = audio.duration;
      const charDelay = text.length > 0 ? (duration * 1000) / text.length : 50;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setCurrentRobotImage(voiceChatRobot2);
          
          // --- New, More Robust Animation Logic ---
          let animatedText = "";
          let charIndex = 0;
          setDisplayedAiMessage(''); // Clear the display once before starting.

          animationIntervalRef.current = setInterval(() => {
            if (charIndex < text.length) {
              animatedText += text.charAt(charIndex);
              setDisplayedAiMessage(animatedText); // Set the entire built string
              charIndex++;
            } else {
              if (animationIntervalRef.current) {
                clearInterval(animationIntervalRef.current);
              }
            }
          }, charDelay);

        }).catch(error => {
          console.error("Audio play failed:", error);
          setDisplayedAiMessage(text);
          if (chatId) loadLatestLogs(chatId);
        });
      }
    };

    audio.onended = () => {
      setCurrentRobotImage(voiceChatRobot1);
      setDisplayedAiMessage(text); // Ensure final text is set
      if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
      if (chatId) loadLatestLogs(chatId);
    };

    audio.onerror = (e) => {
      console.error("Audio playback error:", e);
      setDisplayedAiMessage(text);
      if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
      if (chatId) loadLatestLogs(chatId);
    };
  };

  const handleToggleListening = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size === 0 || !chatId || !reportId) return;

        const audioFile = new File([audioBlob], "recording.webm", { type: 'audio/webm' });
        const result = await sendVoiceMessage({ reportId, chatId, audioFile });

        if (result) {
          handleTextToSpeech(result.aiMessageText, result.audioBlob);
        }
      };

      mediaRecorderRef.current.start();
      setRecording(true);
      setCurrentRobotImage(voiceChatRobot3);
    } catch (err) {
      console.error("Error starting recording:", err);
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setCurrentRobotImage(voiceChatRobot1);
    }
  };

  const handleBack = () => {
    if (isRecording) stopRecording();
    navigate(-1);
  };

  const handleTerminateChat = async () => {
    if (!chatId || !reportId || isEvaluating) return;
    setIsEvaluating(true);
    try {
      await evaluateChat(chatId, reportId);
      alert("채팅 평가가 완료되었습니다.");
      setChatCompleted(true);
      navigate('/main', { state: { cardIndex: 1 } });
    } catch (err) {
      console.error("Failed to evaluate chat:", err);
      alert("채팅 평가 중 오류가 발생했습니다.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const getStatusText = () => {
    if (isRecording) return '듣고 있어요...';
    if (isProcessing) return '응답을 생성 중입니다...';
    return '버튼을 누르고 말씀해주세요';
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
          <VoiceAICharacter $isListening={isRecording}>
            <img src={currentRobotImage} alt="Voice Chat Robot" />
          </VoiceAICharacter>
          <QuestionText>
            {displayedAiMessage}
          </QuestionText>
          <MicButton $isListening={isRecording} onClick={handleToggleListening} disabled={isProcessing || isLoading}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
            </svg>
          </MicButton>
          <VoiceStatus>
            {getStatusText()}
          </VoiceStatus>
        </ContentWrapper>
        <audio ref={audioPlayerRef} hidden />
        <BottomButtonBar>
          <ActionBtn onClick={handleTerminateChat} disabled={isEvaluating || isProcessing}>
            {isEvaluating ? "제출 중..." : "채팅 종료"}
          </ActionBtn>
        </BottomButtonBar>
      </PageContainer>
    </Background>
  );
};

export default VoiceChattingPage;