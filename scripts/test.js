/**
 * Copyright (c) 2026, lumine-code (MIT License).
 */

const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const directory = path.resolve(__dirname, '../test-results');
fs.mkdirSync(directory, { recursive: true });
const stdout = path.join(directory, 'stdout.log');
const stderr = path.join(directory, 'stderr.log');
const trace = path.join(directory, 'spec-trace.jsonl');
for (const file of [stdout, stderr, trace]) {
  fs.writeFileSync(file, '');
}

// Keep the Jasmine host's original exit status: npm reduces a Windows native
// abort to exit 1 and its progress dots cannot identify the interrupted spec.
const child = spawn(process.execPath, [
  '--report-on-fatalerror',
  '--report-uncaught-exception',
  `--report-directory=${directory}`,
  path.resolve(__dirname, '../node_modules/jasmine/bin/jasmine.js'),
  ...process.argv.slice(2)
], {
  cwd: path.resolve(__dirname, '..'),
  env: { ...process.env, NODE_ENV: 'test', NODE_PTY_TEST_TRACE: trace },
  stdio: ['inherit', 'pipe', 'pipe'],
  windowsHide: true
});

child.stdout.on('data', data => {
  fs.appendFileSync(stdout, data);
  process.stdout.write(data);
});
child.stderr.on('data', data => {
  fs.appendFileSync(stderr, data);
  process.stderr.write(data);
});
child.on('error', error => {
  fs.writeFileSync(path.join(directory, 'spawn-error.log'), error.stack || error.message);
  process.exitCode = 1;
});
child.on('close', (code, signal) => {
  const result = {
    code,
    unsignedHex: typeof code === 'number' ? `0x${(code >>> 0).toString(16).padStart(8, '0')}` : null,
    signal,
    pid: child.pid,
    node: process.version,
    platform: process.platform,
    arch: process.arch
  };
  fs.writeFileSync(path.join(directory, 'exit.json'), JSON.stringify(result, null, 2));
  fs.writeSync(2, `\nnode-pty Jasmine child exit: ${JSON.stringify(result)}\n`);
  process.exitCode = code === 0 && signal === null ? 0 : 1;
});
