import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import Background from '../components/Background';
import Header from '../components/Header';
import { useVoiceChatStore } from '../store/voiceChatStore';
import { useReportIdStore } from '../store/reportIdStore';
import { speechToText, textToSpeech } from '../api';
import type { ChatLogResponse } from '../types/api';
import voiceChatRobot1 from '../assets/imgs/robot1.png';
import voiceChatRobot3 from '../assets/imgs/robot3.png';
import voiceChatRobot9 from '../assets/imgs/robot9.png';

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
  gap: 0.5rem; /* 기존 1rem에서 0.5rem으로 줄임 */
  margin-top: 10vh;

  @media (max-width: 768px) {
    max-width: 95%;
    gap: 0.25rem; /* 기존 0.5rem에서 0.25rem으로 줄임 */
    margin-top: 6vh;
  }
`;

const QuestionText = styled.p`
  color: #67e8f9;
  font-size: 1.5rem; /* 기존 1.2rem에서 1.5rem으로 원상 복구 */
  font-weight: 600;
  text-align: center;
  line-height: 1.5;
  padding-bottom: -1rem;

  @media (max-width: 768px) {
    font-size: 1rem; /* 기존 0.9rem에서 1rem으로 원상 복구 */
  }
`;

const VoiceAICharacter = styled.div<{ $isListening: boolean }>`
  width: 40vh; /* 기존 35vh에서 40vh로 키움 */
  height: 40vh; /* 기존 35vh에서 40vh로 키움 */
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
    width: 35vh; /* 기존 30vh에서 35vh로 키움 */
    height: 35vh; /* 기존 30vh에서 35vh로 키움 */
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

const VoiceChattingPage: React.FC = () => {
  const {
    chatId,
    messages,
    isLoading,
    createChat,
    sendMessage,
    clearMessages,
    addMessage,
    evaluateChat,
  } = useVoiceChatStore();
  const { reportId } = useReportIdStore();
  const [isListening, setIsListening] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentRobotImage, setCurrentRobotImage] = useState(voiceChatRobot1);
  const [displayedAiMessage, setDisplayedAiMessage] = useState(''); // 새로 추가된 상태
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const intervalIdRef = useRef<number | null>(null); // 새로 추가된 useRef
  const navigate = useNavigate();

  useEffect(() => {
    if (reportId) {
      createChat(reportId);
    }
    return () => {
      clearMessages();
      // 컴포넌트 언마운트 시 AudioContext 정리
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (intervalIdRef.current) { // intervalIdRef.current 클리어 로직 추가
        clearInterval(intervalIdRef.current);
      }
    };
  }, [reportId, createChat, clearMessages]);

  const startVolumeMonitoring = () => {
    if (!audioPlayerRef.current) {
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    if (!analyserRef.current) {
      const source = audioContextRef.current.createMediaElementSource(audioPlayerRef.current);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
    }

    const monitorVolume = () => {
      if (!analyserRef.current || !dataArrayRef.current) {
        return;
      }

      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      let sum = 0;
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        sum += dataArrayRef.current[i];
      }
      let average = sum / dataArrayRef.current.length;

      // 볼륨 임계값에 따라 이미지 변경
      if (average > 25) { // 이 임계값은 조정이 필요할 수 있습니다.
        setCurrentRobotImage(voiceChatRobot9);
      } else {
        setCurrentRobotImage(voiceChatRobot3);
      }

      animationFrameIdRef.current = requestAnimationFrame(monitorVolume);
    };

    monitorVolume();
  };

  const stopVolumeMonitoring = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    setCurrentRobotImage(voiceChatRobot1); // 재생 종료 시 robot1으로 복귀
  };

  const handleTextToSpeech = async (text: string) => {
    try {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      setCurrentRobotImage(voiceChatRobot3); // TTS 재생 시작 시 robot3으로 변경
      setDisplayedAiMessage(''); // 새로운 TTS 시작 시 기존 메시지 초기화
      const audioBlob = await textToSpeech(text);
      const audioUrl = URL.createObjectURL(audioBlob);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = audioUrl;
        audioPlayerRef.current.play();

        let charIndex = 0;
        let intervalId: number | null = null;

        audioPlayerRef.current.onloadedmetadata = () => {
          const audioDuration = audioPlayerRef.current?.duration || 0;
          const charDelay = text.length > 0 ? (audioDuration * 1000) / text.length : 0; // text.length가 0인 경우 처리

          intervalId = setInterval(() => {
            if (charIndex < text.length) {
              const charToAdd = text[charIndex];
              setDisplayedAiMessage((prev) => prev + charToAdd);
              charIndex++;
            } else {
              if (intervalId) clearInterval(intervalId);
            }
          }, charDelay);
          intervalIdRef.current = intervalId; // intervalIdRef에 저장
        };

        audioPlayerRef.current.onplay = () => {
          startVolumeMonitoring();
        };

        audioPlayerRef.current.onended = () => {
          stopVolumeMonitoring();
          if (intervalIdRef.current) clearInterval(intervalIdRef.current); // intervalIdRef.current 클리어
          setDisplayedAiMessage(text); // 음성 재생이 끝나면 전체 텍스트 표시
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
        };
      } else {
        console.warn("Audio player ref is null."); // 오디오 플레이어 ref가 null인 경우 경고
      }
    } catch (error) {
      console.error("Error with TTS:", error);
      stopVolumeMonitoring(); // 오류 발생 시에도 모니터링 중지
      if (intervalIdRef.current) clearInterval(intervalIdRef.current); // 오류 발생 시에도 intervalIdRef.current 클리어
      setDisplayedAiMessage(text); // 오류 발생 시에도 전체 텍스트 표시
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
            console.log("Sending message to AI:", chatRequest); // AI 메시지 전송 전 로그
            const aiResponseText = await sendMessage(chatRequest);
            if (aiResponseText) {
              handleTextToSpeech(aiResponseText);
            }
          }
        } catch (error) {
          console.error("Error with STT or sending message:", error); // 에러 로그 수정
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
          <QuestionText>
            {displayedAiMessage || (messages.length > 0 ? messages[messages.length - 1].message : "안녕하세요! 대화 검사를 시작하겠습니다. 오늘 기분은 어떠신가요?")}
          </QuestionText>
          <VoiceAICharacter $isListening={isListening}>
            <img src={currentRobotImage} alt="Voice Chat Robot" />
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
        <BottomButtonBar>
          <ActionBtn onClick={handleTerminateChat} disabled={isEvaluating}>
            {isEvaluating ? "제출 중..." : "채팅 종료"}
          </ActionBtn>
        </BottomButtonBar>
      </PageContainer>
    </Background>
  );
};

export default VoiceChattingPage;