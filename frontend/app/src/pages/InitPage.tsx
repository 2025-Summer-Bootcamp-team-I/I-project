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
import InitBackground from "../components/AppinitBackgrounds";

type InitPageNavigationProp = StackNavigationProp<RootStackParamList, "Init">;

interface SphereParticle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  originalX: number;
  originalY: number;
  originalZ: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * InitPage 컴포넌트 - 온보딩 페이지
 * 
 * React Native 스타일로 변환된 앱 시작 페이지입니다.
 * 사용자의 터치에 반응하고, 애니메이션 효과와 함께 시작 버튼을 보여줍니다.
 */
export default function InitPage() {
  const navigation = useNavigation<InitPageNavigationProp>();
  const [interactionCompleted, setInteractionCompleted] = useState(false);
  const [sphereParticles, setSphereParticles] = useState<SphereParticle[]>([]);
  const animations = useRef<Animated.CompositeAnimation[]>([]);
  
  // 애니메이션 값들
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const { width, height } = Dimensions.get('window');

  // 구 표면에 균등하게 점을 배치하는 함수
  const generateSpherePoints = (count: number, radius: number) => {
    const points: { x: number; y: number; z: number }[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // 황금각

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2; // y goes from 1 to -1
      const radius_at_y = Math.sqrt(1 - y * y); // radius at y
      const theta = phi * i; // golden angle increment

      const x = Math.cos(theta) * radius_at_y;
      const z = Math.sin(theta) * radius_at_y;

      points.push({
        x: x * radius,
        y: y * radius,
        z: z * radius,
      });
    }

    return points;
  };

  // 3D 회전 변환 함수
  const rotatePoint = (x: number, y: number, z: number, rotX: number, rotY: number) => {
    // Y축 회전
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;
    
    // X축 회전
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);
    const y2 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;
    
    return { x: x1, y: y2, z: z2 };
  };

  // 구 파티클 생성
  useEffect(() => {
    const createSphereParticles = () => {
      const particleCount = 150;
      const sphereRadius = Math.min(screenWidth, screenHeight) * 0.25;
      const spherePoints = generateSpherePoints(particleCount, sphereRadius);
      
      const newParticles: SphereParticle[] = [];
      
      spherePoints.forEach((point, i) => {
        const screenX = screenWidth / 2 + point.x;
        const screenY = screenHeight / 2 + point.y;
        
        newParticles.push({
          id: i,
          x: new Animated.Value(screenX),
          y: new Animated.Value(screenY),
          opacity: new Animated.Value(Math.random() * 0.6 + 0.4),
          scale: new Animated.Value(Math.random() * 0.5 + 0.5),
          originalX: point.x,
          originalY: point.y,
          originalZ: point.z,
        });
      });
      
      setSphereParticles(newParticles);
    };

    createSphereParticles();
  }, []);

  // 구 파티클 애니메이션
  useEffect(() => {
    if (sphereParticles.length === 0) return;

    // 파티클 애니메이션
    const newAnimations: Animated.CompositeAnimation[] = [];
    
    sphereParticles.forEach((particle, index) => {
      // 반짝임 애니메이션
      const twinkleAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(particle.opacity, {
            toValue: 0.3,
            duration: 1000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(particle.opacity, {
            toValue: 0.9,
            duration: 1000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
        ])
      );

      // 크기 변화 애니메이션
      const scaleAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(particle.scale, {
            toValue: 0.6,
            duration: 1500 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(particle.scale, {
            toValue: 1.4,
            duration: 1500 + Math.random() * 1000,
            useNativeDriver: true,
          }),
        ])
      );

      newAnimations.push(twinkleAnimation, scaleAnimation);
      
      twinkleAnimation.start();
      scaleAnimation.start();
    });
    
    animations.current = newAnimations;

    return () => {
      animations.current.forEach(animation => {
        animation.stop();
      });
    };
  }, [sphereParticles]);



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
   * 상호작용 완료 상태로 전환하고 구가 커지는 효과 추가
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

      // 반복적인 물결 효과 함수
      const createWaveEffect = () => {
        sphereParticles.forEach((particle, index) => {
          // 크기 확대 애니메이션
          const scaleUpAnimation = Animated.parallel([
            Animated.timing(particle.scale, {
              toValue: 3.0,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(particle.opacity, {
              toValue: 1.0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]);

          // 지연 시간을 다르게 하여 물결 효과 생성
          setTimeout(() => {
            scaleUpAnimation.start(() => {
              // 원래 크기로 복원
              Animated.parallel([
                Animated.timing(particle.scale, {
                  toValue: Math.random() * 0.5 + 0.5,
                  duration: 800,
                  useNativeDriver: true,
                }),
                Animated.timing(particle.opacity, {
                  toValue: Math.random() * 0.6 + 0.4,
                  duration: 800,
                  useNativeDriver: true,
                }),
              ]).start();
            });
          }, index * 8); // 각 파티클마다 8ms씩 지연 (물결 효과)
        });
      };

      // 첫 번째 물결 효과 시작
      createWaveEffect();

      // 2초마다 반복적으로 물결 효과 생성 (무한 반복)
      const waveInterval = setInterval(() => {
        createWaveEffect();
      }, 4000);

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
    <View style={styles.container}>
      {/* 별이 반짝이는 배경 */}
      <InitBackground />
      
      {/* 구 모양 파티클 */}
      <View style={styles.sphereContainer}>
        {sphereParticles.map((particle) => (
          <Animated.View
            key={particle.id}
            style={[
              styles.sphereParticle,
              {
                left: particle.x,
                top: particle.y,
                opacity: particle.opacity,
                transform: [{ scale: particle.scale }],
              },
            ]}
          />
        ))}
      </View>
      
      <TouchableOpacity
        style={styles.touchableContainer}
        activeOpacity={1}
        onPress={handleInteraction}
      >
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  
  touchableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },

  sphereContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0.5,
  },

  sphereParticle: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: '#8b5cf6',
    borderRadius: 3,
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