import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { colors, spacing, fontSize, borderRadius } from '../AppStyle';
import Svg, { Path } from 'react-native-svg';
import AppHeader from '../components/AppHeader';
import BottomBar from '../components/BottomBar';

type ChattingSelectPageNavigationProp = StackNavigationProp<RootStackParamList, 'ChattingSelect'>;

export default function ChattingSelectPage() {
  const navigation = useNavigation<ChattingSelectPageNavigationProp>();

  const handleSelectChat = (type: 'voice' | 'text') => {
    if (type === 'voice') {
      navigation.navigate('VoiceChatting' as any);
    } else {
      navigation.navigate('TextChatting' as any);
    }
  };

  return (
    <View style={styles.container}>
      {/* 배경 */}
      <View style={styles.background} />
      
      <AppHeader showLogoText={true} />

      {/* 메인 컨텐츠 */}
      <View style={styles.content}>
        <Text style={styles.title}>대화 검사 시작</Text>
        <Text style={styles.description}>검사 방식을 선택해주세요.</Text>
        
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.chatOptionButton}
            onPress={() => handleSelectChat('voice')}
            activeOpacity={0.8}
          >
            <Svg width="48" height="48" fill="none" stroke="#a5f3fc" viewBox="0 0 24 24">
              <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </Svg>
            <Text style={styles.buttonText}>음성으로 시작</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.chatOptionButton}
            onPress={() => handleSelectChat('text')}
            activeOpacity={0.8}
          >
            <Svg width="48" height="48" fill="none" stroke="#a5f3fc" viewBox="0 0 24 24">
              <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </Svg>
            <Text style={styles.buttonText}>텍스트로 시작</Text>
          </TouchableOpacity>
        </View>
      </View>
      <BottomBar currentPage="ChattingSelect" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
  },
  
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 60, // Adjust for header
    paddingBottom: 80, // Adjust for bottom bar
  },
  
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: '#67e8f9',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  
  description: {
    fontSize: fontSize.md,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  
  buttonGroup: {
    width: '100%',
    gap: spacing.md,
  },
  
  chatOptionButton: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    width: 250,
    alignSelf: 'center',
  },
  
  buttonText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: '#a5f3fc',
  },
});