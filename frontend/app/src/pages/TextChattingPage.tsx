import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { colors, spacing, fontSize, borderRadius, commonStyles } from '../AppStyle';

type TextChattingPageNavigationProp = StackNavigationProp<RootStackParamList, 'TextChatting'>;

export default function TextChattingPage() {
  const navigation = useNavigation<TextChattingPageNavigationProp>();
  
  // 애니메이션 값들
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // 페이지 진입 애니메이션
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.background} />
      
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>텍스트 채팅</Text>
          <Text style={styles.subtitle}>
            텍스트로 AI와 대화하며 인지 기능을 평가합니다
          </Text>
        </View>

        {/* 메인 콘텐츠 */}
        <View style={styles.mainContent}>
          <View style={styles.chatArea}>
            <Text style={styles.chatPlaceholder}>
              텍스트 채팅 기능은 개발 중입니다
            </Text>
            <Text style={styles.chatHint}>
              곧 AI와의 텍스트 대화 기능이 추가될 예정입니다
            </Text>
          </View>
        </View>

        {/* 액션 버튼 */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Main')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>메인으로 돌아가기</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
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
    padding: spacing.md,
    paddingTop: spacing.xxl,
  },
  
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  backButtonText: {
    fontSize: 24,
    color: colors.text,
    fontWeight: '600',
  },
  
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  chatArea: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  
  chatPlaceholder: {
    fontSize: fontSize.xl,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  
  chatHint: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  
  actionContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.round,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  actionButtonText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
});