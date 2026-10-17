/**
 * Copyright (c) 2026, lumine-code (MIT License).
 */

import * as assert from 'assert';
import { execFile } from 'child_process';
import * as path from 'path';

const INDEX = path.join(__dirname, 'index.js');
const SHELL = process.platform === 'win32' ? 'cmd.exe' : '/bin/sh';
const ITERATIONS = 10;

// Guards the invariant that shutting down with a live pty just exits.
//
// The exit-callback thread calls ThreadSafeFunction.BlockingCall as the
// environment is going away. Upstream answered several of the resulting
// statuses with Napi::Error::Fatal, which aborts the whole process -- no
// exception, no message. This exercise reliably produces the napi_closing
// status, which upstream already handled, so it does NOT by itself reproduce
// that abort; the fatal statuses need a narrower race (the environment dying
// between a successful BlockingCall and its Release). It is kept as a cheap
// guard on the shutdown path, not as a reproducer.
describe('Environment teardown', () => {
  it('should exit cleanly when a pty is still alive', function (done: DoneFn): void {

    const script = [
      `const pty = require(${JSON.stringify(INDEX)});`,
      `const p = pty.spawn(${JSON.stringify(SHELL)}, [], { cols: 80, rows: 30 });`,
      // Kill the shell and exit immediately, so the exit-callback thread races
      // the environment shutting down.
      `p.kill();`,
      `process.exit(0);`
    ].join('\n');

    let remaining = ITERATIONS;

    const runOnce = (): void => {
      execFile(process.execPath, ['-e', script], (err, stdout, stderr) => {
        if (err) {
          const detail = (err as NodeJS.ErrnoException & { code?: number | string, signal?: string });
          done.fail(new Error(
            `child exited abnormally (code=${detail.code}, signal=${detail.signal}): ${String(stderr).trim()}`
          ));
          return;
        }
        assert.ok(
          !/FATAL ERROR/.test(String(stderr)),
          `child reported a fatal error: ${String(stderr).trim()}`
        );
        if (--remaining === 0) {
          done();
          return;
        }
        runOnce();
      });
    };

    runOnce();
  });
});

if (process.platform === 'win32') {
  [false, true].forEach(useConptyDll => {
    describe(`Windows process cleanup (useConptyDll = ${useConptyDll})`, () => {
      function assertNaturalShutdown(commandLine: string, closeOnData: boolean, done: DoneFn): void {
        const script = [
          `const assert = require('node:assert/strict');`,
          `const pty = require(${JSON.stringify(INDEX)});`,
          `const p = pty.spawn('cmd.exe', ${JSON.stringify(commandLine)}, { cols: 80, rows: 30, useConptyDll: ${useConptyDll} });`,
          `let output = '', closed = false, exits = 0;`,
          `p.onData(data => { output += data; if (${closeOnData} && !closed) { closed = true; p.kill(); p.kill(); } });`,
          `p.onExit(({exitCode}) => {`,
          `  assert.equal(++exits, 1);`,
          closeOnData ? `  assert.equal(typeof exitCode, 'number');` : `  assert.equal(exitCode, 37); assert.ok(output.includes('cleanup-final-marker'), output);`,
          `  console.log('cleanup-complete');`,
          `});`
        ].join('\n');
        // Let Node exit on its own: forcing process.exit would conceal leaked
        // ConPTY output workers and their referenced MessagePorts.
        execFile(process.execPath, ['-e', script], { timeout: 10000, windowsHide: true }, (err, stdout, stderr) => {
          if (err) {
            done.fail(new Error(`PTY cleanup did not finish naturally: ${err.message}\nstdout: ${stdout}\nstderr: ${stderr}`));
            return;
          }
          assert.ok(String(stdout).includes('cleanup-complete'), String(stdout));
          done();
        });
      }

      it('releases output workers after natural completion without losing final output', (done: DoneFn) => {
        assertNaturalShutdown('/d /c echo cleanup-final-marker & exit /b 37', false, done);
      });

      it('releases output workers after closing a connected terminal', (done: DoneFn) => {
        assertNaturalShutdown('/d /q', true, done);
      });
    });
  });
}
