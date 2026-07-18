import type { FastImageConfig } from '../types/config';
import type { FastImageProps } from '../types/props';
import {
  DEFAULT_RETRY_COUNT,
  DEFAULT_RETRY_DELAY,
  DEFAULT_TRANSITION_DURATION,
} from '../constants';

export interface EffectiveLoadSettings {
  retryCount: number;
  retryDelay: number;
  transitionDuration: number;
  estimatedAspectRatio: number | undefined;
}

/**
 * Merges per-component props over provider-level config over library
 * defaults, producing the effective load settings for one FastImage.
 */
export function applyConfigDefaults(
  props: Pick<
    FastImageProps,
    'retryCount' | 'retryDelay' | 'transitionDuration' | 'estimatedAspectRatio'
  >,
  config: FastImageConfig
): EffectiveLoadSettings {
  return {
    retryCount: props.retryCount ?? config.retryCount ?? DEFAULT_RETRY_COUNT,
    retryDelay: props.retryDelay ?? config.retryDelay ?? DEFAULT_RETRY_DELAY,
    transitionDuration:
      props.transitionDuration ??
      config.transitionDuration ??
      DEFAULT_TRANSITION_DURATION,
    estimatedAspectRatio:
      props.estimatedAspectRatio ?? config.estimatedAspectRatio,
  };
}
