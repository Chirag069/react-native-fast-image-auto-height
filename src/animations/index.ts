import { Easing } from 'react-native';
import type { Animated } from 'react-native';

/**
 * Timing config for the fade-in transition. Runs on the native driver so
 * the animation never competes with JS-thread work (list scrolling, etc.).
 */
export function createFadeTiming(
  toValue: number,
  duration: number
): Animated.TimingAnimationConfig {
  return {
    toValue,
    duration,
    easing: Easing.out(Easing.quad),
    useNativeDriver: true,
  };
}
