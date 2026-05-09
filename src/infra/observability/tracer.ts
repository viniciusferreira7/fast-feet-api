import * as dotenv from 'dotenv';

dotenv.config({ path: '.env', override: true });

import { DiagConsoleLogger, DiagLogLevel, diag } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import { envSchema } from '../env/env';

const env = envSchema.parse(process.env);

const metricsExporter = new OTLPMetricExporter({
  url: env.OTLP_METRICS_EXPORT_ENDPOINT,
});
const metricReader = new PeriodicExportingMetricReader({
  exporter: metricsExporter,
  exportIntervalMillis: 10_000,
});
const traceExporter = new OTLPTraceExporter({
  url: env.OTLP_TRACE_EXPORT_ENDPOINT,
});

const serviceName = env.SERVICE_NAME;

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: serviceName,
  [ATTR_SERVICE_VERSION]: '1.0.0',
});

const mergedResource = resource;
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

const sdk = new NodeSDK({
  traceExporter: traceExporter,
  metricReaders: [metricReader],
  instrumentations: [getNodeAutoInstrumentations()],
  resource: mergedResource,
  serviceName,
});

export default sdk;
