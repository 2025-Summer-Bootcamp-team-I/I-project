import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { colors, spacing, fontSize, borderRadius } from '../AppStyle';
import { submitAD8 } from '../api';
import { useReportIdStore } from '../store/reportIdStore';
import useAD8TestStore from '../../src/store/testStore';
import Svg, { Path } from 'react-native-svg';
import AppHeader from '../components/AppHeader';
import BottomBar from '../components/BottomBar';

type AD8PageNavigationProp = StackNavigationProp<RootStackParamList, 'AD8'>;

export default function AD8Page() {
  const navigation = useNavigation<AD8PageNavigationProp>();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setResponse, completeTest } = useAD8TestStore();
  const { reportId, setAD8Completed } = useReportIdStore();

  const questions = [
    "판단력에 문제가 생겼습니까?",
    "어떤 일에 대한 흥미가 줄었습니까?",
    "같은 질문이나 이야기를 반복합니까?",
    "새로운 것을 배우는 데 어려움이 있습니까?",
    "오늘이 몇 월 며칠인지 잘 모릅니까?",
    "재정 문제를 처리하는 데 어려움이 있습니까?",
    "약속을 기억하는 데 어려움이 있습니까?",
    "생각이나 기억력에 매일 어려움을 겪습니까?"
  ];

  const handleAnswer = async (answer: boolean) => {
    if (isSubmitting) return;

    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    setResponse(currentQuestionIndex + 1, answer);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      completeTest();
      setIsSubmitting(true);
      try {
        if (!reportId) {
          Alert.alert("오류", "리포트 ID를 찾을 수 없습니다. 메인 페이지에서 다시 시도해주세요.");
          navigation.navigate('Main' as any);
          return;
        }

        // 최신 responses 상태를 직접 가져옴
        const latestResponses = useAD8TestStore.getState().responses;

        const ad8Data = {
          report_id: reportId,
          responses: latestResponses.map((r: any) => ({ questionNo: r.question_no, isCorrect: r.is_correct }))
        };

        await submitAD8(ad8Data);
        setAD8Completed(true);
        setShowResult(true);
      } catch (error) {
        Alert.alert("오류", "결과 제출에 실패했습니다. 다시 시도해주세요.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const score = answers.filter(ans => ans).length;

  return (
    <View style={styles.container}>
      {/* 배경 */}
      <View style={styles.background} />

      <AppHeader />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>AD-8 설문 검사</Text>
        <Text style={styles.subtitle}>최근 1년 동안의 변화에 해당되면 '예'를 선택해주세요.</Text>

        {!showResult ? (
          <>
            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>진행도</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progress, { width: `${(currentQuestionIndex / questions.length) * 100}%` }]} />
              </View>
            </View>

            <View style={styles.questionCard}>
              <Text style={styles.questionNumber}>질문 {currentQuestionIndex + 1}/{questions.length}</Text>
              <Text style={styles.question}>{questions[currentQuestionIndex]}</Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.answerButton}
                  onPress={() => handleAnswer(true)}
                  disabled={isSubmitting}
                >
                  <Text style={styles.answerButtonText}>예</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.answerButton}
                  onPress={() => handleAnswer(false)}
                  disabled={isSubmitting}
                >
                  <Text style={styles.answerButtonText}>아니오</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>검사가 완료되었습니다.</Text>
            <Text style={styles.resultScore}>
              당신의 점수는 <Text style={styles.score}>{score}점</Text> 입니다.
            </Text>
            <Text style={[styles.resultMessage, score < 2 && styles.goodMessage]}>
              {score >= 2
                ? "인지 기능 저하가 의심됩니다. 전문가와 상담을 권장합니다."
                : "현재 인지 기능은 양호한 것으로 보입니다."}
            </Text>
            <TouchableOpacity
              style={styles.homeButton}
              onPress={() => navigation.navigate('Main' as any)}
            >
              <Text style={styles.homeButtonText}>메인으로 돌아가기</Text>
            </TouchableOpacity>
          </View>
        )}

        <BottomBar currentPage="AD8" />
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

  content: {
    flex: 1,
  },

  contentContainer: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl * 4.5,
    alignItems: 'center',
  },

  title: {
    fontSize: fontSize.xxl,
    fontWeight: '600',
    color: '#5EEAD4',
    textAlign: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.xxl * 2,
    letterSpacing: -1.2,
  },

  subtitle: {
    fontSize: fontSize.md,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: spacing.xl,
  },

  progressContainer: {
    width: '90%',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },

  progressLabel: {
    color: '#94a3b8',
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },

  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },

  progress: {
    height: 6,
    backgroundColor: '#2DD4BF',
    borderRadius: 3,
  },

  questionCard: {
    backgroundColor: '#131828',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1.7,
    borderColor: '#96E7D422',
    width: '90%',
    shadowColor: '#96e7d4',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 38,
    elevation: 10,
  },

  questionNumber: {
    color: '#9CA3AF',
    fontSize: fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  question: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: 28,
    letterSpacing: -0.5,
  },

  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.lg,
    justifyContent: 'center',
  },

  answerButton: {
    flex: 1,
    backgroundColor: '#113742',
    borderRadius: borderRadius.round,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    maxWidth: 140,
    borderWidth: 1,
    borderColor: '#125E60',
  },

  answerButtonText: {
    color: '#99F6E4',
    fontSize: fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
  },

  resultCard: {
    backgroundColor: '#131828',
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    borderWidth: 1.7,
    borderColor: '#96E7D422',
    width: '100%',
    alignItems: 'center',
  },

  resultTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  resultScore: {
    fontSize: fontSize.lg,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  score: {
    color: '#96E7D4',
    fontWeight: '700',
  },

  resultMessage: {
    fontSize: fontSize.md,
    color: '#f87171',
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: 24,
  },

  goodMessage: {
    color: '#96E7D4',
  },

  homeButton: {
    backgroundColor: '#96E7D4',
    borderRadius: borderRadius.round,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },

  homeButtonText: {
    color: '#131828',
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
