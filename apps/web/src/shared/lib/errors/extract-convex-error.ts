import { ConvexError } from "convex/values";
import type { SerializedError } from "@/shared/lib/models/result";
import type { AppError } from "../models/errors";
import { deserializeError } from "./deserialize";

/**
 * Extracts and deserializes error from ConvexError.
 * Falls back to UnknownError for non-Convex errors.
 */
export const extractConvexError = (error: unknown): AppError => {
  if (error instanceof ConvexError) {
    const data = error.data as { error?: SerializedError };
    if (data.error) {
      return deserializeError(data.error);
    }
  }
  return deserializeError({ _tag: "UnknownError", message: String(error) });
};
