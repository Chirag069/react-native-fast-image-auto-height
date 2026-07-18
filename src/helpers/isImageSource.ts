import { isValidElement } from 'react';
import type { ReactNode } from 'react';
import type { FastImageSource } from '../types/source';

/**
 * Distinguishes an image source from an arbitrary React node in the
 * `placeholder` prop. Numbers are treated as `require(...)` assets — the
 * overwhelmingly more useful interpretation for an image placeholder.
 */
export function isImageSource(
  placeholder: ReactNode | FastImageSource
): placeholder is FastImageSource {
  if (typeof placeholder === 'number') {
    return true;
  }
  if (
    typeof placeholder === 'object' &&
    placeholder !== null &&
    !isValidElement(placeholder) &&
    'uri' in placeholder
  ) {
    return true;
  }
  return false;
}
