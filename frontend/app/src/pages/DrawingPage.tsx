import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { colors, spacing, fontSize, borderRadius, commonStyles } from '../AppStyle';

type DrawingPageNavigationProp = StackNavigationProp<RootStackParamList, 'Drawing'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function DrawingPage() {
  const navigation = useNavigation<DrawingPageNavigationProp>();
  const [currentStep, setCurrentStep] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingCompleted, setDrawingCompleted] = useState(false);
  
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

  const drawingTasks = [
    {
      id: 1,
      title: '시계 그리기',
      description: '3시 40분을 가리키는 시계를 그려주세요',
      instruction: '원을 그리고, 숫자들을 배치한 후, 시침과 분침을 그려주세요.',
    },
    {
      id: 2,
      title: '집 그리기',
      description: '간단한 집을 그려주세요',
      instruction: '지붕, 벽, 문, 창문이 있는 집을 그려주세요.',
    },
    {
      id: 3,
      title: '나무 그리기',
      description: '나무를 그려주세요',
      instruction: '줄기와 잎이 있는 나무를 그려주세요.',
    },
  ];

  const handleStartDrawing = () => {
    setIsDrawing(true);
  };

  const handleCompleteDrawing = () => {
    setIsDrawing(false);
    setDrawingCompleted(true);
    
    Alert.alert(
      '그리기 완료',
      '그리기가 완료되었습니다. 다음 단계로 진행하시겠습니까?',
      [
        {
          text: '다시 그리기',
          onPress: () => {
            setDrawingCompleted(false);
          },
        },
        {
          text: '다음',
          onPress: () => {
            if (currentStep < drawingTasks.length - 1) {
              setCurrentStep(currentStep + 1);
              setDrawingCompleted(false);
            } else {
              handleFinishAllDrawings();
            }
          },
        },
      ]
    );
  };

  const handleFinishAllDrawings = () => {
    Alert.alert(
      '검사 완료',
      '모든 그리기 검사가 완료되었습니다.',
      [
        {
          text: '확인',
          onPress: () => navigation.navigate('Main'),
        },
      ]
    );
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setDrawingCompleted(false);
    } else {
      navigation.goBack();
    }
  };

  const currentTask = drawingTasks[currentStep];

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
          
          <Text style={styles.title}>그림 검사</Text>
          <Text style={styles.subtitle}>
            시각적 인지 기능을 평가합니다
          </Text>
        </View>

        {/* 진행률 */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: `${((currentStep + 1) / drawingTasks.length) * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {currentStep + 1} / {drawingTasks.length}
          </Text>
        </View>

        {/* 현재 작업 */}
        <View style={styles.taskContainer}>
          <Text style={styles.taskTitle}>{currentTask.title}</Text>
          <Text style={styles.taskDescription}>{currentTask.description}</Text>
          <Text style={styles.taskInstruction}>{currentTask.instruction}</Text>
        </View>

        {/* 그리기 영역 */}
        <View style={styles.drawingArea}>
          {!isDrawing ? (
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartDrawing}
              activeOpacity={0.8}
            >
              <Text style={styles.startButtonText}>그리기 시작</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.drawingCanvas}>
              <Text style={styles.drawingPlaceholder}>
                그리기 영역
              </Text>
              <Text style={styles.drawingHint}>
                여기에 {currentTask.title}을 그려주세요
              </Text>
              
              <TouchableOpacity
                style={styles.completeButton}
                onPress={handleCompleteDrawing}
                activeOpacity={0.8}
              >
                <Text style={styles.completeButtonText}>완료</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 안내 */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            • 정확성보다는 전체적인 구조를 그려주세요
          </Text>
          <Text style={styles.infoText}>
            • 시간 제한은 없으니 천천히 그려주세요
          </Text>
          <Text style={styles.infoText}>
            • 완료 후 다음 단계로 진행할 수 있습니다
          </Text>
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
    marginBottom: spacing.lg,
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
  
  progressContainer: {
    marginBottom: spacing.lg,
  },
  
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.card,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  
  progressText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  
  taskContainer: {
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
  
  taskTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  
  taskDescription: {
    fontSize: fontSize.lg,
    color: colors.text,
    marginBottom: spacing.md,
  },
  
  taskInstruction: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  
  drawingArea: {
    flex: 1,
    marginBottom: spacing.lg,
  },
  
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  
  drawingCanvas: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  
  drawingPlaceholder: {
    fontSize: fontSize.xxl,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  
  drawingHint: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  
  completeButton: {
    backgroundColor: colors.success,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    shadowColor: colors.success,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  
  completeButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  
  infoContainer: {
    padding: spacing.md,
    backgroundColor: 'rgba(106, 13, 173, 0.05)',
    borderRadius: borderRadius.md,
  },
  
  infoText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
});
  