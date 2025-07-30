import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  useWindowDimensions,
  Alert,
  FlatList,
  ListRenderItem,
} from 'react-native';
// PanGestureHandler는 더 이상 사용하지 않으므로 제거합니다.
// import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { colors, spacing, fontSize, borderRadius, shadows, isSmallScreen, isTablet } from '../AppStyle';
import { createEmptyReport } from '../api';
import { useReportIdStore } from '../store/reportIdStore';
import Svg, { Path } from 'react-native-svg';
import Header from '../components/AppHeader';
import BottomBar from '../components/BottomBar';

type MainPageNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

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
    step: '1',
    title: '설문 검사',
    description: '일상 생활에서의 변화를 확인하는 8가지 질문으로 인지 기능 저하를 선별합니다.',
    icon: (
      <Svg width="28" height="28" fill="none" stroke="#C4B5FD" viewBox="0 0 24 24">
        <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </Svg>
    ),
    route: 'AD8',
  },
  {
    id: 'conversation',
    step: '2',
    title: '대화 검사',
    description: 'AI와의 자연스러운 대화를 통해 언어 능력, 기억력, 실행 능력을 평가합니다.',
    icon: (
      <Svg width="28" height="28" fill="none" stroke="#C4B5FD" viewBox="0 0 24 24">
        <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </Svg>
    ),
    route: 'ChattingSelect',
    required: 'survey',
  },
  {
    id: 'drawing',
    step: '3',
    title: '그림 검사',
    description: '시계를 그리는 과정을 분석하여 시공간 능력 및 실행 기능을 정밀하게 진단합니다.',
    icon: (
      <Svg width="28" height="28" fill="none" stroke="#C4B5FD" viewBox="0 0 24 24">
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
      <Svg width="28" height="28" fill="none" stroke="#C4B5FD" viewBox="0 0 24 24">
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
  const { width: screenWidth } = useWindowDimensions();

  // 애니메이션 값
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // FlatList 참조 생성
  const flatListRef = useRef<FlatList<CardData>>(null);

  // 검사 완료 상태를 실시간으로 감지하기 위한 상태
  const [completionStates, setCompletionStates] = useState({
    isAD8Completed: false,
    isChatCompleted: false,
    isDrawingCompleted: false,
  });

  // 카드 너비 및 간격 계산
  const cardWidth = isTablet ? screenWidth * 0.55 : screenWidth * 0.75;
  const cardMargin = spacing.md;
  const itemWidth = cardWidth + cardMargin * 2; // 각 아이템의 전체 너비 (카드 + 양쪽 마진)
  const emptyItemWidth = (screenWidth - itemWidth) / 2; // 중앙 정렬을 위한 빈 공간 너비

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
  }, [fadeAnim, slideAnim]);

  // 검사 완료 상태를 실시간으로 감지
  const { isAD8Completed, isChatCompleted, isDrawingCompleted } = useReportIdStore();
  
  useEffect(() => {
    setCompletionStates({
      isAD8Completed,
      isChatCompleted,
      isDrawingCompleted,
    });
  }, [isAD8Completed, isChatCompleted, isDrawingCompleted]);

  // 페이지 포커스 시 상태 업데이트 (Zustand가 자동으로 구독하므로 불필요)
  // useEffect(() => {
  //   const unsubscribe = navigation.addListener('focus', () => {
  //     const { isAD8Completed, isChatCompleted, isDrawingCompleted } = useReportIdStore.getState();
  //     setCompletionStates({
  //       isAD8Completed,
  //       isChatCompleted,
  //       isDrawingCompleted,
  //     });
  //   });

  //   return unsubscribe;
  // }, [navigation]);

  // 다음 카드로 이동
  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % cards.length;
    flatListRef.current?.scrollToIndex({ animated: true, index: nextIndex });
  };

  // 이전 카드로 이동
  const handlePrev = () => {
    const prevIndex = (currentIndex - 1 + cards.length) % cards.length;
    flatListRef.current?.scrollToIndex({ animated: true, index: prevIndex });
  };

  // 현재 보이는 아이템이 변경될 때 currentIndex를 업데이트하는 함수
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ item: CardData; index: number | null }> }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  // onViewableItemsChanged가 언제 호출될지 결정하는 설정
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleStartTest = async (testId: string) => {
    const { reportId, setReportId } = useReportIdStore.getState();

    try {
      if (testId === 'survey') {
        if (isAD8Completed) {
          Alert.alert('알림', '이미 설문 검사를 완료하셨습니다.');
          return;
        }
        if (!reportId) {
          const reportResponse = await createEmptyReport({});
          setReportId(reportResponse.report_id);
          console.log('빈 리포트 생성 성공:', reportResponse);
        }
        navigation.navigate('AD8');
      } else if (testId === 'conversation') {
        if (isChatCompleted) {
          Alert.alert('알림', '이미 대화 검사를 완료하셨습니다.');
          return;
        }
        navigation.navigate('ChattingSelect');
      } else if (testId === 'drawing') {
        if (isDrawingCompleted) {
          Alert.alert('알림', '이미 그림 검사를 완료하셨습니다.');
          return;
        }
        navigation.navigate('Drawing');
      } else if (testId === 'report') {
        if (!reportId) {
          Alert.alert('오류', '리포트 ID를 찾을 수 없습니다. 메인 페이지에서 다시 시도해주세요.');
          return;
        }
        navigation.navigate('Report', { reportId: reportId.toString() });
      }
    } catch (error) {
      console.error('검사 시작 오류:', error);
      Alert.alert('오류', '검사를 시작할 수 없습니다. 다시 시도해주세요.');
    }
  };

  const renderCard: ListRenderItem<CardData> = ({ item: card }) => {
    let isCompleted = false;
    if (card.id === 'survey') isCompleted = completionStates.isAD8Completed;
    else if (card.id === 'conversation') isCompleted = completionStates.isChatCompleted;
    else if (card.id === 'drawing') isCompleted = completionStates.isDrawingCompleted;
    
    const canStart = !card.required || 
      (card.required === 'survey' && completionStates.isAD8Completed) ||
      (card.required === 'conversation' && completionStates.isChatCompleted) ||
      (card.required === 'drawing' && completionStates.isDrawingCompleted);

    const cardHeight = cardWidth * 0.8;

    return (
      <View
        style={[
          styles.card,
          {
            width: cardWidth,
            height: cardHeight,
            marginHorizontal: cardMargin, // 카드 좌우 마진 추가
          },
        ]}
      >
        <View style={styles.cardContent}>
          <View style={[styles.iconContainer, { width: isTablet ? 48 : 40, height: isTablet ? 48 : 40, position: 'absolute', top: spacing.xl, left: spacing.md, zIndex: 1 }]}>
            {card.icon}
          </View>
          
          <View style={styles.textContainer}>
            <Text style={[styles.cardStep, { fontSize: isTablet ? fontSize.md : fontSize.sm, marginBottom: isSmallScreen ? spacing.sm : spacing.md, textAlign: 'center' }]}>Step {card.step}</Text>
            <Text style={[styles.cardTitle, { fontSize: isTablet ? fontSize.xxxl : fontSize.xxl, marginBottom: isSmallScreen ? spacing.xs : spacing.sm, textAlign: 'center' }]}>{card.title}</Text>
            <Text style={[styles.cardDescription, { fontSize: isTablet ? fontSize.sm : fontSize.xs, marginBottom: isSmallScreen ? spacing.md : spacing.lg, lineHeight: isTablet ? 20 : 16, textAlign: 'center' }]}>{card.description}</Text>
            
            <TouchableOpacity
              style={[
                isCompleted ? styles.completedButton : styles.startButton,
                !canStart && !isCompleted && styles.disabledButton,
                { paddingVertical: isTablet ? spacing.md : spacing.sm, paddingHorizontal: isTablet ? spacing.xl : spacing.lg, alignSelf: 'center' }
              ]}
              onPress={() => handleStartTest(card.id)}
              disabled={!canStart && !isCompleted}
              activeOpacity={0.8}
            >
              <Text style={[
                isCompleted ? styles.completedButtonText : styles.startButtonText,
                !canStart && !isCompleted && styles.disabledButtonText,
                { fontSize: isTablet ? fontSize.md : fontSize.sm }
              ]}>
                {isCompleted ? '완료' : '검사 시작'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.background} />
      
      <Header showLogoText={true} />
      
      <View style={[styles.sliderContainer, { paddingHorizontal: isTablet ? spacing.lg : spacing.md, paddingVertical: isSmallScreen ? spacing.md : spacing.lg }]}>
        <TouchableOpacity style={[styles.navButton, { width: isTablet ? 36 : 32, height: isTablet ? 36 : 32 }]} onPress={handlePrev}>
          <Svg width={isTablet ? 20 : 18} height={isTablet ? 20 : 18} fill="none" stroke="#ffffff" viewBox="0 0 24 24">
            <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>
        
        <View style={styles.centerContent}>
          <View style={[styles.header, { paddingBottom: isSmallScreen ? spacing.md : spacing.lg }]}>
            <Text style={[styles.headerTitle, { fontSize: isTablet ? fontSize.xxxl : fontSize.xxl, marginBottom: isSmallScreen ? spacing.sm : spacing.md }]}>기억 건강 진단 프로그램</Text>
            <Text style={[styles.headerSubtitle, { fontSize: isTablet ? fontSize.xs : fontSize.xs, lineHeight: isTablet ? 18 : 14, paddingHorizontal: isTablet ? spacing.xxxl : spacing.xxl }]} numberOfLines={2} ellipsizeMode="tail">
              체계적인 4단계 검사를 통해 당신의 인지 건강을 정밀하게 분석합니다.
            </Text>
          </View>
          
                     {/* FlatList with pagingEnabled */}
           <FlatList
             ref={flatListRef}
             data={cards}
             renderItem={renderCard}
             keyExtractor={(item) => item.id}
             horizontal
             showsHorizontalScrollIndicator={false}
             pagingEnabled={true}
             snapToInterval={itemWidth}
             snapToAlignment="center"
             decelerationRate="fast"
             bounces={false}
             contentContainerStyle={{ 
               alignItems: 'center',
               paddingHorizontal: emptyItemWidth
             }}
             onViewableItemsChanged={onViewableItemsChanged}
             viewabilityConfig={viewabilityConfig}
             getItemLayout={(_, index) => (
               { length: itemWidth, offset: itemWidth * index, index }
             )}
           />
        </View>
        
        <TouchableOpacity style={[styles.navButton, { width: isTablet ? 36 : 32, height: isTablet ? 36 : 32 }]} onPress={handleNext}>
          <Svg width={isTablet ? 20 : 18} height={isTablet ? 20 : 18} fill="none" stroke="#ffffff" viewBox="0 0 24 24">
            <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </Svg>
        </TouchableOpacity>
      </View>
       
       <BottomBar currentPage="Main" />
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
  header: {
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: -spacing.lg,
    marginTop: spacing.xxl,
  },
  headerSubtitle: {
    color: '#D4DAE4',
    textAlign: 'center',
    fontSize: 8,
    marginBottom: -spacing.md,
    marginTop: -spacing.md,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'flex-start',
    marginTop: -spacing.xxxl * 2,
  },
  // cardContainer 스타일은 FlatList로 대체되어 제거
  card: {
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...shadows.large,
    // position: 'absolute' 속성 제거
  },
  cardContent: {
    flex: 1,
    padding: spacing.lg,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 0,
  },
  iconContainer: {
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardStep: {
    color: '#c4b5fd',
    fontWeight: '600',
  },
  cardTitle: {
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  cardDescription: {
    color: '#9CA3AF',
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: borderRadius.round,
    ...shadows.medium,
    opacity: 1,
  },
  startButtonText: {
    color: colors.text,
    fontWeight: '700',
  },
  completedButton: {
    backgroundColor: '#7fcebb',
    borderRadius: borderRadius.round,
    ...shadows.medium,
  },
  completedButtonText: {
    color: colors.text,
    fontWeight: '700',
  },
  disabledButton: {
    backgroundColor: colors.textMuted,
  },
  disabledButtonText: {
    color: colors.textSecondary,
  },
  navButton: {
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});