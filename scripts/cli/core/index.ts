import * as p from '@clack/prompts';
import {
  type FlowConfig,
  type FlowValue,
  getRunner,
  runners,
} from '../runners/index.js';
import { findTestFiles } from '../utils/find-files.js';

type Step = 'select' | 'configure' | 'confirm' | 'run' | 'again';

async function main(): Promise<void> {
  p.intro(' fast-feet cli ');

  let step: Step = 'select';
  let selectedValues: FlowValue[] = [];
  let flowConfigs: FlowConfig[] = [];

  while (true) {
    // ── 1. select flows ───────────────────────────────────────────────
    if (step === 'select') {
      const result = await p.multiselect<FlowValue>({
        message: 'Select flows to run',
        options: runners.map((r) => ({
          value: r.value,
          label: r.label,
          hint: r.hint,
        })),
        required: true,
      });

      if (p.isCancel(result)) {
        p.cancel('Bye!');
        process.exit(0);
      }

      selectedValues = result;
      flowConfigs = [];
      step = 'configure';
    }

    // ── 2. configure test runners (pick file or run all) ──────────────
    if (step === 'configure') {
      let cancelled = false;
      const configs: FlowConfig[] = [];

      for (const value of selectedValues) {
        const runner = getRunner(value);

        if (!runner.isTestRunner) {
          configs.push({ value });
          continue;
        }

        const type = value as 'unit' | 'int' | 'e2e';
        const testFiles = findTestFiles(type);

        const selection = await p.multiselect<string>({
          message: `[${runner.label}] Select test files  (type to filter)`,
          options: [
            { value: '__all__', label: 'Run all', hint: 'full suite' },
            ...testFiles,
          ],
          initialValues: ['__all__'],
        });

        if (p.isCancel(selection)) {
          cancelled = true;
          break;
        }

        const chosen = selection as string[];
        const runAll = chosen.includes('__all__') || chosen.length === 0;
        configs.push({
          value,
          files: runAll ? undefined : chosen,
        });
      }

      if (cancelled) {
        step = 'select';
        continue;
      }

      flowConfigs = configs;
      step = 'confirm';
    }

    // ── 3. confirm ────────────────────────────────────────────────────
    if (step === 'confirm') {
      const summary = flowConfigs
        .map((c) => {
          const r = getRunner(c.value);
          if (!c.files?.length) return r.label;
          return `${r.label}\n${c.files.map((f) => `  · ${f}`).join('\n')}`;
        })
        .join('\n');

      p.note(summary, 'Flows to run');

      const go = await p.confirm({ message: 'Proceed?' });

      if (p.isCancel(go) || !go) {
        flowConfigs = [];
        step = 'configure';
        continue;
      }

      step = 'run';
    }

    // ── 4. run ────────────────────────────────────────────────────────
    if (step === 'run') {
      const results: { label: string; success: boolean }[] = [];

      for (const config of flowConfigs) {
        const runner = getRunner(config.value);
        const label = config.files?.length
          ? `${runner.label}  (${config.files.length} file${config.files.length > 1 ? 's' : ''})`
          : runner.label;

        const s = p.spinner();
        s.start(`Running ${label}`);

        if (
          config.files?.length &&
          (config.value === 'int' || config.value === 'e2e')
        ) {
          p.log.warn(
            'Running specific file — Docker must already be up for this flow.'
          );
        }

        const { success, output } = runner.run(config);

        if (success) {
          s.stop(`✓ ${label}`);
        } else {
          s.stop(`✗ ${label}`);
          if (output.trim()) p.note(output.trim(), 'Output');
        }

        results.push({ label, success });
      }

      const passed = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      p.note(`Passed: ${passed}    Failed: ${failed}`, 'Summary');

      step = 'again';
    }

    // ── 5. run again ──────────────────────────────────────────────────
    if (step === 'again') {
      const again = await p.confirm({ message: 'Run again?' });
      if (p.isCancel(again) || !again) break;
      step = 'select';
    }
  }

  p.outro('Done!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
