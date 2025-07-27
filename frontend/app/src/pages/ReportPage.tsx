import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { colors, spacing, fontSize, borderRadius, commonStyles } from '../AppStyle';

type ReportPageNavigationProp = StackNavigationProp<RootStackParamList, 'Report'>;
type ReportPageRouteProp = RouteProp<RootStackParamList, 'Report'>;

export default function ReportPage() {
  const navigation = useNavigation<ReportPageNavigationProp>();
  const route = useRoute<ReportPageRouteProp>();
  const reportId = route.params?.reportId;
  
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
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
            
            <Text style={styles.title}>검사 결과 리포트</Text>
            <Text style={styles.subtitle}>
              종합적인 인지 기능 분석 결과입니다
            </Text>
          </View>

          {/* 리포트 정보 */}
          <View style={styles.reportInfo}>
            <Text style={styles.reportId}>리포트 ID: {reportId || 'N/A'}</Text>
            <Text style={styles.reportDate}>생성일: 2024-01-15</Text>
          </View>

          {/* 결과 요약 */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>검사 결과 요약</Text>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>AD8 검사</Text>
              <Text style={styles.summaryValue}>정상</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>대화 검사</Text>
              <Text style={styles.summaryValue}>양호</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>그림 검사</Text>
              <Text style={styles.summaryValue}>정상</Text>
            </View>
          </View>

          {/* 상세 분석 */}
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>상세 분석</Text>
            <Text style={styles.detailText}>
              현재 인지 기능은 전반적으로 양호한 상태입니다. 
              정기적인 검사를 통해 변화를 모니터링하는 것을 권장합니다.
            </Text>
          </View>

          {/* 권장사항 */}
          <View style={styles.recommendationCard}>
            <Text style={styles.recommendationTitle}>권장사항</Text>
            <Text style={styles.recommendationText}>
              • 규칙적인 운동과 건강한 식습관 유지
            </Text>
            <Text style={styles.recommendationText}>
              • 사회적 활동과 새로운 학습 기회 찾기
            </Text>
            <Text style={styles.recommendationText}>
              • 6개월 후 재검사 권장
            </Text>
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
      </ScrollView>
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
  
  scrollView: {
    flex: 1,
  },
  
  content: {
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
  
  reportInfo: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  
  reportId: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  
  reportDate: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  summaryTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.card,
  },
  
  summaryLabel: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  
  summaryValue: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.success,
  },
  
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  detailTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  
  detailText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  
  recommendationCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  recommendationTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  
  recommendationText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  
  actionContainer: {
    alignItems: 'center',
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

