const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const config = require('./webpack.config');

test('compiles and serves the example with the selected webpack versions', async () => {
  const compiler = webpack({ ...config, context: __dirname });
  const server = new WebpackDevServer(
    {
      ...config.devServer,
      host: '127.0.0.1',
      port: 0,
      static: false
    },
    compiler
  );

  try {
    await server.start();
    const { port } = server.server.address();
    const response = await fetch(
      `http://127.0.0.1:${port}/${path.basename(config.output.filename)}`
    );
    assert.equal(response.status, 200);
    assert.match(await response.text(), /const test = 0/);
  } finally {
    await server.stop();
  }
});
