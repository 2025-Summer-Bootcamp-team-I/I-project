import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, PixelRatio } from 'react-native';
import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import styled from 'styled-components/native';

export default function InitBackground() {
  // This will hold the animation frame request ID
  const animationFrameId = useRef<number | null>(null);

  // The useEffect hook is used here for cleanup when the component unmounts
  useEffect(() => {
    // The returned function will be called on component unmount
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  /**
   * This function is called once the GLView's context is created.
   * It's the entry point for all our three.js logic.
   * @param {ExpoWebGLRenderingContext} gl - The WebGL rendering context provided by expo-gl
   */
  const onContextCreate = (gl: ExpoWebGLRenderingContext) => {
    // 1. Scene, Camera, and Renderer setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0a1a); // Set background color

    const camera = new THREE.PerspectiveCamera(
      75,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    // Use the Renderer from expo-three
    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.setPixelRatio(PixelRatio.get()); // Use PixelRatio from React Native

    // 2. Particle creation (this logic is identical to your web version)
    const particleCount = 5000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      let z;
      do {
        z = (Math.random() - 0.5) * 20;
      } while (z >= 3 && z <= 7);
      positions[i * 3 + 2] = z;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: 0.01,
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // 3. Animation loop
    const animate = () => {
      // Schedule the next frame
      animationFrameId.current = requestAnimationFrame(animate);

      // Animate particles
      particles.rotation.x += 0.0001;
      particles.rotation.y += 0.0002;

      // Render the scene
      renderer.render(scene, camera);
      
      // This is crucial for expo-gl to display the frame
      gl.endFrameEXP();
    };

    // Start the animation loop
    animate();
  };

  // By placing GLView inside a styled View container, we avoid the TypeScript
  // prop issue that occurs when applying `styled()` directly to GLView.
  return (
    <BackgroundContainer>
      <GLView style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} />
    </BackgroundContainer>
  );
}

// Create a styled View container instead of a styled GLView.
const BackgroundContainer = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1; /* Place it behind other content */
`;
