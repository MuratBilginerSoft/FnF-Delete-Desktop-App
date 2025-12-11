// Launcher script to start Electron with clean environment
const { spawn } = require('child_process');
const path = require('path');

// Get electron path
const electronPath = require('electron');

// Create clean environment without ELECTRON_RUN_AS_NODE
const cleanEnv = { ...process.env };
delete cleanEnv.ELECTRON_RUN_AS_NODE;

// Spawn electron with current directory (so it reads package.json for app name)
const child = spawn(electronPath, ['.'], {
  env: cleanEnv,
  stdio: 'inherit',
  cwd: __dirname
});

child.on('close', (code) => {
  process.exit(code);
});
