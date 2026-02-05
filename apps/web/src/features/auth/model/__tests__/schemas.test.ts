import { Effect, Schema } from "effect";
import { describe, it } from "vitest";
import { Email, Name, Password, SignInSchema, SignUpSchema } from "../schemas";

describe("Auth Schemas", () => {
  describe("Email", () => {
    it("should validate correct email", () => {
      Effect.runSync(Schema.decodeUnknown(Email)("test@example.com"));
    });

    it("should reject invalid email", () => {
      Effect.runSync(Effect.flip(Schema.decodeUnknown(Email)("invalid-email")));
    });
  });

  describe("Password", () => {
    it("should validate password with >= 8 chars", () => {
      Effect.runSync(Schema.decodeUnknown(Password)("password123"));
    });

    it("should reject short password", () => {
      Effect.runSync(Effect.flip(Schema.decodeUnknown(Password)("pass")));
    });
  });

  describe("Name", () => {
    it("should validate name with >= 2 chars", () => {
      Effect.runSync(Schema.decodeUnknown(Name)("John Doe"));
    });

    it("should reject short name", () => {
      Effect.runSync(Effect.flip(Schema.decodeUnknown(Name)("J")));
    });
  });

  describe("SignInSchema", () => {
    it("should validate valid sign in data", () => {
      Effect.runSync(
        Schema.decodeUnknown(SignInSchema)({
          email: "test@example.com",
          password: "password123",
        })
      );
    });
  });

  describe("SignUpSchema", () => {
    it("should validate valid sign up data", () => {
      Effect.runSync(
        Schema.decodeUnknown(SignUpSchema)({
          email: "test@example.com",
          password: "password123",
          name: "John Doe",
        })
      );
    });
  });
});
