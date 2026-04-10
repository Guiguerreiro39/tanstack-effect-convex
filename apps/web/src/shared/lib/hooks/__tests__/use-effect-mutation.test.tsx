import { useMutation } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { ConvexError } from "convex/values";
import { Effect, Schema } from "effect";
import { describe, expect, it, vi } from "vitest";
import { useEffectMutation } from "../use-effect-mutation";

// Mock the underlying standard react query behavior to isolate the wrapper's logic
vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn(),
}));

vi.mock("convex/react", () => ({
  useConvex: vi.fn().mockReturnValue({
    mutation: vi.fn(),
  }),
}));

// Synthetic objects that satisfy the TypeScript parameters
const mockFuncRef = "mockMutation" as any;
const mockDescriptor = {
  path: "mock/path",
  dataSchema: Schema.String,
  decodeError: vi.fn().mockReturnValue(null), // Default unhandled error
} as any;

const contractViolationRegex = /Error contract violation in mock\/path/;

describe("useEffectMutation Hook Guidelines", () => {
  it("should wrap pending state correctly", () => {
    // 1. Mock the expected react-query behavior
    vi.mocked(useMutation).mockReturnValue({
      isPending: true,
      isIdle: false,
      error: null,
      data: undefined,
    } as any);

    // 2. Render the hook
    const { result } = renderHook(() =>
      useEffectMutation(mockFuncRef, mockDescriptor, {})
    );

    // 3. Assert properties
    expect(result.current.isPending).toBe(true);

    // The returned toEffect() returns Effect.never when pending
    const effect = result.current.toEffect();
    expect(Effect.isEffect(effect)).toBe(true);
  });

  it("should wrap idle state correctly", () => {
    vi.mocked(useMutation).mockReturnValue({
      isPending: false,
      isIdle: true,
      error: null,
      data: undefined,
    } as any);

    const { result } = renderHook(() =>
      useEffectMutation(mockFuncRef, mockDescriptor, {})
    );

    expect(result.current.isIdle).toBe(true);

    const effect = result.current.toEffect();
    expect(Effect.isEffect(effect)).toBe(true);
  });

  it("should wrap success state, validating against the schema", async () => {
    vi.mocked(useMutation).mockReturnValue({
      isPending: false,
      isIdle: false,
      error: null,
      data: "Mock success data", // Must match Schema.String from mockDescriptor
    } as any);

    const { result } = renderHook(() =>
      useEffectMutation(mockFuncRef, mockDescriptor, {})
    );

    const effectOutput = await Effect.runPromise(result.current.toEffect());
    expect(effectOutput).toBe("Mock success data");
  });

  it("should fail the Effect with SchemaDecodeError if data is invalid", async () => {
    vi.mocked(useMutation).mockReturnValue({
      isPending: false,
      isIdle: false,
      error: null,
      data: 12_345, // Invalid: Expected Schema.String
    } as any);

    const { result } = renderHook(() =>
      useEffectMutation(mockFuncRef, mockDescriptor, {})
    );

    // We expect the Effect to fail parsing
    const err = (await Effect.runPromise(
      Effect.flip(result.current.toEffect())
    )) as { _tag: string };

    expect(err).toBeDefined();
    expect(err._tag).toBe("SchemaDecodeError");
  });

  it("should fail the Effect with decoded error on ConvexError", async () => {
    const customError = { _tag: "CustomError" };
    // Mock decodeError to recognize our synthetic error
    const localDescriptor = {
      ...mockDescriptor,
      decodeError: vi.fn().mockImplementation((errData) => {
        if (errData?._tag === "CustomError") {
          return customError;
        }
        return null;
      }),
    };

    vi.mocked(useMutation).mockReturnValue({
      isPending: false,
      isIdle: false,
      error: new ConvexError({ error: customError }),
      data: undefined,
    } as any);

    const { result } = renderHook(() =>
      useEffectMutation(mockFuncRef, localDescriptor, {})
    );

    const err = (await Effect.runPromise(
      Effect.flip(result.current.toEffect())
    )) as { _tag: string };

    expect(err).toBeDefined();
    expect(err._tag).toBe("CustomError");
  });

  it("should throw standard Error if decode fails (contract violation)", () => {
    vi.mocked(useMutation).mockReturnValue({
      isPending: false,
      isIdle: false,
      error: new ConvexError({ error: { _tag: "UnknownError" } }),
      data: undefined,
    } as any);

    const { result } = renderHook(() =>
      useEffectMutation(mockFuncRef, mockDescriptor, {})
    );

    expect(() => {
      // It should throw synchronously inside the Effect instantiation or execution
      Effect.runSync(result.current.toEffect());
    }).toThrowError(contractViolationRegex);
  });
});
