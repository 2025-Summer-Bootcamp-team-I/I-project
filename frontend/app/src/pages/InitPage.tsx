import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../App";
import { colors, spacing, fontSize, borderRadius } from "../AppStyle";
import InitBackground from "../components/AppinitBackground";

type InitPageNavigationProp = StackNavigationProp<RootStackParamList, "Init">;

// 파티클의 3D 위치와 애니메이션 값을 관리하는 인터페이스
interface BrainParticle {
  id: number;
  originalPos: { x: number; y: number; z: number };
  originalRadius: number;
  color: string;
  // 애니메이션 값들
  animTranslate: Animated.ValueXY; // 화면상 2D 위치
  animScale: Animated.Value;       // 깊이감 및 크기 변화
  animOpacity: Animated.Value;     // 투명도
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
// 3D -> 2D 투영을 위한 상수
const PERSPECTIVE = screenWidth * 1.2; 
const Z_SCALE = 15; // 파티클의 Z 위치에 따른 크기 조절

/**
 * AppInitPage 컴포넌트 - 온보딩 페이지 (웹 버전 파티클 효과 적용)
 * * 웹 버전의 Three.js 뇌 파티클 효과를 React Native Animated API로 구현합니다.
 * 3D 회전, 깊이감, 터치 인터랙션, 파도 효과 등을 시뮬레이션합니다.
 */
export default function InitPage() {
  const navigation = useNavigation<InitPageNavigationProp>();
  const [interactionCompleted, setInteractionCompleted] = useState(false);
  const [particles, setParticles] = useState<BrainParticle[]>([]);

  // 애니메이션 및 인터랙션 상태를 관리하는 Ref
  const animationFrameId = useRef<number | null>(null);
  const elapsedTime = useRef(0);
  const lastTime = useRef(performance.now()); // lastTime을 useRef로 선언
  const touchPos = useRef({ x: -1000, y: -1000 }).current; // 터치 위치 (애니메이션 불필요)

  // UI 등장 애니메이션
  const uiFadeAnim = useRef(new Animated.Value(0)).current;
  const uiSlideAnim = useRef(new Animated.Value(20)).current;
  const promptPulseAnim = useRef(new Animated.Value(1)).current;

  // 터치 입력을 감지하는 PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        if (!interactionCompleted) {
          touchPos.x = gestureState.moveX;
          touchPos.y = gestureState.moveY;
        }
      },
      onPanResponderRelease: () => {
        // 터치가 끝나면 터치 위치를 화면 밖으로 이동시켜 효과를 제거
        touchPos.x = -1000;
        touchPos.y = -1000;
      },
    })
  ).current;

  // 1. 파티클 생성 (웹 버전 로직 기반)
  useEffect(() => {
    const particleCount = 1800; // 파티클 개수 (모바일 환경에 맞게 조절)
    const newParticles: BrainParticle[] = [];
    
    // 웹 버전과 동일한 색상 (보라색 -> 파란색)
    const colorInside = { r: 106, g: 13, b: 173 };   // #6a0dad
    const colorOutside = { r: 0, g: 119, b: 255 };  // #0077ff

    for (let i = 0; i < particleCount; i++) {
      // 구면 좌표계를 사용하여 뇌 모양의 울퉁불퉁한 표면 생성 (웹 버전과 동일)
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos((Math.random() * 2) - 1);
      let radius = 8 + (Math.random() - 0.5) * 4;
      radius += Math.sin(theta * 6) * Math.cos(phi * 8) * 1.5;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      // 반지름에 따라 색상을 선형 보간 (웹 버전과 동일)
      const colorRatio = Math.max(0, Math.min(1, (radius - 6) / 6));
      const r = colorInside.r + (colorOutside.r - colorInside.r) * colorRatio;
      const g = colorInside.g + (colorOutside.g - colorInside.g) * colorRatio;
      const b = colorInside.b + (colorOutside.b - colorInside.b) * colorRatio;

      newParticles.push({
        id: i,
        originalPos: { x, y, z },
        originalRadius: radius,
        color: `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`,
        animTranslate: new Animated.ValueXY({ x: screenWidth / 2, y: screenHeight / 2 }),
        animScale: new Animated.Value(0),
        animOpacity: new Animated.Value(0.8),
      });
    }
    setParticles(newParticles);
  }, []);

  // 2. 메인 애니메이션 루프
  useEffect(() => {
    if (particles.length === 0) return;

    let isRunning = true;
    // const lastTime = { current: performance.now() }; // 기존 선언 제거

    const animate = () => {
      if (!isRunning) return;

      const now = performance.now();
      const delta = (now - lastTime.current) / 1000; // lastTime.current 사용
      elapsedTime.current += delta;
      lastTime.current = now; // lastTime.current 업데이트

      // 상호작용 상태에 따라 회전 속도 변경
      const rotationY = elapsedTime.current * (interactionCompleted ? 0.25 : 0.1);
      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);

      particles.forEach(p => {
        // --- 3D 변환 ---

        // 1. Y축 회전
        const rotatedX = p.originalPos.x * cosY + p.originalPos.z * sinY;
        const rotatedY = p.originalPos.y;
        const rotatedZ = -p.originalPos.x * sinY + p.originalPos.z * cosY;

        let currentRadius = p.originalRadius;
        
        // 2. 상호작용 전 효과 (파도 & 터치)
        if (!interactionCompleted) {
          // 파도 효과
          const waveFactor = Math.sin(p.originalRadius * 0.5 - elapsedTime.current * 2);
          currentRadius += waveFactor * 0.2;

          // 터치 반응 효과 (2D 거리 기반으로 근사)
          const dx = (screenWidth / 2 + rotatedX * Z_SCALE) - touchPos.x;
          const dy = (screenHeight / 2 + rotatedY * Z_SCALE) - touchPos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const mouseFactor = Math.max(0, 1 - dist / 200); // 터치 지점과의 거리에 따른 영향
          currentRadius += mouseFactor * 2.0;
        }

        const radiusScaledX = rotatedX * (currentRadius / p.originalRadius);
        const radiusScaledY = rotatedY * (currentRadius / p.originalRadius);
        const radiusScaledZ = rotatedZ * (currentRadius / p.originalRadius);

        // --- 2D 투영 ---
        const projectionScale = PERSPECTIVE / (PERSPECTIVE + radiusScaledZ * Z_SCALE);
        const screenX = screenWidth / 2 + radiusScaledX * Z_SCALE * projectionScale;
        const screenY = screenHeight / 2 + radiusScaledY * Z_SCALE * projectionScale;
        
        // --- 애니메이션 값 업데이트 ---
        // 루프 내에서는 setValue를 사용하여 성능 최적화
        p.animTranslate.setValue({ x: screenX, y: screenY });
        p.animScale.setValue(projectionScale * 1.8); // Z 위치에 따라 크기 조절
        p.animOpacity.setValue(projectionScale * 0.9); // Z 위치에 따라 투명도 조절
      });

      animationFrameId.current = requestAnimationFrame(animate);
    };

    // 애니메이션 시작
    animate();

    // 컴포넌트 언마운트 시 정리
    return () => {
      isRunning = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [particles, interactionCompleted]);

  // 3. UI 애니메이션 및 상호작용 처리
  useEffect(() => {
    // UI 요소 페이드인
    Animated.parallel([
      Animated.timing(uiFadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(uiSlideAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
    ]).start();

    // 상호작용 전 안내 문구 깜빡임 효과
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(promptPulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
        Animated.timing(promptPulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );

    if (!interactionCompleted) {
      pulseAnimation.start();
    }

    return () => pulseAnimation.stop();
  }, [interactionCompleted]);

  // 화면 터치 시 상호작용 완료 처리
  const handleInteraction = () => {
    if (!interactionCompleted) {
      setInteractionCompleted(true);
      
      // 버튼 표시를 위한 애니메이션
      uiFadeAnim.setValue(0);
      uiSlideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(uiFadeAnim, { toValue: 1, duration: 1000, delay: 300, useNativeDriver: true }),
        Animated.timing(uiSlideAnim, { toValue: 0, duration: 1000, delay: 300, useNativeDriver: true }),
      ]).start();
    }
  };

  const handleStart = () => {
    navigation.navigate("Login");
  };



  return (
    <View style={styles.container}>
      <InitBackground />

      {/* 파티클 컨테이너 */}
      <View style={StyleSheet.absoluteFill}>
        {particles.map(p => (
          <Animated.View
            key={p.id}
            style={[
              styles.particle,
              {
                backgroundColor: p.color,
                opacity: p.animOpacity,
                transform: [
                  // translateX/Y는 left/top보다 성능이 우수
                  { translateX: p.animTranslate.x },
                  { translateY: p.animTranslate.y },
                  { scale: p.animScale },
                ],
              },
            ]}
          />
        ))}
      </View>

      {/* 터치 및 UI 컨테이너 */}
      <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
        <TouchableOpacity
          style={styles.touchableContainer}
          activeOpacity={1}
          onPress={handleInteraction}
        >
          <View style={styles.contentContainer}>
            <Animated.View style={{ opacity: uiFadeAnim, transform: [{ translateY: uiSlideAnim }] }}>
              <Text style={styles.title}>당신의 두뇌 건강</Text>
              <Text style={styles.subtitle}>그 소중한 여정을 함께합니다</Text>
            </Animated.View>

            {!interactionCompleted && (
              <Animated.View style={[styles.promptContainer, { opacity: uiFadeAnim, transform: [{ scale: promptPulseAnim }] }]}>
                <Text style={styles.promptText}>뇌를 터치하여 활성화하세요</Text>
              </Animated.View>
            )}

            {interactionCompleted && (
              <Animated.View style={[styles.buttonContainer, { opacity: uiFadeAnim, transform: [{ translateY: uiSlideAnim }] }]}>
                <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.8}>
                  <Text style={styles.buttonText}>검사 시작</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// 스타일 (웹 버전과 유사한 느낌으로 일부 수정)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  particle: {
    position: 'absolute',
    // left/top 대신 transform으로 위치를 제어
    left: -0.75,
    top: -0.75,
    width: 1.5,
    height: 1.5,
    borderRadius: 0.75,
  },
  touchableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: '10%',
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
    marginTop: '-15%',
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
    bottom: '30%',
  },
  promptText: {
    fontSize: fontSize.lg,
    fontWeight: '300',
    color: colors.textSecondary,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: '25%',
  },
  startButton: {
    backgroundColor: 'white',
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  buttonText: {
    color: '#0c0a1a',
    fontSize: fontSize.lg,
    fontWeight: '700',
  },

});
