# node-pty

Forks processes with pseudoterminal file descriptors.

`forkpty(3)` bindings for Node.js. Forked processes get a pseudoterminal file
descriptor and are returned as a terminal object that can be read from and
written to. This is what lets a program *think* it is attached to a terminal, so
it emits control sequences instead of plain output.

## Features

- **Cross-platform**: runs on Linux, macOS, and Windows from one API.
- **ConPTY**: uses the Windows pseudoconsole API on Windows 10 1809 and later.
- **Flow control**: pauses and resumes the child with configurable XON/XOFF codes.
- **Teardown safe**: a pty exiting while the host environment is shutting down
  no longer aborts the process.
- **Prebuilds**: ships prebuilt binaries and falls back to a source build.

## Installation

```sh
npm install @lumine-code/node-pty
```

## Usage

```js
const os = require('node:os');
const pty = require('@lumine-code/node-pty');

const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

const ptyProcess = pty.spawn(shell, [], {
  name: 'xterm-color',
  cols: 80,
  rows: 30,
  cwd: process.env.HOME,
  env: process.env
});

ptyProcess.onData((data) => {
  process.stdout.write(data);
});

ptyProcess.write('ls\r');
ptyProcess.resize(100, 40);
ptyProcess.write('ls\r');
```

## API

The full API is described by the TypeScript declaration file at
[typings/node-pty.d.ts](typings/node-pty.d.ts).

### Flow control

Automatic flow control is enabled with `handleFlowControl` in the constructor
options, or by setting it later:

```js
const PAUSE = '\x13';   // XOFF
const RESUME = '\x11';  // XON

const ptyProcess = pty.spawn(shell, [], { handleFlowControl: true });

ptyProcess.write(PAUSE);  // pty blocks and pauses the child program
ptyProcess.write(RESUME); // pty resumes the child program

ptyProcess.handleFlowControl = false;
```

`PAUSE` and `RESUME` default to the XON/XOFF control codes above and are not
forwarded to the pseudoterminal while flow control is enabled. Environments that
use those codes for something else can override them with `flowControlPause` and
`flowControlResume`.

### Thread safety

This package is not thread safe. Driving it from several worker threads in the
same process can corrupt its state.

### Security

Processes launched from a pty run at the same permission level as the parent
process. Take particular care when a pty is reachable from a network service;
running it inside a container protects the host machine.

## Building

```sh
npm install    # install dependencies and build the native addon
npm run build  # compile TypeScript to JavaScript
```

Node.js 24 or newer is required.

### Linux

```sh
sudo apt install -y make python3 build-essential
```

### macOS

Xcode is required to compile the sources and can be installed from the App Store.

### Windows

A Python interpreter and a C++ toolchain are required. The following are also
needed:

- Windows SDK, "Desktop C++ Apps" components only.
- Spectre-mitigated libraries, otherwise the build fails with "MSB8040: Spectre-mitigated libraries are required for this project". Install them from the Visual Studio Installer under Individual components by searching for "Spectre".

## Troubleshooting

### PowerShell reports error 8009001d

> Internal Windows PowerShell error. Loading managed Windows PowerShell failed with error 8009001d.

This happens when PowerShell is launched with no `SystemRoot` environment
variable present.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!

## License

Forked from [microsoft/node-pty](https://github.com/microsoft/node-pty), itself
forked from [chjj/pty.js](https://github.com/chjj/pty.js).

Copyright (c) 2026, lumine-code (MIT License).<br>
Copyright (c) 2012-2015, Christopher Jeffrey (MIT License).<br>
Copyright (c) 2016, Daniel Imms (MIT License).<br>
Copyright (c) 2018, Microsoft Corporation (MIT License).
