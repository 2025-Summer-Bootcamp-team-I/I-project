import React, { useRef, useEffect, useState } from 'react';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../App';
import styled, { css } from 'styled-components/native';
import { Dimensions, Animated, Easing, Image, Text, View, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import BottomBar from '../components/BottomBar';

const { width, height } = Dimensions.get('window');

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

// Local imports within app folder
import { useChatStore } from '../store/chatStore';
import { useReportIdStore } from '../store/reportIdStore';

const PageContainer = styled.View`
  flex: 1;
  align-items: center;
  justify-content: flex-start;
  padding: ${width > 768 ? 16 : 8}px;
  background-color: transparent;
`;

const ContentWrapper = styled.View`
  width: 100%;
  max-width: ${width > 768 ? 42 * 16 : width * 0.95}px;
  align-items: center;
  flex-direction: column;
  box-sizing: border-box;
`;

const AIChatacter = styled.View`
  width: ${width > 768 ? 8 * 16 : 6 * 16}px;
  height: ${width > 768 ? 8 * 16 : 6 * 16}px;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: ${width > 768 ? 4 : 2}px; /* Reduced margin-bottom */
  margin-top: ${width > 768 ? 8 : 4}px; /* Reduced margin-top */
  align-items: center;
  justify-content: center;
`;

const ChatBox = styled.View`
  background-color: rgba(17, 24, 39, 0.8);
  border-width: 1px;
  border-color: rgba(6, 182, 212, 0.2);
  border-radius: 16px;
  padding: ${width > 768 ? 16 : 12}px;
  width: 100%;
`;

const ChatLog = styled(ScrollView)`
  height: ${height * 0.45}px; /* 45vh */
  padding: ${width > 768 ? 8 : 4}px;
`;

const ChatBubble = styled.View<{ $sender: 'ai' | 'user' }>`
  max-width: 75%;
  padding: 10px 15px;
  border-radius: 15px;
  margin-bottom: 10px;
  ${({ $sender }: { $sender: 'ai' | 'user' }) => $sender === 'ai' && css`
    background-color: #2d3748;
    align-self: flex-start;
    border-bottom-left-radius: 2px;
  `}
  ${({ $sender }: { $sender: 'ai' | 'user' }) => $sender === 'user' && css`
    background-color: #4f46e5;
    align-self: flex-end;
    border-bottom-right-radius: 2px;
  `}
`;

const ChatBubbleText = styled.Text`
  color: white;
  font-size: ${width > 768 ? 14 : 12}px;
`;

const ChatInputContainer = styled.View`
  flex-direction: row;
  gap: ${width > 768 ? 8 : 5}px;
  margin-top: ${width > 768 ? 16 : 10}px;
  padding: ${width > 768 ? 8 : 5}px;
  border-top-width: 1px;
  border-top-color: rgba(6, 182, 212, 0.2);
`;

const ChatInputWrapper = styled.View`
  flex-grow: 1;
  flex-direction: row;
  align-items: center;
  background-color: #1C1F33;
  border-radius: 8px;
  padding: ${width > 768 ? 8 : 6}px ${width > 768 ? 16 : 12}px;
  margin-top: 7px;
`;

const ChatInputIcon = styled.View`
  margin-right: 8px;
`;

const ChatInput = styled.TextInput`
  flex-grow: 1;
  color: white;
  font-size: ${width > 768 ? 16 : 14}px;
`;

const SendButton = styled.TouchableOpacity`
  background-color: #06b6d4;
  padding: ${width > 768 ? 8 : 6}px;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin-top: 7px;
`;

const SendButtonText = styled.Text`
  color: white;
  font-weight: 700;
  font-size: ${width > 768 ? 16 : 14}px;
`;

const BlinkingCursor = styled(Animated.Text)`
  display: inline-block;
  width: 8px;
  height: 1em;
  background-color: white;
`;

const ErrorMessage = styled.Text`
  color: #f87171;
  margin-top: 16px;
`;

const BottomButtonBar = styled.View`
  flex-direction: row;
  justify-content: center;
  gap: ${width > 768 ? 20.8 : 16}px;
  background-color: transparent;
  padding: ${width > 768 ? 32 : 24}px 0 ${width > 768 ? 24 : 16}px 0;
`;

const ActionBtn = styled.TouchableOpacity<{ $pdf?: boolean }>`
  background-color: #06b6d4; /* Simplified for RN */
  color: white;
  font-weight: 700;
  border-radius: 16px;
  padding: ${width > 768 ? 12.8 : 9.6}px ${width > 768 ? 32 : 24}px;
  align-items: center;
  justify-content: center;
`;

const ActionBtnText = styled.Text`
  color: white;
  font-weight: 700;
  font-size: ${width > 768 ? 17.6 : 14.4}px;
`;

const TextChattingPage: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {
    chatId,
    messages,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    evaluateChat,
    clearMessages,
    initializeChatForReport,
  } = useChatStore();
  const { reportId, setChatCompleted } = useReportIdStore();
  const [inputMessage, setInputMessage] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const chatLogRef = useRef<ScrollView>(null);

  // Blinking cursor animation
  const blinkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reportId) {
      initializeChatForReport(reportId);
    }
    return () => {
      clearMessages();
    };
  }, [reportId, initializeChatForReport, clearMessages]);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.step0, // Instant change
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.step0, // Instant change
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [blinkAnim]);

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
          <ChatTerminateText>
            {isEvaluating ? "제출 중..." : "채팅 종료"}
          </ChatTerminateText>
        </ChatTerminateTextButton>
      </TopLeftButtonContainer>
      <ContentWrapper>
        <AIChatacter>
          <Svg viewBox="0 0 100 100">
            <Defs>
              <RadialGradient id="ai-glow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#67e8f9" stopOpacity="0.7" />
                <Stop offset="100%" stopColor="#0e7490" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx="50" cy="50" r="45" fill="url(#ai-glow)" />
            <Circle cx="50" cy="50" r="30" fill="#083344" />
            <Circle cx="50" cy="50" r="28" fill="#020617" stroke="#06b6d4" strokeWidth="1.5" />
            <Path id="ai-eye" d="M 35 45 Q 50 55 65 45" stroke="#67e8f9" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <Path id="ai-mouth" d="M 40 65 Q 50 70 60 65" stroke="#67e8f9" strokeWidth="2" fill="none" strokeLinecap="round" />
          </Svg>
        </AIChatacter>
        <ChatBox>
          <ChatLog ref={chatLogRef}>
            {messages.map((msg) => (
              <ChatBubble key={msg.id} $sender={msg.role}>
                <ChatBubbleText>{msg.message}</ChatBubbleText>
              </ChatBubble>
            ))}
            {isStreaming && messages[messages.length - 1]?.role === 'ai' && (
              <ChatBubble $sender="ai">
                <ChatBubbleText>
                  <BlinkingCursor style={{ opacity: blinkAnim }} />
                </ChatBubbleText>
              </ChatBubble>
            )}
          </ChatLog>
          <ChatInputContainer>
            <ChatInputWrapper>
              <ChatInput
                placeholder="메세지를 입력하세요..."
                value={inputMessage}
                onChangeText={setInputMessage}
                onSubmitEditing={handleSendMessage}
                editable={!isLoading && !isStreaming}
              />
            </ChatInputWrapper>
            <SendButton onPress={handleSendMessage} disabled={isLoading || isStreaming}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M22 2L11 13" />
                <Path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </Svg>
            </SendButton>
          </ChatInputContainer>
        </ChatBox>
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </ContentWrapper>
      <BottomBar currentPage="TextChatting" />
    </PageContainer>
  );
};

export default TextChattingPage;
