import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { colors, spacing, fontSize, borderRadius } from '../AppStyle';
import { loginUser } from '../api';
import { setAuthToken } from '../store/reportHistoryStore';
import Svg, { Path } from 'react-native-svg';
import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';
import * as THREE from 'three';

type LoginPageNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const { width, height } = Dimensions.get('window');

export default function LoginPage() {
  const navigation = useNavigation<LoginPageNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Use useRef to store the animation frame ID without causing re-renders.
  const animationFrameId = useRef<number | null>(null);

  // useEffect for cleanup when the component unmounts.
  // The empty dependency array [] ensures this runs only once on mount and unmount.
  useEffect(() => {
    return () => {
      if (animationFrameId.current) {
        console.log("Cancelling animation frame on unmount.");
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await loginUser({ email, password });
      console.log('로그인 성공:', response);
      
      if (response.access_token) {
        setAuthToken(response.access_token);
      }
      
      navigation.navigate('Main');
    } catch (error) {
      console.error('로그인 오류:', error);
      Alert.alert('로그인 실패', '이메일과 비밀번호를 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  // Three.js background animation setup
  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0a1a);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({
      canvas: {
        width,
        height,
        style: {},
        addEventListener: () => {},
        removeEventListener: () => {},
        clientHeight: height,
      } as any,
      context: gl,
      antialias: true,
    });
    renderer.setPixelRatio(1);
    renderer.setSize(width, height);

    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: 0.05,
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Animation Loop
    const animate = () => {
      // Store the frame ID in the ref's .current property. This does not trigger a re-render.
      animationFrameId.current = requestAnimationFrame(animate);

      if (particles) {
        particles.rotation.x += 0.0005;
        particles.rotation.y += 0.0003;
        particles.rotation.z += 0.0002;
      }

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    animate();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.backgroundContainer}>
        <GLView
          style={{ flex: 1 }}
          onContextCreate={onContextCreate}
        />
      </View>

      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Svg width="24" height="24" fill="none" stroke="#ffffff" viewBox="0 0 24 24">
            <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../shared/assets/imgs/logo.png')}
            style={styles.logoImage}
          />
          <Text style={styles.logoText}>Neurocare 치매진단 서비스</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>로그인</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>이메일</Text>
            <TextInput
              style={styles.input}
              placeholder="이메일을 입력하세요"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>비밀번호</Text>
            <TextInput
              style={styles.input}
              placeholder="비밀번호를 입력하세요"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? '로그인 중...' : '로그인'}
            </Text>
          </TouchableOpacity>

          <View style={styles.registerLink}>
            <Text style={styles.registerText}>계정이 없으신가요? </Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={styles.registerButtonText}>회원가입</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0a1a',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: 'rgba(17, 24, 39, 0.82)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1,
  },
  backButton: {
    backgroundColor: 'rgba(17, 24, 39, 0.82)',
    borderRadius: 20,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logoImage: {
    width: 34,
    height: 34,
    marginRight: spacing.sm,
  },
  logoText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: '#96e7d4',
    letterSpacing: -1,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl * 5,
    zIndex: 1,
  },
  formContainer: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  inputContainer: {
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.sm,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#334155',
    height: 40,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.round,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  registerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  registerText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  registerButtonText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
});
