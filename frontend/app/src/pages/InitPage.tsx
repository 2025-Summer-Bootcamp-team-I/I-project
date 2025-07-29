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
import { colors, spacing, fontSize } from "../AppStyle";
import InitBackground from "../components/AppinitBackground";
import { GLView, ExpoWebGLRenderingContext } from "expo-gl";
import * as THREE from "three";

type InitPageNavigationProp = StackNavigationProp<RootStackParamList, "Init">;

// 파티클의 정적 데이터를 담는 타입
interface BrainParticleData {
  originalPos: THREE.Vector3;
  originalRadius: number;
  color: THREE.Color;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * InitPage 컴포넌트 - 고성능 파티클 브레인 애니메이션이 포함된 온보딩 페이지입니다.
 * 이 버전은 expo-gl과 three.js를 사용하여 GPU에서 파티클 애니메이션을 렌더링함으로써,
 * 수많은 Animated.View 컴포넌트 사용으로 인한 성능 문제를 해결합니다.
 */
export default function InitPage() {
  const navigation = useNavigation<InitPageNavigationProp>();
  const [interactionCompleted, setInteractionCompleted] = useState(false);
  
  // 애니메이션 루프 내에서 최신 상태를 참조하기 위한 Ref
  const interactionCompletedRef = useRef(interactionCompleted);
  interactionCompletedRef.current = interactionCompleted;

  // 애니메이션 및 인터랙션 상태 Ref
  const animationFrameId = useRef<number | null>(null);
  const touchPos = useRef({ x: -1000, y: -1000 }).current;
  const particleData = useRef<BrainParticleData[]>([]);
  const pointsRef = useRef<THREE.Points | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const elapsedTime = useRef(0);
  const interactionTime = useRef<number | null>(null);


  // UI 애니메이션 Ref
  const titleFadeAnim = useRef(new Animated.Value(0)).current;
  const titleSlideAnim = useRef(new Animated.Value(20)).current;
  const buttonFadeAnim = useRef(new Animated.Value(0)).current;
  const buttonSlideAnim = useRef(new Animated.Value(20)).current;
  const promptPulseAnim = useRef(new Animated.Value(1)).current;

  // 터치 인터랙션을 위한 PanResponder
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
        touchPos.x = -1000;
        touchPos.y = -1000;
      },
    })
  ).current;

  // UI 애니메이션 및 인터랙션 로직
  // 1. 초기 UI(제목, 부제) 페이드인 (한 번만 실행)
  useEffect(() => {
    Animated.parallel([
      Animated.timing(titleFadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(titleSlideAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
    ]).start();
  }, []);

  // 2. 프롬프트 텍스트 깜빡임 애니메이션
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(promptPulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
        Animated.timing(promptPulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );

    if (!interactionCompleted) {
      pulseAnimation.start();
    } else {
      pulseAnimation.stop();
    }

    return () => pulseAnimation.stop();
  }, [interactionCompleted]);

  // 컴포넌트 언마운트 시 애니메이션 프레임 정리
  useEffect(() => {
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  const handleInteraction = () => {
    if (!interactionCompleted) {
      setInteractionCompleted(true);
      interactionTime.current = elapsedTime.current; // 상호작용 시간 기록
      
      // 시작 버튼 애니메이션
      Animated.parallel([
        Animated.timing(buttonFadeAnim, { toValue: 1, duration: 1000, delay: 300, useNativeDriver: true }),
        Animated.timing(buttonSlideAnim, { toValue: 0, duration: 1000, delay: 300, useNativeDriver: true }),
      ]).start();
    }
  };

  const handleStart = () => {
    navigation.navigate("Login");
  };

  /**
   * onContextCreate: Three.js 씬을 설정하는 핵심 함수입니다.
   * GL 컨텍스트가 준비되면 한 번 호출됩니다.
   */
  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    // 1. Scene, Camera, Renderer 설정
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(75, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 1000);
    camera.position.z = 30; // 카메라를 뒤로 이동하여 애니메이션을 작게 보이게 함
    
    const renderer = new THREE.WebGLRenderer({
      canvas: (gl as any).canvas,
      alpha: true,
    });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

    // 2. 파티클 생성
    const particleCount = 1800;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    const colorInside = new THREE.Color("#6a0dad");
    const colorOutside = new THREE.Color("#0077ff");

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos((Math.random() * 2) - 1);
      // 반경을 줄여 애니메이션 크기 축소
      let radius = 6 + (Math.random() - 0.5) * 3;
      radius += Math.sin(theta * 6) * Math.cos(phi * 8) * 1.0;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      const newParticleData: BrainParticleData = {
        originalPos: new THREE.Vector3(x, y, z),
        originalRadius: radius,
        // 변경된 반경 범위에 맞게 색상 보간 조정
        color: new THREE.Color().lerpColors(colorInside, colorOutside, Math.max(0, Math.min(1, (radius - 4.5) / 4.5)))
      };
      
      particleData.current.push(newParticleData);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      colors[i * 3] = newParticleData.color.r;
      colors[i * 3 + 1] = newParticleData.color.g;
      colors[i * 3 + 2] = newParticleData.color.b;
    }

    // 3. BufferGeometry 및 Points 생성
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.12, // 파티클 크기 축소
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    pointsRef.current = points;
    scene.add(points);

    // 4. 애니메이션 루프
    let lastTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      elapsedTime.current += delta;
      lastTime = now;

      const p = pointsRef.current;
      if (p) {
        // 상호작용 상태에 따라 회전 속도 변경
        p.rotation.y = elapsedTime.current * (interactionCompletedRef.current ? 0.25 : 0.1);

        const positionAttribute = p.geometry.getAttribute('position') as THREE.BufferAttribute;
        
        // 펼쳐지는 효과를 위한 전환 계산
        const SPREAD_DURATION = 1.5; // 펼쳐지는 애니메이션 지속 시간 (초)
        let spreadProgress = 0.0;
        if (interactionCompletedRef.current && interactionTime.current !== null) {
            const timeSinceInteraction = elapsedTime.current - interactionTime.current;
            spreadProgress = Math.min(1.0, timeSinceInteraction / SPREAD_DURATION);
        }
        // 부드러운 애니메이션을 위한 Easing 함수
        const easedSpreadProgress = spreadProgress * spreadProgress * (3 - 2 * spreadProgress);

        for (let i = 0; i < particleCount; i++) {
          const data = particleData.current[i];
          const currentPos = new THREE.Vector3().copy(data.originalPos);
          let currentRadius = data.originalRadius;

          // 터치 전 동적 효과 계산 (파도 & 터치)
          const waveFactor = Math.sin(data.originalRadius * 0.5 - elapsedTime.current * 2) * 0.2;
          
          const tempPos = new THREE.Vector3().copy(currentPos).applyMatrix4(p.matrixWorld);
          const projectedPos = tempPos.project(camera);
          const screenX = (projectedPos.x * 0.5 + 0.5) * screenWidth;
          const screenY = (-projectedPos.y * 0.5 + 0.5) * screenHeight;

          const dx = screenX - touchPos.x;
          const dy = screenY - touchPos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const mouseFactor = Math.max(0, 1 - dist / 200);
          const touchFactor = mouseFactor * 2.0;
          
          // 상호작용에 따라 동적 효과를 부드럽게 제거하여 펼쳐지는 느낌을 줌
          const dynamicOffset = (waveFactor + touchFactor) * (1.0 - easedSpreadProgress);
          currentRadius += dynamicOffset;
          
          currentPos.normalize().multiplyScalar(currentRadius);
          positionAttribute.setXYZ(i, currentPos.x, currentPos.y, currentPos.z);
        }
        positionAttribute.needsUpdate = true;
      }
      
      renderer.render(scene, camera);
      gl.endFrameEXP();

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();
  };

  return (
    <View style={styles.container}>
      <InitBackground />

      <GLView
        style={StyleSheet.absoluteFill}
        onContextCreate={onContextCreate}
      />

      <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
        <TouchableOpacity
          style={styles.touchableContainer}
          activeOpacity={1}
          onPress={handleInteraction}
        >
          <View style={styles.contentContainer}>
            <Animated.View style={{ opacity: titleFadeAnim, transform: [{ translateY: titleSlideAnim }] }}>
              <Text style={styles.title}>당신의 두뇌 건강</Text>
              <Text style={styles.subtitle}>그 소중한 여정을 함께합니다</Text>
            </Animated.View>

            {!interactionCompleted && (
              <Animated.View style={[styles.promptContainer, { opacity: titleFadeAnim, transform: [{ scale: promptPulseAnim }] }]}>
                <Text style={styles.promptText}>뇌를 터치하여 활성화하세요</Text>
              </Animated.View>
            )}

            {interactionCompleted && (
              <Animated.View style={[styles.buttonContainer, { opacity: buttonFadeAnim, transform: [{ translateY: buttonSlideAnim }] }]}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
//재pr용 주석