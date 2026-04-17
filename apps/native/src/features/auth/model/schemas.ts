import { Schema } from "effect";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const Email = Schema.String.pipe(
  Schema.pattern(EMAIL_REGEX, { message: () => "Invalid email address" })
);

export const Password = Schema.String.pipe(
  Schema.minLength(8, {
    message: () => "Password must be at least 8 characters",
  })
);

export const Name = Schema.String.pipe(
  Schema.minLength(2, {
    message: () => "Name must be at least 2 characters",
  })
);

export const SignInSchema = Schema.Struct({
  email: Email,
  password: Password,
});

export const SignUpSchema = Schema.Struct({
  email: Email,
  password: Password,
  name: Name,
});
