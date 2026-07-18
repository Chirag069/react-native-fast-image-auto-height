/**
 * Throws in development when a condition does not hold. In production the
 * check is skipped entirely so misuse never crashes shipped apps.
 */
export function invariant(
  condition: unknown,
  message: string
): asserts condition {
  if (__DEV__ && !condition) {
    throw new Error(`[react-native-fast-image-auto-height] ${message}`);
  }
}

/**
 * Logs a development-only warning. No-op in production.
 */
export function warnOnce(condition: unknown, message: string): void {
  if (__DEV__ && !condition && !warned.has(message)) {
    warned.add(message);
    console.warn(`[react-native-fast-image-auto-height] ${message}`);
  }
}

const warned = new Set<string>();
