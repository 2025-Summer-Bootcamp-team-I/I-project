import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../AppStyle';

const { width: screenWidth } = Dimensions.get('window');

export default function LoadingPage() {
  const spinValue = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // 스핀 애니메이션
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );

    // 페이드인 애니메이션
    const fadeAnimation = Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    });

    // 스케일 애니메이션
    const scaleAnimation = Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    });

    // 애니메이션 시작
    Animated.parallel([fadeAnimation, scaleAnimation]).start();
    spinAnimation.start();

    return () => {
      spinAnimation.stop();
    };
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.background} />
      
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.loadingIcon,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <Text style={styles.icon}>🧠</Text>
        </Animated.View>
        
        <Text style={styles.title}>분석 중...</Text>
        <Text style={styles.subtitle}>검사 결과를 종합하고 있습니다</Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
  },
  
  content: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  
  loadingIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(106, 13, 173, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  
  icon: {
    fontSize: 60,
  },
  
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  
  progressContainer: {
    width: screenWidth * 0.6,
    alignItems: 'center',
  },
  
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.card,
    borderRadius: 4,
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
});