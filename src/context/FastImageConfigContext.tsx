import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { FastImageConfig } from '../types/config';
import {
  DEFAULT_RETRY_COUNT,
  DEFAULT_RETRY_DELAY,
  DEFAULT_TRANSITION_DURATION,
} from '../constants';

const defaultConfig: Required<Omit<FastImageConfig, 'estimatedAspectRatio'>> &
  Pick<FastImageConfig, 'estimatedAspectRatio'> = {
  retryCount: DEFAULT_RETRY_COUNT,
  retryDelay: DEFAULT_RETRY_DELAY,
  transitionDuration: DEFAULT_TRANSITION_DURATION,
  estimatedAspectRatio: undefined,
};

export type ResolvedFastImageConfig = typeof defaultConfig;

const FastImageConfigContext =
  createContext<ResolvedFastImageConfig>(defaultConfig);

export interface FastImageConfigProviderProps {
  config: FastImageConfig;
  children: ReactNode;
}

/**
 * Sets app-wide defaults for every `<FastImage />` below it (retry policy,
 * transition duration, estimated aspect ratio). Per-component props always
 * take precedence. Entirely optional — without a provider, classic
 * FastImage defaults apply.
 */
export function FastImageConfigProvider({
  config,
  children,
}: FastImageConfigProviderProps): ReactNode {
  const parent = useContext(FastImageConfigContext);
  const value = useMemo<ResolvedFastImageConfig>(
    () => ({
      retryCount: config.retryCount ?? parent.retryCount,
      retryDelay: config.retryDelay ?? parent.retryDelay,
      transitionDuration:
        config.transitionDuration ?? parent.transitionDuration,
      estimatedAspectRatio:
        config.estimatedAspectRatio ?? parent.estimatedAspectRatio,
    }),
    [
      config.retryCount,
      config.retryDelay,
      config.transitionDuration,
      config.estimatedAspectRatio,
      parent,
    ]
  );

  return (
    <FastImageConfigContext.Provider value={value}>
      {children}
    </FastImageConfigContext.Provider>
  );
}

/** Internal: reads the resolved global defaults. */
export function useFastImageConfig(): ResolvedFastImageConfig {
  return useContext(FastImageConfigContext);
}
