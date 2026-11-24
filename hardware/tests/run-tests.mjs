import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const output = resolve(root, '.validation', process.platform === 'win32' ? 'local-alarm-test.exe' : 'local-alarm-test');
mkdirSync(resolve(root, '.validation'), { recursive: true });
const compiled = spawnSync(process.env.CXX || 'g++', [
  '-std=c++11', '-Wall', '-Wextra', '-Werror', '-Wno-unused-variable',
  '-I', resolve(root, 'hardware/tests/stubs'),
  resolve(root, 'hardware/tests/local-alarm.test.cpp'), '-o', output,
], { stdio: 'inherit' });
if (compiled.error) throw compiled.error;
if (compiled.status !== 0) process.exit(compiled.status ?? 1);
const tested = spawnSync(output, [], { stdio: 'inherit' });
if (tested.error) throw tested.error;
process.exit(tested.status ?? 1);
