import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const existingState = process.env.AGENT_CONTROL_STATE_DIR?.trim();
const existingTelemetry = process.env.AGENT_CONTROL_TELEMETRY_DIR?.trim();
const temporaryRoot = os.tmpdir();
const ceilingSeparator = process.platform === 'win32' ? ';' : ':';
const existingGitCeiling = process.env.GIT_CEILING_DIRECTORIES?.split(ceilingSeparator).filter(Boolean) ?? [];
if (!existingGitCeiling.includes(temporaryRoot)) process.env.GIT_CEILING_DIRECTORIES = [temporaryRoot, ...existingGitCeiling].join(ceilingSeparator);
if (!existingState || !existingTelemetry) {
  const prefix = path.join(temporaryRoot, 'agent-control-test-state-');
  const root = fs.mkdtempSync(prefix);
  if (!existingState) process.env.AGENT_CONTROL_STATE_DIR = path.join(root, 'state');
  if (!existingTelemetry) process.env.AGENT_CONTROL_TELEMETRY_DIR = path.join(root, 'telemetry');
  process.once('exit', () => {
    if (root.startsWith(prefix)) fs.rmSync(root, {recursive: true, force: true});
  });
}
