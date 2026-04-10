import { useQuery } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { Effect, Schema } from "effect";
import { describe, expect, it, vi } from "vitest";
import { useEffectQuery } from "../use-effect-query";

// Mock the underlying standard react query behavior to isolate the wrapper's logic
vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("@convex-dev/react-query", () => ({
  convexQuery: vi
    .fn()
    .mockImplementation((funcRef, args) => ({ queryKey: [funcRef, args] })),
}));

// Synthetic objects that satisfy the TypeScript parameters
const mockFuncRef = "mockQuery" as any;
const mockDescriptor = {
  path: "mock/path",
  dataSchema: Schema.String,
  decodeError: vi.fn().mockReturnValue(null),
} as any;

describe("useEffectQuery Hook Guidelines", () => {
  it("should wrap pending state correctly", () => {
    // 1. Mock the expected react-query behavior
    vi.mocked(useQuery).mockReturnValue({
      isPending: true,
      error: null,
      data: undefined,
    } as any);

    // 2. Render the hook
    const { result } = renderHook(() =>
      useEffectQuery(mockFuncRef, mockDescriptor, {})
    );

    // 3. Assert properties
    expect(result.current.isPending).toBe(true);

    // The returned toEffect() returns Effect.never when pending
    const effect = result.current.toEffect();
    expect(Effect.isEffect(effect)).toBe(true);
  });

  it("should wrap success state, validating against the schema", async () => {
    vi.mocked(useQuery).mockReturnValue({
      isPending: false,
      error: null,
      data: "Mock success data", // Must match Schema.String from mockDescriptor
    } as any);

    const { result } = renderHook(() =>
      useEffectQuery(mockFuncRef, mockDescriptor, {})
    );

    const effectOutput = await Effect.runPromise(result.current.toEffect());
    expect(effectOutput).toBe("Mock success data");
  });

  it("should fail the Effect with SchemaDecodeError if data is invalid", async () => {
    vi.mocked(useQuery).mockReturnValue({
      isPending: false,
      error: null,
      data: 12_345, // Invalid: Expected Schema.String
    } as any);

    const { result } = renderHook(() =>
      useEffectQuery(mockFuncRef, mockDescriptor, {})
    );

    // We expect the Effect to fail parsing
    const err = (await Effect.runPromise(
      Effect.flip(result.current.toEffect())
    )) as { _tag: string };

    expect(err).toBeDefined();
    // Since it's a TaggedError from backend/contracts, we can check its tag
    expect(err._tag).toBe("SchemaDecodeError");
  });
});
