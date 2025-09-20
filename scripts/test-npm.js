// Quick test to see what npm path is detected
const { spawn } = require('child_process');
const path = require('path');

function getNpmCommand() {
  // Try to find npm in common locations
  const npmPaths = [
    'npm',
    'npm.cmd',
    path.join(process.env.APPDATA || '', 'npm', 'npm.cmd'),
    path.join(process.env.PROGRAMFILES || '', 'nodejs', 'npm.cmd'),
    path.join(process.env.PROGRAMFILES + ' (x86)' || '', 'nodejs', 'npm.cmd')
  ];

  console.log('Testing npm paths:');
  for (const npmPath of npmPaths) {
    console.log(`  Testing: ${npmPath}`);
    try {
      // Check if the npm command exists
      require('child_process').execSync(`"${npmPath}" --version`, { stdio: 'pipe' });
      console.log(`  ✅ Found npm at: ${npmPath}`);
      return npmPath;
    } catch (error) {
      console.log(`  ❌ Not found at: ${npmPath}`);
    }
  }

  console.log('  ⚠️  Falling back to: npm');
  return 'npm';
}

const npmCommand = getNpmCommand();
console.log(`\nSelected npm command: ${npmCommand}`);

// Test spawning npm
console.log('\nTesting npm spawn...');
const testProcess = spawn(npmCommand, ['--version'], {
  stdio: 'inherit'
});

testProcess.on('close', (code) => {
  console.log(`npm --version exited with code: ${code}`);
});
