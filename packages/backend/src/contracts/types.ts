// Error descriptor for typed error contracts.
// Used by generated contracts and the useEffectMutation/useEffectQuery hooks.

/**
 * Error descriptor from generated contracts.
 */
export interface ErrorDescriptor<E> {
  readonly path: string;
  readonly allowedTags: readonly string[];
  readonly decode: (e: unknown) => E | undefined;
}
