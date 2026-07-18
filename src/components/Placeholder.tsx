import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { ImageStyle, StyleProp, ViewStyle } from 'react-native';
import type { FastImageSource, ResizeMode } from '../types/source';
import { isImageSource } from '../helpers/isImageSource';
import { InternalFastImage } from './InternalFastImage';

export interface PlaceholderProps {
  /** A React node (skeleton, shimmer, ...) or an image source. */
  placeholder: ReactNode | FastImageSource;
  resizeMode?: ResizeMode;
  style?: StyleProp<ImageStyle>;
  testID?: string;
}

/**
 * Renders the `placeholder` prop while the real image loads: image sources
 * render through the same native engine, arbitrary nodes render inside a
 * non-interactive overlay.
 */
export function Placeholder({
  placeholder,
  resizeMode,
  style,
  testID,
}: PlaceholderProps): ReactNode {
  if (isImageSource(placeholder)) {
    return (
      <InternalFastImage
        source={placeholder}
        resizeMode={resizeMode}
        style={style}
        testID={testID}
      />
    );
  }
  return (
    <View style={style as StyleProp<ViewStyle>} pointerEvents="none" testID={testID}>
      {placeholder}
    </View>
  );
}
