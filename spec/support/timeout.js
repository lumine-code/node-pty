/**
 * Copyright (c) 2026, lumine-code
 * Licensed under the MIT license.
 */

// Spawning a shell and waiting for it to report back takes seconds on every
// platform, and the teardown spec deliberately waits a minute for a process to
// exit, so jasmine's default 5s ceiling is far too low here. This replaces the
// per-spec `this.timeout` calls the mocha suite used.
jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;
