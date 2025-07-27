import React, { useEffect, useRef, useState } from "react";
import { View, Animated, Dimensions } from "react-native";
import styled from "styled-components/native";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Star {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
}

export default function InitBackground() {
  const [stars, setStars] = useState<Star[]>([]);
  const animations = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    // 별 생성
    const createStars = () => {
      const starCount = 150;
      const newStars: Star[] = [];
      
      for (let i = 0; i < starCount; i++) {
        newStars.push({
          id: i,
          x: new Animated.Value(Math.random() * screenWidth),
          y: new Animated.Value(Math.random() * screenHeight),
          opacity: new Animated.Value(Math.random() * 0.8 + 0.2),
          scale: new Animated.Value(Math.random() * 0.5 + 0.5),
        });
      }
      
      setStars(newStars);
    };

    createStars();
  }, []);

  useEffect(() => {
    if (stars.length === 0) return;

    // 별 애니메이션
    const newAnimations: Animated.CompositeAnimation[] = [];
    
    stars.forEach((star, index) => {
      // 반짝임 애니메이션
      const twinkleAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(star.opacity, {
            toValue: 0.1,
            duration: 1000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(star.opacity, {
            toValue: 0.8,
            duration: 1000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
        ])
      );

      // 크기 변화 애니메이션
      const scaleAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(star.scale, {
            toValue: 0.3,
            duration: 1500 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(star.scale, {
            toValue: 1.2,
            duration: 1500 + Math.random() * 1000,
            useNativeDriver: true,
          }),
        ])
      );

      // 천천히 움직이는 애니메이션
      const moveAnimation = Animated.loop(
        Animated.timing(star.x, {
          toValue: Math.random() * screenWidth,
          duration: 5000 + Math.random() * 5000,
          useNativeDriver: true,
        })
      );

      newAnimations.push(twinkleAnimation, scaleAnimation, moveAnimation);
      
      twinkleAnimation.start();
      scaleAnimation.start();
      moveAnimation.start();
    });
    
    animations.current = newAnimations;

    return () => {
      // 애니메이션 정리
      animations.current.forEach(animation => {
        animation.stop();
      });
    };
  }, [stars]);

  return (
    <BackgroundContainer>
      {stars.map((star) => (
        <AnimatedStar
          key={star.id}
          style={{
            left: star.x,
            top: star.y,
            opacity: star.opacity,
            transform: [{ scale: star.scale }],
          }}
        />
      ))}
    </BackgroundContainer>
  );
}

const BackgroundContainer = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #0c0a1a;
  z-index: 0;
`;

const AnimatedStar = styled(Animated.View)`
  position: absolute;
  width: 6px;
  height: 6px;
  background-color: #a855f7;
  border-radius: 3px;
`;
