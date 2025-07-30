import React, { useRef, useEffect, useState } from 'react';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../App';
import styled, { css } from 'styled-components/native';
import { Dimensions, Animated, Easing, Image, Text, View, TouchableOpacity, Alert, Platform } from 'react-native';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { useVoiceChatStore } from '../store/voiceChatStore';
import { useReportIdStore } from '../store/reportIdStore';
import { speechToText, textToSpeech } from '../api';
import type { ChatLogResponse } from '../types/api';
import Svg, { Path } from 'react-native-svg';
import BottomBar from '../components/BottomBar';

const { width, height } = Dimensions.get('window');

const PageContainer = styled.View`
  flex: 1;
  align-items: center;
  justify-content: flex-start; /* Align content to the top */
  padding-top: ${width > 768 ? 80 : 64}px; /* Add padding to the top */
  background-color: transparent;
`;

const TopLeftButtonContainer = styled.View`
  position: absolute;
  top: ${width > 768 ? 32 : 24}px;
  left: ${width > 768 ? 24 : 12}px;
  z-index: 30;
  align-items: center;
`;

const CloseButton = styled.TouchableOpacity`
  background-color: #606060;
  border-radius: 9999px;
  padding: ${width > 768 ? 6 : 4}px;
  align-items: center;
  justify-content: center;
`;

const ContentWrapper = styled.View`
  width: 100%;
  max-width: ${width > 768 ? 42 * 16 : width * 0.95}px;
  align-items: center;
  flex-direction: column;
  box-sizing: border-box;
`;

const QuestionText = styled.Text`
  color: #67e8f9;
  font-size: ${width > 768 ? 1.3 * 16 : 1.0 * 16}px;
  font-weight: 600;
  text-align: center;
  line-height: ${1.3 * 16}px;
  padding-bottom: 0;
  margin-top: 8px;
  min-height: ${width > 768 ? 7 * 16 : 5 * 16}px;
  padding-left: 32px;
  padding-right: 32px;
`;

const VoiceAICharacter = styled(Animated.View)<{ $isListening: boolean }>`
  width: ${width > 768 ? height * 0.25 : height * 0.2}px; /* Adjusted width */
  height: ${width > 768 ? height * 0.25 : height * 0.2}px; /* Adjusted height */
  margin-top: 20px;
  margin-left: auto;
  margin-right: auto;
  border-radius: 9999px;
  align-items: center;
  justify-content: center;
`;



const MicButton = styled(Animated.createAnimatedComponent(TouchableOpacity))<{ $isListening: boolean }>`
  width: ${width > 768 ? height * 0.08 : height * 0.06}px; /* 8vh vs 6vh */
  height: ${width > 768 ? height * 0.08 : height * 0.06}px; /* 8vh vs 6vh */
  min-width: ${width > 768 ? 64 : 48}px; /* 4rem = 64px, 3rem = 48px */
  min-height: ${width > 768 ? 64 : 48}px; /* 4rem = 64px, 3rem = 48px */
  background-color: ${({ $isListening }: { $isListening: boolean }) => $isListening ? '#ef4444' : '#06b6d4'};
  border-radius: 9999px;
  border-width: 0; /* web 버전처럼 border 제거 */
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: visible; /* 추가: 자식 요소가 밖으로 확장될 수 있도록 */
  
  /* web 버전의 box-shadow를 native 속성으로 변환 */
  shadow-color: ${({ $isListening }: { $isListening: boolean }) => $isListening ? 'rgba(239, 68, 68, 0.5)' : 'rgba(14, 116, 144, 0.5)'};
  shadow-offset: 0px 0px;
  shadow-opacity: 1;
  shadow-radius: ${({ $isListening }: { $isListening: boolean }) => $isListening ? 20 : 20}px;
  elevation: ${({ $isListening }: { $isListening: boolean }) => $isListening ? 10 : 10}; /* Android용 그림자 */

  /* web 버전의 transition과 hover 효과를 유사하게 구현 */
  transition: background-color 0.3s ease; /* React Native에서는 직접적인 hover는 아니지만, 터치 피드백에 사용될 수 있음 */

  /* web 버전의 &:hover와 유사한 효과를 위해 background-color 변경 로직 추가 */
  /* &:hover {
    background-color: ${({ $isListening }: { $isListening: boolean }) => $isListening ? '#dc2626' : '#0891b2'};
  } */

  /* web 버전의 svg 스타일 */
  /* React Native에서는 Svg 컴포넌트 자체에 스타일을 적용해야 함 */
  /* svg {
    width: 99%;
    height: 99%;
    color: white;
  } */

  
`;

const VoiceStatus = styled.Text`
  color: #9ca3af;
  font-size: ${width > 768 ? 1.125 * 16 : 1 * 16}px; /* 1.125rem vs 1rem */
`;

const BottomButtonBar = styled.View`
  flex-direction: row;
  justify-content: center;
  gap: 20.8px;
  background-color: transparent;
  padding-bottom: 16px;
`;

const ActionBtn = styled.TouchableOpacity<{ $pdf?: boolean }>`
  background-color: #06b6d4;
  /* color is for Text component, not TouchableOpacity */
  /* font-weight is for Text component, not TouchableOpacity */
  padding: ${width > 768 ? 8 : 6.4}px ${width > 768 ? 16 : 12.8}px; /* 0.5rem 1rem vs 0.4rem 0.8rem */
  border-radius: 8px; /* 0.5rem = 8px */
`;

const ChatTerminateTextButton = styled.TouchableOpacity`
  margin-top: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  align-items: center;
  justify-content: center;
`;

const ChatTerminateText = styled.Text`
  color: #67e8f9;
  font-size: ${width > 768 ? 12 : 10}px;
  font-weight: 600;
`;

const BottomSectionWrapper = styled.View`
  position: absolute;
  bottom: 80px;
  left: 0;
  right: 0;
  width: 100%;
  align-items: center;
  padding-bottom: 16px;
  background-color: transparent;
  gap: ${width > 768 ? 16 : 12}px; /* Added gap between children */
`;

const VoiceChattingPage: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { reportId, setChatCompleted } = useReportIdStore();
  const { chatId, messages, isLoading, createChat, sendMessage, clearMessages, addMessage, evaluateChat } = useVoiceChatStore();
  const [isListening, setIsListening] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentRobotImage, setCurrentRobotImage] = useState(require('../assets/imgs/robot-character1.png'));
  const [displayedAiMessage, setDisplayedAiMessage] = useState('');

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Animated values for pulse animation
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const micPulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reportId) {
      createChat(reportId);
    }
    return () => {
      clearMessages();
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [reportId, createChat, clearMessages]);

  useEffect(() => {
    if (isListening) {
      // Start pulse animation for MicButton
      Animated.loop(
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ).start();

      // Start micPulse animation for MicButton's ::after effect (simulated with scale and opacity)
      Animated.loop(
        Animated.sequence([
          Animated.timing(micPulseAnim, {
            toValue: 1,
            duration: 750,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(micPulseAnim, {
            toValue: 0,
            duration: 750,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      micPulseAnim.stopAnimation();
      pulseAnim.setValue(0);
      micPulseAnim.setValue(0);
    }
  }, [isListening, pulseAnim, micPulseAnim]);

  const handleTextToSpeech = async (text: string) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      setCurrentRobotImage(require('../assets/imgs/robot-character2.png')); // TTS 재생 시작 시 robot2으로 변경
      setDisplayedAiMessage(''); // 새로운 TTS 시작 시 기존 메시지 초기화

      const audioBlob = await textToSpeech(text);
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const { sound } = await Audio.Sound.createAsync(
          { uri: base64data },
          { shouldPlay: true }
        );
        soundRef.current = sound;

        let charIndex = 0;
        let intervalId: number | null = null;

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.isPlaying) {
            setCurrentRobotImage(require('../assets/imgs/robot-character3.png')); // 재생 중 robot3
            if (!intervalId) {
              const audioDuration = status.durationMillis || 0;
              const charDelay = text.length > 0 ? (audioDuration) / text.length : 0;

              intervalId = setInterval(() => {
                if (charIndex < text.length) {
                  const charToAdd = text[charIndex];
                  setDisplayedAiMessage((prev) => prev + charToAdd);
                  charIndex++;
                } else {
                  if (intervalId) clearInterval(intervalId);
                }
              }, charDelay);
            }
          } else if (status.isLoaded && !status.isPlaying && status.didJustFinish) {
            setCurrentRobotImage(require('../assets/imgs/robot-character1.png')); // 재생 종료 시 robot1으로 복귀
            if (intervalId) clearInterval(intervalId);
            setDisplayedAiMessage(text); // 음성 재생이 끝나면 전체 텍스트 표시

            const aiMessage: ChatLogResponse = {
              id: Math.floor(Math.random() * 1_000_000_000) + 1,
              chat_id: chatId!,
              role: 'ai',
              message: text,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            addMessage(aiMessage);
          } else if (status.isLoaded && !status.isPlaying && !status.didJustFinish) {
            setCurrentRobotImage(require('../assets/imgs/robot-character2.png')); // 일시 정지 시 robot2
            if (intervalId) clearInterval(intervalId);
          }
        });
      };
    } catch (error) {
      console.error("Error with TTS:", error);
      Alert.alert("오류", "음성 재생 중 오류가 발생했습니다.");
      setCurrentRobotImage(require('../assets/imgs/robot-character1.png'));
      setDisplayedAiMessage(text);
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("권한 필요", "음성 녹음을 위해 마이크 권한이 필요합니다.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        playThroughEarpieceAndroid: false,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setIsListening(true);
      setCurrentRobotImage(require('../assets/imgs/robot-character3.png'));
    } catch (err) {
      console.error("Error starting recording:", err);
      Alert.alert("오류", "녹음 시작 중 오류가 발생했습니다.");
      setIsListening(false);
      setCurrentRobotImage(require('../assets/imgs/robot-character1.png'));
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return;

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsListening(false);
      setCurrentRobotImage(require('../assets/imgs/robot-character1.png'));

      if (uri) {
        const audioFile = {
          uri: uri,
          name: 'recording.m4a',
          type: 'audio/m4a',
        };

        try {
          const sttResponse = await speechToText(audioFile);
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
          console.error("Error with STT or sending message:", error);
          Alert.alert("오류", "음성 인식 또는 메시지 전송 중 오류가 발생했습니다.");
        }
      }
    } catch (err) {
      console.error("Error stopping recording:", err);
      Alert.alert("오류", "녹음 중지 중 오류가 발생했습니다.");
      setIsListening(false);
      setCurrentRobotImage(require('../assets/imgs/robot-character1.png'));
    }
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleBack = () => {
    if (isListening) {
      stopRecording();
    }
    navigation.goBack();
  };

  const handleTerminateChat = async () => {
    if (!chatId || !reportId || isEvaluating) return;

    setIsEvaluating(true);
    try {
      await evaluateChat(chatId, reportId);
      Alert.alert("완료", "채팅 평가가 완료되었습니다.");
      setChatCompleted(true);
      navigation.navigate('Main');
    } catch (err) {
      console.error("Failed to evaluate chat:", err);
      Alert.alert("오류", "채팅 평가 중 오류가 발생했습니다.");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <PageContainer>
      {/* <Background isSurveyActive={true} /> */}
      {/* <Header showLogoText={true} /> */}
      <TopLeftButtonContainer>
        <CloseButton onPress={handleTerminateChat}>
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#67e8f9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: [{ translateY: -2 }] }}>
            <Path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
            <Path d="M12 2v10" />
          </Svg>
        </CloseButton>
        <ChatTerminateTextButton>
          <ChatTerminateText>{isEvaluating ? "제출 중..." : "채팅 종료"}</ChatTerminateText>
        </ChatTerminateTextButton>
      </TopLeftButtonContainer>
      <ContentWrapper>
        <VoiceAICharacter $isListening={isListening} style={{
          transform: [{ scale: pulseAnim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 1.05, 1]
          }) }],
          opacity: pulseAnim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 0.8, 1]
          })
        }}>
          <Image source={currentRobotImage} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
        </VoiceAICharacter>
        <QuestionText>
          {displayedAiMessage || (messages.length > 0 ? messages[messages.length - 1].message : "안녕하세요! 대화 검사를 시작하겠습니다. 오늘 기분은 어떠신가요?")}
        </QuestionText>
      </ContentWrapper>
      <BottomSectionWrapper>
        <MicButton $isListening={isListening} onPress={handleToggleListening} disabled={isLoading} style={{
          transform: [{
            scale: micPulseAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [1, 1.1, 1] // Adjusted for subtle micPulse effect
            })
          }]
        }}>
          
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white">
            <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </Svg>
        </MicButton>
        <VoiceStatus>
          {isListening ? '듣고 있어요...' : (isLoading ? '응답을 생성 중입니다...' : '버튼을 누르고 말씀해주세요')}
        </VoiceStatus>
      </BottomSectionWrapper>
      <BottomBar currentPage="VoiceChatting" />
    </PageContainer>
  );
};

export default VoiceChattingPage;