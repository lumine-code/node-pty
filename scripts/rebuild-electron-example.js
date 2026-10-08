const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const version =
  require('../examples/electron/node_modules/electron/package.json').version;
const result = spawnSync(
  process.execPath,
  [
    require.resolve('node-gyp/bin/node-gyp.js'),
    'rebuild',
    `--target=${version}`,
    '--dist-url=https://electronjs.org/headers'
  ],
  { cwd: root, stdio: 'inherit', windowsHide: true }
);

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
