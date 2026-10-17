/**
 * Copyright (c) 2026, lumine-code (MIT License).
 */

const fs = require('node:fs');
let activeSpec = null;

function record(event, details) {
  const line = JSON.stringify({ time: new Date().toISOString(), pid: process.pid, event, ...details }) + '\n';
  if (process.env.NODE_PTY_TEST_TRACE) {
    fs.appendFileSync(process.env.NODE_PTY_TEST_TRACE, line);
  }
  fs.writeSync(1, `\n[node-pty:test] ${line}`);
}

jasmine.getEnv().addReporter({
  specStarted(result) {
    activeSpec = result.fullName;
    record('specStarted', { spec: activeSpec });
  },
  specDone(result) {
    record('specDone', { spec: result.fullName, status: result.status, failures: result.failedExpectations });
    activeSpec = null;
  },
  jasmineDone(result) {
    record('jasmineDone', { status: result.overallStatus, failures: result.failedExpectations });
  }
});

// These listeners observe failure without handling or swallowing it. A native
// termination may bypass them, leaving specStarted as the last durable event.
process.on('uncaughtExceptionMonitor', error => {
  record('uncaughtException', { spec: activeSpec, message: error.message, stack: error.stack });
});
process.on('exit', code => {
  record('exit', { code, spec: activeSpec });
});
