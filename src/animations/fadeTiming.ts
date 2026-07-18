import { Easing } from 'react-native';
import type { Animated } from 'react-native';

/**
 * Timing configuration for the load fade-in. Runs on the native driver so
 * the transition stays smooth even when the JS thread is busy rendering
 * list items.
 */
export function createFadeInTiming(
  duration: number
): Animated.TimingAnimationConfig {
  return {
    toValue: 1,
    duration,
    easing: Easing.out(Easing.quad),
    useNativeDriver: true,
  };
}
