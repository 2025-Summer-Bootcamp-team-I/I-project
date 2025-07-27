import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { colors, spacing, fontSize, borderRadius } from '../AppStyle';
import { createEmptyReport } from '../api';
import { useReportIdStore } from '../store/reportIdStore';
import Svg, { Path } from 'react-native-svg';

type MainPageNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

const { width: screenWidth } = Dimensions.get('window');

interface CardData {
  id: string;
  step: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: keyof RootStackParamList;
  required?: string;
}

const cards: CardData[] = [
  {
    id: 'survey',
    step: 'Step 1',
    title: '설문 검사',
    description: '일상 생활에서의 변화를 확인하는 8가지 질문으로 인지 기능 저하를 선별합니다.',
    icon: (
      <Svg width="32" height="32" fill="none" stroke="#C4B5FD" viewBox="0 0 24 24">
        <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </Svg>
    ),
    route: 'AD8',
  },
  {
    id: 'conversation',
    step: 'Step 2',
    title: '대화 검사',
    description: 'AI와의 자연스러운 대화를 통해 언어 능력, 기억력, 실행 능력을 평가합니다.',
    icon: (
      <Svg width="32" height="32" fill="none" stroke="#C4B5FD" viewBox="0 0 24 24">
        <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </Svg>
    ),
    route: 'ChattingSelect',
    required: 'survey',
  },
  {
    id: 'drawing',
    step: 'Step 3',
    title: '그림 검사',
    description: '시계를 그리는 과정을 분석하여 시공간 능력 및 실행 기능을 정밀하게 진단합니다.',
    icon: (
      <Svg width="32" height="32" fill="none" stroke="#C4B5FD" viewBox="0 0 24 24">
        <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </Svg>
    ),
    route: 'Drawing',
    required: 'conversation',
  },
  {
    id: 'report',
    step: 'Final',
    title: '최종 분석 리포트',
    description: '모든 검사 결과를 종합하여 AI가 생성한 맞춤형 인지 건강 리포트를 확인합니다.',
    icon: (
      <Svg width="32" height="32" fill="none" stroke="#C4B5FD" viewBox="0 0 24 24">
        <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </Svg>
    ),
    route: 'Report',
    required: 'drawing',
  },
];

export default function MainPage() {
  const navigation = useNavigation<MainPageNavigationProp>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedTests, setCompletedTests] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

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

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % cards.length);
    scrollViewRef.current?.scrollTo({
      x: ((currentIndex + 1) % cards.length) * screenWidth * 0.8,
      animated: true,
    });
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    scrollViewRef.current?.scrollTo({
      x: ((currentIndex - 1 + cards.length) % cards.length) * screenWidth * 0.8,
      animated: true,
    });
  };

  const handleStartTest = async (testId: string) => {
    const card = cards.find(c => c.id === testId);
    if (!card) {
      console.error('카드를 찾을 수 없습니다:', testId);
      return;
    }

    // 필수 검사가 완료되지 않은 경우
    if (card.required && !completedTests.includes(card.required)) {
      Alert.alert('알림', '이전 검사를 먼저 완료해주세요.');
      return;
    }

    const { reportId, isAD8Completed, isDrawingCompleted, isChatCompleted, setReportId } = useReportIdStore.getState();

    try {
      if (testId === 'survey') {
        if (isAD8Completed) {
          Alert.alert('알림', '이미 AD8 검사를 완료하셨습니다.');
          return;
        }
        if (!reportId) {
          const reportResponse = await createEmptyReport({});
          setReportId(reportResponse.report_id);
          console.log('빈 리포트 생성 성공:', reportResponse);
        }
        navigation.navigate('AD8' as any);
      } else if (testId === 'conversation') {
        if (isChatCompleted) {
          Alert.alert('알림', '이미 대화 검사를 완료하셨습니다.');
          return;
        }
        navigation.navigate('ChattingSelect' as any);
      } else if (testId === 'drawing') {
        if (isDrawingCompleted) {
          Alert.alert('알림', '이미 그림 검사를 완료하셨습니다.');
          return;
        }
        navigation.navigate('Drawing' as any);
      } else if (testId === 'report') {
        navigation.navigate('Report' as any);
      }
    } catch (error) {
      console.error('검사 시작 오류:', error);
      Alert.alert('오류', '검사를 시작할 수 없습니다. 다시 시도해주세요.');
    }
  };

  const renderCard = (card: CardData, index: number) => {
    const isActive = index === currentIndex;
    const { isAD8Completed, isDrawingCompleted, isChatCompleted } = useReportIdStore.getState();
    
    let isCompleted = false;
    if (card.id === 'survey') {
      isCompleted = isAD8Completed;
    } else if (card.id === 'conversation') {
      isCompleted = isChatCompleted;
    } else if (card.id === 'drawing') {
      isCompleted = isDrawingCompleted;
    }
    
    const canStart = !card.required || 
      (card.required === 'survey' && isAD8Completed) ||
      (card.required === 'conversation' && isChatCompleted) ||
      (card.required === 'drawing' && isDrawingCompleted);

    return (
      <Animated.View
        key={card.id}
        style={[
          styles.card,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: isActive ? 1 : 0.85 },
            ],
          },
        ]}
      >
        <View style={styles.cardContent}>
          <View style={styles.iconContainer}>
            {card.icon}
          </View>
          <Text style={styles.cardStep}>{card.step}</Text>
          <Text style={styles.cardTitle}>{card.title}</Text>
          <Text style={styles.cardDescription}>{card.description}</Text>
          
          <TouchableOpacity
            style={[
              styles.startButton,
              !canStart && styles.disabledButton,
            ]}
            onPress={() => handleStartTest(card.id)}
            disabled={!canStart}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.startButtonText,
              !canStart && styles.disabledButtonText,
            ]}>
              {isCompleted ? '완료' : '검사 시작'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 배경 */}
      <View style={styles.background} />
      
      {/* 헤더 */}
      <View style={styles.topHeader}>
        <View style={styles.logoContainer}>
                  <Image
          source={require('../../../shared/assets/imgs/logo.png')}
          style={styles.logoImage}
        />
          <Text style={styles.logoText}>Neurocare 치매진단 서비스</Text>
        </View>
        <TouchableOpacity
          style={styles.myPageButton}
          onPress={() => navigation.navigate('MyPage' as any)}
        >
          <Text style={styles.myPageButtonText}>마이페이지</Text>
        </TouchableOpacity>
      </View>
      
      {/* 메인 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>기억 건강 진단 프로그램</Text>
        <Text style={styles.headerSubtitle}>
          체계적인 4단계 검사를 통해 당신의 인지 건강을 정밀하게 분석합니다.
        </Text>
      </View>

      {/* 카드 슬라이더 */}
      <View style={styles.sliderContainer}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={handlePrev}
        >
          <Svg width="24" height="24" fill="none" stroke="#ffffff" viewBox="0 0 24 24">
            <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>
        
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
          snapToInterval={screenWidth * 0.8}
          decelerationRate="fast"
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(
              event.nativeEvent.contentOffset.x / (screenWidth * 0.8)
            );
            setCurrentIndex(newIndex);
          }}
        >
          {cards.map((card, index) => renderCard(card, index))}
        </ScrollView>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={handleNext}
        >
          <Svg width="24" height="24" fill="none" stroke="#ffffff" viewBox="0 0 24 24">
            <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* 하단 점들 */}
      <View style={styles.dotsContainer}>
        {cards.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex && styles.activeDot,
            ]}
          />
        ))}
      </View>
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
  
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  
  logoImage: {
    width: 34,
    height: 34,
    marginRight: spacing.sm,
  },
  
  logoText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: '#96e7d4',
    letterSpacing: -1,
  },
  
  myPageButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.7,
    borderColor: '#96E7D4',
    borderRadius: borderRadius.round,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  
  myPageButtonText: {
    color: '#96E7D4',
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  
  header: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  
  headerTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  
  headerSubtitle: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.xl,
  },
  
  scrollContainer: {
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  
  card: {
    width: screenWidth * 0.8,
    height: 400,
    marginHorizontal: spacing.sm,
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  
  cardStep: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  
  cardTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  
  cardDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  
  startButton: {
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
  
  startButtonText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  
  disabledButton: {
    backgroundColor: colors.textMuted,
  },
  
  disabledButtonText: {
    color: colors.textSecondary,
  },
  
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  
  navButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.round,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textMuted,
  },
  
  activeDot: {
    backgroundColor: colors.primary,
  },
});
