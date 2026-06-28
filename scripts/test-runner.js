const { exec } = require('child_process');

async function runRunnerTests() {
  console.log('\n--- Running Phase 12 Testing Portal Integration Tests ---');
  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(err);
      failed++;
    }
  };

  // Test 1: Check runner child process execution
  await test('Verify child process test executor runs successfully', async () => {
    return new Promise((resolve, reject) => {
      exec('node scripts/test-auth.js', (err, stdout, stderr) => {
        if (err) {
          reject(new Error(`Execution failed: ${err.message}`));
        } else {
          if (!stdout.includes('Auth & DB')) {
            reject(new Error('Stdout missing execution verification tags'));
          }
          resolve();
        }
      });
    });
  });

  console.log('\n--- Test Execution Summary ---');
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runRunnerTests().catch(err => {
  console.error(err);
  process.exit(1);
});
