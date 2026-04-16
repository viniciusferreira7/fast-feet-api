import { DiagConsoleLogger, DiagLogLevel, diag } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-proto';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs';
import {
  ConsoleMetricExporter,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
} from '@opentelemetry/sdk-trace-node';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';

const traceExporter = new OTLPTraceExporter();

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: 'fast-feet-api',
  [ATTR_SERVICE_VERSION]: '1.0.0',
});

const mergedResource = resource;
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

const sdk = new NodeSDK({
  spanProcessors: [new BatchSpanProcessor(traceExporter)],
  traceExporter: new ConsoleSpanExporter(),
  metricReaders: [
    new PeriodicExportingMetricReader({
      exporter: new ConsoleMetricExporter(),
    }),
  ],
  logRecordProcessors: [new SimpleLogRecordProcessor(new OTLPLogExporter())],
  instrumentations: [getNodeAutoInstrumentations()],
  resource: mergedResource,
});

export default sdk;
