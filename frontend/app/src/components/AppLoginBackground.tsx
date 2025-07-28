import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';
import * as THREE from 'three';

// This is the main React Native component
export default function App() {
  // State to hold the animation frame ID
  const [animationFrameId, setAnimationFrameId] = useState<number | null>(null);

  // useEffect for cleanup when the component unmounts
  useEffect(() => {
    // This function will be called when the component is removed from the screen
    return () => {
      if (animationFrameId) {
        console.log("Cancelling animation frame.");
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [animationFrameId]);

  /**
   * This function is called once the GL context is created.
   * It's the entry point for all our Three.js logic.
   * @param {ExpoWebGLRenderingContext} gl - The WebGL context provided by GLView
   */
  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    // --- 1. Scene, Camera, and Renderer Setup ---

    // The GLView's drawing buffer dimensions
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

    // Create a Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0a1a); // Set background color

    // Create a perspective camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    // Create a Three.js renderer that uses the GL context from GLView
    const renderer = new THREE.WebGLRenderer({
      canvas: {
        width,
        height,
        style: {}, // The empty object for style is sufficient for three.js to work
        addEventListener: () => {},
        removeEventListener: () => {},
        clientHeight: height,
      } as any, // Cast the mock canvas object to 'any' to resolve the TypeScript error
      context: gl,
      antialias: true,
    });
    // In React Native, window.devicePixelRatio is not available, so we default to 1
    renderer.setPixelRatio(1);
    renderer.setSize(width, height);

    // --- 2. Particle System Creation ---

    // The number of particles has been further reduced to 200.
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    // Create random positions for each particle
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;     // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20; // z
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Create the material for the particles
    const material = new THREE.PointsMaterial({
      size: 0.02,
      color: 0x8b5cf6, // Purple color
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });

    // Create the particle system (Points) and add it to the scene
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // --- 3. Animation Loop ---

    const animate = () => {
      // Schedule the next frame
      const frameId = requestAnimationFrame(animate);
      setAnimationFrameId(frameId);

      // Rotate the particle system
      if (particles) {
        particles.rotation.x += 0.0001;
        particles.rotation.y += 0.0002;
      }

      // Render the scene with the camera
      renderer.render(scene, camera);

      // This is crucial for Expo GL: it tells the GLView to display the frame
      gl.endFrameEXP();
    };

    // Start the animation loop
    animate();
  };

  return (
    <View style={styles.container}>
      {/* The GLView component is our canvas equivalent */}
      <GLView
        style={{ flex: 1 }}
        onContextCreate={onContextCreate}
      />
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    // The background color can be set here as a fallback
    backgroundColor: '#0c0a1a',
  },
});
