import { useEffect, useRef } from "react";
import * as THREE from "three";
import styled from "styled-components";

export default function InitBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const currentCanvas = canvasRef.current;
    if (!currentCanvas) return;

    let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, particles: THREE.Points, animationFrameId: number;

    const init = () => {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0c0a1a); // 배경색 설정
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 5;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, canvas: currentCanvas });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);

      const particleCount = 5000;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
        let z;
        do {
          z = (Math.random() - 0.5) * 20; // -10에서 10 사이
        } while (z >= 3 && z <= 7); // z가 3에서 7 사이면 다시 생성
        positions[i * 3 + 2] = z;
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const material = new THREE.PointsMaterial({
        size: 0.01,
        color: 0x8b5cf6, // 보라색
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
      });

      particles = new THREE.Points(geometry, material);
      scene.add(particles);
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if(particles) {
        particles.rotation.x += 0.0001;
        particles.rotation.y += 0.0002;
      }
      renderer.render(scene, camera);
    };
    
    init();
    animate();

    const onWindowResize = () => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', onWindowResize);

    return () => {
      window.removeEventListener('resize', onWindowResize);
      cancelAnimationFrame(animationFrameId);
      if(renderer) renderer.dispose();
    };
  }, []);

  return <BackgroundCanvas ref={canvasRef} />;
}

const BackgroundCanvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
`;
