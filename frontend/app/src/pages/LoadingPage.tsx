import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, Text } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';

/**
 * A placeholder for the background component.
 * In a real app, you would replace this with your actual background component.
 */
const LoginBackground = () => (
  <View style={styles.loginBackground} />
);

/**
 * LoadingPage Component - Displays a galaxy-themed loading animation
 * during data analysis, implemented with React Native, Expo-GL, and Three.js.
 * This version is updated to match the original web implementation's animation logic.
 */
export default function LoadingPage() {
  // Ref to manage the animation frame request, to be cancelled on unmount
  const requestRef = useRef<number | null>(null);

  // Animated value for the pulsing text effect
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Creates a looping pulse animation for the text, matching the web version
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Cleanup function to cancel animation frame on unmount
    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  // Style for the animated text
  const animatedTextStyle = {
    transform: [{ scale: pulseAnimation }],
    opacity: pulseAnimation.interpolate({
        inputRange: [1, 1.025, 1.05],
        outputRange: [1, 0.8, 1]
    })
  };

  /**
   * onContextCreate is called once the GL context is available.
   * This is where we set up our Three.js scene and animations.
   */
  const onContextCreate = async (gl: any) => {
    // Scene, camera, and renderer setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );
    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.setClearColor(0x000000, 0); // Transparent background

    // --- Core ---
    const coreGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);
    
    // --- Glow Effect ---
    const createGlowTexture = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        if (!context) return null;

        const gradient = context.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.width / 2
        );
        gradient.addColorStop(0.1, 'rgba(255, 255, 255, 1.0)');
        gradient.addColorStop(0.4, 'rgba(196, 181, 253, 0.8)');
        gradient.addColorStop(1.0, 'rgba(139, 92, 246, 0.0)');

        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);

        return new THREE.CanvasTexture(canvas);
    };
    
    const glowTexture = createGlowTexture();
    let glowSprite: THREE.Sprite | null = null;
    if (glowTexture) {
        const glowMaterial = new THREE.SpriteMaterial({
            map: glowTexture,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.8,
        });
        glowSprite = new THREE.Sprite(glowMaterial);
        core.add(glowSprite);
    }

    // --- Orbits ---
    const orbitData = [
      { color: 0xc4b5fd, rotationX: 0.35, rotationY: 1.22, delay: 0 }, // 20deg, 70deg
      { color: 0xa78bfa, rotationX: 1.4,  rotationY: 1.22, delay: -1.5 }, // 80deg, 70deg
      { color: 0x8b5cf6, rotationX: 2.44, rotationY: 1.22, delay: -3.0 }, // 140deg, 70deg
    ];

    const orbitMeshes: THREE.Mesh[] = [];

    orbitData.forEach(data => {
      // orbitGroup은 CSS의 정적 `transform`과 동일하게 궤도의 초기 기울기를 설정합니다.
      const orbitGroup = new THREE.Group();
      orbitGroup.rotation.order = 'YXZ'; // CSS의 `rotateY(...) rotateX(...)` 순서와 일치
      orbitGroup.rotation.y = data.rotationY;
      orbitGroup.rotation.x = data.rotationX;
      scene.add(orbitGroup);

      const geometry = new THREE.TorusGeometry(2, 0.02, 16, 100);
      const material = new THREE.MeshBasicMaterial({
        color: data.color,
        wireframe: true,
      });
      const orbitMesh = new THREE.Mesh(geometry, material);
      // 애니메이션을 위한 회전 순서도 동일하게 설정합니다.
      orbitMesh.rotation.order = 'YXZ';
      
      orbitGroup.add(orbitMesh); // 기울어진 그룹에 메쉬를 추가합니다.
      orbitMeshes.push(orbitMesh); // 애니메이션을 적용할 메쉬를 배열에 저장합니다.
    });

    camera.position.z = 5;
    
    const clock = new THREE.Clock();

    // --- Animation Loop ---
    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // 코어의 펄스 애니메이션
      const pulseCycle = (elapsedTime * Math.PI) % (Math.PI * 2);
      const pulseFactor = (Math.cos(pulseCycle) + 1) / 2;
      const coreScale = 1.0 - pulseFactor * 0.2;
      const coreOpacity = 1.0 - pulseFactor * 0.3;
      core.scale.set(coreScale, coreScale, coreScale);
      (core.material as THREE.MeshBasicMaterial).opacity = coreOpacity;
      
      // 코어 빛 번짐 효과 애니메이션
      if (glowSprite) {
          const glowScale = 2.5 + pulseFactor * 1.5;
          glowSprite.scale.set(glowScale, glowScale, 1);
          glowSprite.material.opacity = 0.8 - pulseFactor * 0.4;
      }

      // --- 궤도 회전 애니메이션: `orbitRotate` 키프레임 적용 ---
      orbitMeshes.forEach((mesh, index) => {
        const { delay } = orbitData[index];
        // `animation-delay`를 적용합니다.
        const animationTime = elapsedTime + delay;
        // `animation: 10s linear infinite`에 맞춰 10초 주기로 360도 회전하는 각도를 계산합니다.
        const angle = (animationTime / 10) * Math.PI * 2;
        
        // `transform: rotateY(360deg) rotateX(360deg)` 로직을 적용합니다.
        // 기울어진 부모(orbitGroup) 내에서 메쉬 자체를 회전시킵니다.
        mesh.rotation.y = angle;
        mesh.rotation.x = angle;
      });

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    animate();
  };

  return (
    <>
      <LoginBackground />
      <View style={styles.wrapper}>
        <View style={styles.contentContainer}>
          <View style={styles.galaxyLoader}>
            <GLView
              style={{ flex: 1 }}
              onContextCreate={onContextCreate}
            />
          </View>
          <Animated.Text style={[styles.loadingText, animatedTextStyle]}>
            결과를 분석하고 있습니다...
          </Animated.Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  loginBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 0,
  },
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  galaxyLoader: {
    width: 300,
    height: 300,
  },
  loadingText: {
    fontFamily: 'sans-serif',
    fontSize: 24,
    marginTop: 48,
    color: '#d8b4fe',
    textAlign: 'center',
  },
});