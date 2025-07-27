import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../App";
import { colors, spacing, fontSize, borderRadius, commonStyles } from "../AppStyle";

type InitPageNavigationProp = StackNavigationProp<RootStackParamList, "Init">;

/**
 * InitPage 컴포넌트 - 온보딩 페이지
 * 
 * React Native 스타일로 변환된 앱 시작 페이지입니다.
 * 사용자의 터치에 반응하고, 애니메이션 효과와 함께 시작 버튼을 보여줍니다.
 */
export default function InitPage() {
  const navigation = useNavigation<InitPageNavigationProp>();
  const [interactionCompleted, setInteractionCompleted] = useState(false);
  
  // 애니메이션 값들
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const { width, height } = Dimensions.get('window');

  useEffect(() => {
    // 초기 애니메이션
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // 펄스 애니메이션
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    if (!interactionCompleted) {
      pulseAnimation.start();
    }

    return () => {
      pulseAnimation.stop();
    };
  }, [interactionCompleted]);

  /**
   * 화면 터치 시 처리 함수
   * 상호작용 완료 상태로 전환
   */
  const handleInteraction = () => {
    if (!interactionCompleted) {
      setInteractionCompleted(true);
      
      // 상호작용 완료 애니메이션
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  };

  /**
   * 시작 버튼 클릭 시 처리 함수
   * 로그인 페이지로 이동
   */
  const handleStart = () => {
    navigation.navigate("Login");
  };

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={1}
      onPress={handleInteraction}
    >
      {/* 배경 그라데이션 효과 */}
      <View style={styles.backgroundGradient} />
      
      {/* 메인 콘텐츠 */}
      <View style={styles.contentContainer}>
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.title}>당신의 두뇌 건강</Text>
          <Text style={styles.subtitle}>그 소중한 여정을 함께합니다</Text>
        </Animated.View>

        {/* 상호작용 프롬프트 */}
        {!interactionCompleted && (
          <Animated.View
            style={[
              styles.promptContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Text style={styles.promptText}>뇌를 터치하여 활성화하세요</Text>
          </Animated.View>
        )}

        {/* 시작 버튼 */}
        {interactionCompleted && (
          <Animated.View
            style={[
              styles.buttonContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStart}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>검사 시작</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    // 실제 그라데이션은 LinearGradient 컴포넌트를 사용해야 하지만,
    // 여기서는 단순한 배경색으로 대체
  },
  
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing.xxl,
  },
  
  titleContainer: {
    alignItems: 'center',
    marginTop: -spacing.xxl,
  },
  
  title: {
    fontSize: fontSize.title,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  
  subtitle: {
    fontSize: fontSize.subtitle,
    fontWeight: '300',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  
  promptContainer: {
    position: 'absolute',
    bottom: '35%',
    alignItems: 'center',
  },
  
  promptText: {
    fontSize: fontSize.lg,
    fontWeight: '300',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  
  buttonContainer: {
    position: 'absolute',
    bottom: '30%',
    alignItems: 'center',
  },
  
  startButton: {
    backgroundColor: colors.text,
    borderRadius: borderRadius.round,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    shadowColor: colors.text,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  buttonText: {
    color: colors.background,
    fontSize: fontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
});