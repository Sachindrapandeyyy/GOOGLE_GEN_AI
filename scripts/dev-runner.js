#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Sukoon AI Services...\n');

// Service configuration - only include services that actually exist
const potentialServices = [
  { name: 'Diary', path: 'services/diary', port: 8081 },
  { name: 'Chat', path: 'services/chat', port: 8082 },
  { name: 'Mood', path: 'services/mood', port: 8083 },
  { name: 'Triage', path: 'services/triage', port: 8084 },
  { name: 'Insights', path: 'services/insights', port: 8085 },
  { name: 'Notif', path: 'services/notif', port: 8086 },
];

// Filter to only include services that have package.json
const services = potentialServices.filter(service => {
  const packagePath = path.join(__dirname, '..', service.path, 'package.json');
  return fs.existsSync(packagePath);
});

console.log(`Found ${services.length} services with package.json files\n`);

const childProcesses = [];
let shuttingDown = false;

// Get npm command path
function getNpmCommand() {
  // On Windows, npm.cmd is usually in AppData\Roaming\npm
  if (process.platform === 'win32') {
    const npmCmdPath = path.join(process.env.APPDATA || '', 'npm', 'npm.cmd');
    try {
      require('child_process').execSync(`"${npmCmdPath}" --version`, { stdio: 'pipe' });
      return npmCmdPath;
    } catch (error) {
      // Fall back to just npm.cmd
      return 'npm.cmd';
    }
  }

  // On Unix-like systems, npm should be in PATH
  return 'npm';
}

const npmCommand = getNpmCommand();
console.log(`Using npm command: ${npmCommand}\n`);

// Cleanup function
function cleanup() {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log('\n🛑 Shutting down services...');

  childProcesses.forEach((child, index) => {
    if (child && !child.killed) {
      const serviceName = services[index] ? services[index].name : `Service ${index}`;
      console.log(`Stopping ${serviceName} service...`);
      child.kill('SIGTERM');

      // Force kill after 5 seconds
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 5000);
    }
  });

  // Exit after cleanup
  setTimeout(() => {
    console.log('✅ All services stopped');
    process.exit(0);
  }, 6000);
}

// Handle process termination
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start each service
function startService(service) {
  const servicePath = path.join(__dirname, '..', service.path);

  console.log(`Starting ${service.name} service on port ${service.port}...`);

  // Use the npm command we found earlier
  const child = spawn(npmCommand, ['run', 'dev'], {
    cwd: servicePath,
    stdio: ['inherit', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '1' },
    shell: process.platform === 'win32' // Use shell on Windows for .cmd files
  });

  childProcesses.push(child);

  // Pipe output with service name prefix
  child.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(`[${service.name}] ${output}`);
    }
  });

  child.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(`[${service.name}] ${output}`);
    }
  });

  child.on('close', (code) => {
    if (!shuttingDown) {
      console.log(`⚠️  ${service.name} service exited with code ${code}`);
      if (code !== 0 && code !== null) {
        console.log(`Restarting ${service.name} service in 3 seconds...`);
        setTimeout(() => startService(service), 3000);
      }
    }
  });

  child.on('error', (error) => {
    if (!shuttingDown) {
      console.error(`❌ Error starting ${service.name} service:`, error.message);

      // If it's an ENOENT error (command not found), don't retry automatically
      if (error.code === 'ENOENT') {
        console.error(`💡 Make sure npm is installed and available in PATH`);
        console.error(`   Current npm command: ${npmCommand}`);
      } else {
        // For other errors, retry after a delay
        console.log(`Retrying ${service.name} service in 5 seconds...`);
        setTimeout(() => startService(service), 5000);
      }
    }
  });
}

// Start all services
services.forEach(startService);

// Display service information
setTimeout(() => {
  console.log('\n🎉 Services are starting up!');
  console.log('\n📱 Service URLs:');
  services.forEach(service => {
    console.log(`   ${service.name}: http://localhost:${service.port}`);
  });
  console.log('\n💡 Press Ctrl+C to stop all services\n');
}, 2000);

// Keep the process running
process.stdin.resume();
