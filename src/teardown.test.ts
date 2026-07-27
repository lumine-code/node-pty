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
