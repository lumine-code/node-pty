This is a minimal example of getting a terminal running in Electron using [node-pty](https://github.com/microsoft/node-pty) and [xterm.js](https://github.com/xtermjs/xterm.js).

![](./images/preview.png)

It works by using xterm.js on the renderer process and node-pty on the main process with IPC to communicate back and forth.

## Usage

Run `npm install` in the repository root first, then run these commands from this example directory. The native rebuild uses the version of Electron installed by this example; run `npm rebuild` in the repository root before returning to Node.js tests.

```bash
# Install dependencies (Windows)
./npm_install.bat

# Install dependencies (non-Windows)
./npm_install.sh

# Launch the app
npm start
```
