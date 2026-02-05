---
"evalite": patch
---

Implemented schema encoding and runtime data validation for different hooks. This update includes:

- **Enhanced Type Safety**: `useEffectQuery` and `useEffectMutation` now use generated `FunctionDescriptors` to validate data returned from Convex against Effect Schemas.
- **Runtime Validation**: Data is decoded at runtime, ensuring it matches the expected schema. Validation failures are captured as `SchemaDecodeError`.
- **Improved Code Generation**: The `contract-codegen` script now extracts return types and generates corresponding Effect Schemas for data validation.
- **Unified Error Handling**: The `FunctionDescriptor` API replaces `ErrorDescriptor`, consolidating error decoding and data validation into a single contract.
