import { NodeSdk } from "@effect/opentelemetry";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";

export const TracingLive = NodeSdk.layer(() => ({
  resource: {
    serviceName: "tanstack-effect-convex-backend",
  },
  traceExporter: new OTLPTraceExporter(),
}));
