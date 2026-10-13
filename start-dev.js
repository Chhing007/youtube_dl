const { spawn } = require('child_process');
const path = require('path');

console.log('\x1b[36m%s\x1b[0m', '================================================');
console.log('\x1b[36m%s\x1b[0m', '   StreamForge - YouTube Video & Audio Suite   ');
console.log('\x1b[36m%s\x1b[0m', '================================================');
console.log('\x1b[32m%s\x1b[0m', 'Starting FastAPI Backend on http://localhost:8000 ...');
console.log('\x1b[34m%s\x1b[0m', 'Starting Next.js Frontend on http://localhost:3000 ...');
console.log('\x1b[90m%s\x1b[0m', 'Press Ctrl+C at any time to stop all services.\n');

// Start backend
const isWin = process.platform === 'win32';
const backendCmd = 'python';
const backendArgs = ['-m', 'uvicorn', 'app.main:app', '--app-dir', 'backend', '--host', '0.0.0.0', '--port', '8000', '--reload'];

const backend = spawn(backendCmd, backendArgs, {
  cwd: __dirname,
  shell: isWin,
  stdio: 'pipe',
});

backend.stdout.on('data', (data) => {
  const line = data.toString().trim();
  if (line) console.log('\x1b[32m[BACKEND]\x1b[0m ' + line);
});

backend.stderr.on('data', (data) => {
  const line = data.toString().trim();
  if (line) console.log('\x1b[33m[BACKEND]\x1b[0m ' + line);
});

// Start frontend
const frontendCmd = isWin ? 'npm.cmd' : 'npm';
const frontendArgs = ['run', 'dev'];

const frontend = spawn(frontendCmd, frontendArgs, {
  cwd: path.join(__dirname, 'frontend'),
  shell: isWin,
  stdio: 'pipe',
});

frontend.stdout.on('data', (data) => {
  const line = data.toString().trim();
  if (line) console.log('\x1b[34m[FRONTEND]\x1b[0m ' + line);
});

frontend.stderr.on('data', (data) => {
  const line = data.toString().trim();
  if (line) console.log('\x1b[35m[FRONTEND]\x1b[0m ' + line);
});

const cleanup = () => {
  console.log('\n\x1b[31m%s\x1b[0m', 'Stopping all StreamForge services...');
  if (isWin) {
    if (backend.pid) spawn('taskkill', ['/pid', backend.pid.toString(), '/f', '/t']);
    if (frontend.pid) spawn('taskkill', ['/pid', frontend.pid.toString(), '/f', '/t']);
  } else {
    backend.kill('SIGTERM');
    frontend.kill('SIGTERM');
  }
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
