import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Animated } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { createFadeTiming } from '../animations';

export interface FadeViewProps {
  /** Fade the content in when this becomes `true`. */
  visible: boolean;
  /** Fade duration in ms. `<= 0` renders fully opaque with no animation. */
  duration: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/**
 * Opacity transition wrapper driven by the native animation driver.
 * With `duration <= 0` it is a plain static view (classic FastImage look).
 */
export function FadeView({
  visible,
  duration,
  style,
  children,
}: FadeViewProps): ReactNode {
  const [opacity] = useState(
    () => new Animated.Value(duration <= 0 || visible ? 1 : 0)
  );

  useEffect(() => {
    if (duration <= 0) {
      opacity.setValue(1);
      return;
    }
    if (visible) {
      const animation = Animated.timing(opacity, createFadeTiming(1, duration));
      animation.start();
      return () => animation.stop();
    }
    return undefined;
  }, [visible, duration, opacity]);

  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
}
