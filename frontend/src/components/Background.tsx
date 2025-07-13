import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import styled from 'styled-components';

const CanvasBackground = styled.canvas`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
`;

const NeuralBackground: React.FC = () => {
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
    scene.background = new THREE.Color(0x020617);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraRef.current = camera;

    const initialCameraZ = 30;
    const surveyCameraZ = 18;
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

    const neuronCount = 100;
    const neuronPositions = new Float32Array(neuronCount * 3);
    for (let i = 0; i < neuronCount; i++) {
      neuronPositions[i * 3] = (Math.random() - 0.5) * 50;
      neuronPositions[i * 3 + 1] = (Math.random() - 0.5) * 50;
      neuronPositions[i * 3 + 2] = -Math.random() * 50;
    }

    const neuronGeometry = new THREE.BufferGeometry();
    neuronGeometry.setAttribute('position', new THREE.BufferAttribute(neuronPositions, 3));

    const neuronMaterial = new THREE.PointsMaterial({
      size: 0.8,
      color: 0x4f46e5,
      transparent: true,
      blending: THREE.AdditiveBlending,
      map: createCircleTexture('#818cf8', 512) || undefined,
      sizeAttenuation: true,
    });

    const neurons = new THREE.Points(neuronGeometry, neuronMaterial);
    group.add(neurons);

    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.15,
      linewidth: 1
    });
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions: number[] = [];

    for (let i = 0; i < neuronCount; i++) {
      for (let j = i + 1; j < neuronCount; j++) {
        const p1 = new THREE.Vector3(neuronPositions[i*3], neuronPositions[i*3+1], neuronPositions[i*3+2]);
        const p2 = new THREE.Vector3(neuronPositions[j*3], neuronPositions[j*3+1], neuronPositions[j*3+2]);
        if (p1.distanceTo(p2) < 10) {
          linePositions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
        }
      }
    }

    linePositionsRef.current = linePositions;
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    group.add(lines);

    const sparkCount = 20;
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
      size: 0.6,
      color: 0xfacc15,
      transparent: true,
      blending: THREE.AdditiveBlending,
      map: createCircleTexture('#fde047', 512) || undefined,
      sizeAttenuation: true,
    });

    const sparkSystem = new THREE.Points(sparkGeometry, sparkMaterial);
    group.add(sparkSystem);

    let isSurveyActive = false;
    const clock = new THREE.Clock();
    clockRef.current = clock;

    const animateBackground = () => {
      animationIdRef.current = requestAnimationFrame(animateBackground);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      if (isSurveyActive) {
        group.rotation.y += delta * 0.15;
        if (camera.position.z > surveyCameraZ) {
          camera.position.z -= delta * 12;
          if (camera.position.z < surveyCameraZ) camera.position.z = surveyCameraZ;
        }
      } else {
        group.rotation.y = elapsedTime * 0.05;
        if (camera.position.z < initialCameraZ) {
          camera.position.z += delta * 12;
          if (camera.position.z > initialCameraZ) camera.position.z = initialCameraZ;
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
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return <CanvasBackground ref={canvasRef} />;
};

export default NeuralBackground;
