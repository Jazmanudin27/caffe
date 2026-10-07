import { spawn } from 'child_process';

console.log('🚀 Starting Caffe Backend API & Vite Frontend concurrently...\n');

// Start backend Express server
const server = spawn('node', ['server/index.js'], { stdio: 'inherit', shell: true });

// Start Vite dev server
const vite = spawn('npx', ['vite'], { stdio: 'inherit', shell: true });

process.on('SIGINT', () => {
  server.kill();
  vite.kill();
  process.exit();
});
