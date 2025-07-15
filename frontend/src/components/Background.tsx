import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import styled from 'styled-components';

const CanvasBackground = styled.canvas`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1; /* 배경으로 유지 */
`;

// children을 감싸고 배경 위에 렌더링될 컨테이너
const ContentWrapper = styled.div`
  position: relative; /* 자식 요소들이 이 컨테이너 내에서 상대적으로 배치될 수 있도록 */
  z-index: 1; /* 배경 위에 나타나도록 */
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;

  & > * {
    pointer-events: auto;
  }
`;

const NeuralBackground: React.FC<{ children?: React.ReactNode, isSurveyActive?: boolean }> = ({ children, isSurveyActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const clockRef = useRef<THREE.Clock | null>(null);
  const sparksRef = useRef<any[]>([]);
  const linePositionsRef = useRef<number[]>([]);
  const sparkGeometryRef = useRef<THREE.BufferGeometry | null>(null);
  const sparkPositionsRef = useRef<Float32Array | null>(null);

  const createCircleTexture = (color: string, size: number) => {
    const matCanvas = document.createElement('canvas');
    matCanvas.width = matCanvas.height = size;
    const matContext = matCanvas.getContext('2d');
    if (!matContext) return null;

    const center = size / 2;
    const gradient = matContext.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'transparent');
    matContext.fillStyle = gradient;
    matContext.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(matCanvas);
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617); // 배경색 다시 추가
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 1000); // fov 100으로 변경
    cameraRef.current = camera;

    const initialCameraZ = 20; // 카메라 초기 Z 위치 20으로 변경
    const surveyCameraZ = 10; // 카메라 활성화 시 Z 위치 10으로 변경
    camera.position.z = initialCameraZ;

    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current, 
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    rendererRef.current = renderer;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const group = new THREE.Group();
    groupRef.current = group;
    scene.add(group);

    const neuronCount = 120; // 뉴런 개수 120으로 증가
    const neuronPositions = new Float32Array(neuronCount * 3);
    for (let i = 0; i < neuronCount; i++) {
      neuronPositions[i * 3] = (Math.random() - 0.5) * 50; // X 범위 50으로 원상 복구
      neuronPositions[i * 3 + 1] = (Math.random() - 0.5) * 50; // Y 범위 50으로 원상 복구
      neuronPositions[i * 3 + 2] = (Math.random() - 0.5) * 50; // Z 범위 -25에서 25로 변경
    }

    const neuronGeometry = new THREE.BufferGeometry();
    neuronGeometry.setAttribute('position', new THREE.BufferAttribute(neuronPositions, 3));

    const neuronMaterial = new THREE.PointsMaterial({
      size: 0.2, // 뉴런 크기 0.2로 변경
      color: 0x4f46e5,
      transparent: true,
      blending: THREE.AdditiveBlending,
      map: createCircleTexture('#818cf8', 256) || undefined, // 크기 256으로 조정
      sizeAttenuation: true,
    });

    const neurons = new THREE.Points(neuronGeometry, neuronMaterial);
    group.add(neurons);

    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0xffffff, // 흰색으로 변경
      transparent: true, 
      opacity: 0.08, // 투명도 0.08로 변경
      linewidth: 0.00001
    });
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions: number[] = [];

    for (let i = 0; i < neuronCount; i++) {
      for (let j = i + 1; j < neuronCount; j++) {
        const p1 = new THREE.Vector3(neuronPositions[i*3], neuronPositions[i*3+1], neuronPositions[i*3+2]);
        const p2 = new THREE.Vector3(neuronPositions[j*3], neuronPositions[j*3+1], neuronPositions[j*3+2]);
        if (p1.distanceTo(p2) < 10) { // 거리 10으로 변경
          linePositions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
        }
      }
    }

    linePositionsRef.current = linePositions;
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    group.add(lines);

    const sparkCount = 20; // 스파크 개수 20으로 원상 복구
    const sparks: any[] = [];
    for (let i = 0; i < sparkCount; i++) {
      const baseSpeed = 0.005 + Math.random() * 0.01;
      sparks.push({
        lineIndex: Math.floor(Math.random() * (linePositions.length / 6)),
        progress: Math.random(),
        speed: baseSpeed,
        baseSpeed: baseSpeed,
      });
    }
    sparksRef.current = sparks;

    const sparkGeometry = new THREE.BufferGeometry();
    sparkGeometryRef.current = sparkGeometry;
    const sparkPositions = new Float32Array(sparkCount * 3);
    sparkPositionsRef.current = sparkPositions;
    sparkGeometry.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));

    const sparkMaterial = new THREE.PointsMaterial({
      size: 0.2, // 스파크 크기 0.2로 변경
      color: 0xfacc15,
      transparent: true,
      blending: THREE.AdditiveBlending,
      map: createCircleTexture('#fde047', 256) || undefined, // 크기 256으로 조정
      sizeAttenuation: true,
    });

    const sparkSystem = new THREE.Points(sparkGeometry, sparkMaterial);
    group.add(sparkSystem);

    const clock = new THREE.Clock();
    clockRef.current = clock;

    const animateBackground = () => {
      animationIdRef.current = requestAnimationFrame(animateBackground);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // isSurveyActive prop에 따라 그룹 회전 속도와 카메라 Z 위치 제어
      if (isSurveyActive) {
        group.rotation.y += delta * 0.1; // 회전 속도 0.1로 변경
        if (camera.position.z > surveyCameraZ) {
          camera.position.z -= delta * 12;
          if (camera.position.z < surveyCameraZ) camera.position.z = surveyCameraZ;
        } else if (camera.position.z < surveyCameraZ) { // 카메라가 surveyCameraZ보다 작을 경우 다시 늘어나도록
          camera.position.z += delta * 12;
          if (camera.position.z > surveyCameraZ) camera.position.z = surveyCameraZ;
        }
      } else {
        group.rotation.y = elapsedTime * 0.05;
        if (camera.position.z < initialCameraZ) {
          camera.position.z += delta * 12;
          if (camera.position.z > initialCameraZ) camera.position.z = initialCameraZ;
        } else if (camera.position.z > initialCameraZ) { // 카메라가 initialCameraZ보다 클 경우 다시 줄어들도록
          camera.position.z -= delta * 12;
          if (camera.position.z < initialCameraZ) camera.position.z = initialCameraZ;
        }
      }

      sparks.forEach((spark, index) => {
        spark.progress += spark.speed;
        if (spark.progress >= 1) {
          spark.progress = 0;
          spark.lineIndex = Math.floor(Math.random() * (linePositions.length / 6));
        }
        const p1_idx = spark.lineIndex * 6;
        const p2_idx = p1_idx + 3;
        if (p1_idx >= linePositions.length || p2_idx >= linePositions.length) return;
        const p1 = new THREE.Vector3(linePositions[p1_idx], linePositions[p1_idx+1], linePositions[p1_idx+2]);
        const p2 = new THREE.Vector3(linePositions[p2_idx], linePositions[p2_idx+1], linePositions[p2_idx+2]);
        const currentPos = p1.lerp(p2, spark.progress);
        const sparkIdx = index * 3;
        sparkPositions[sparkIdx] = currentPos.x;
        sparkPositions[sparkIdx+1] = currentPos.y;
        sparkPositions[sparkIdx+2] = currentPos.z;
      });

      if (sparkGeometry.attributes.position) {
        sparkGeometry.attributes.position.needsUpdate = true;
      }
      renderer.render(scene, camera);
    };

    animateBackground();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      renderer.dispose();
      scene.clear();
      window.removeEventListener('resize', handleResize);
    };
  }, [isSurveyActive]); // isSurveyActive prop이 변경될 때 useEffect 재실행

  return (
    <>
      <CanvasBackground ref={canvasRef} />
      {children && <ContentWrapper>{children}</ContentWrapper>}
    </>
  );
};

export default NeuralBackground;