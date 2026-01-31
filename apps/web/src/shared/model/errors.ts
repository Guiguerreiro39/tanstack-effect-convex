/**
 * Error descriptor from generated contracts.
 */
export interface ErrorDescriptor<E> {
  readonly path: string;
  readonly decode: (e: unknown) => E | undefined;
}
