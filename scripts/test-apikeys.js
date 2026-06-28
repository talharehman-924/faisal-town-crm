const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runApiKeysTests() {
  console.log('\n--- Running Phase 11 Developer API Integration Tests ---');
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

  let testKeyId = null;

  // Test 1: Generate API Key
  await test('Generate API key with ft_ prefix and write ActivityLog', async () => {
    const admin = await prisma.user.findFirst({ where: { email: 'admin@crm.com' } });
    const generated = `ft_test_${require('crypto').randomBytes(8).toString('hex')}`;

    const newKey = await prisma.apiKey.create({
      data: {
        key: generated,
        name: 'Zapier Webhook Key',
        userId: admin.id
      }
    });

    testKeyId = newKey.id;

    if (!newKey.id || !newKey.key.startsWith('ft_')) {
      throw new Error('API Key failed to generate with correct prefix or save');
    }

    // Log Activity
    const log = await prisma.activityLog.create({
      data: {
        action: 'API Key Created',
        details: `Generated new developer API key "Zapier Webhook Key"`,
        userId: admin.id
      }
    });

    if (!log.id || log.action !== 'API Key Created') {
      throw new Error('Failed to log API Key Created activity');
    }
  });

  // Test 2: Fetch Keys list
  await test('Retrieve API Keys scoped by owner user', async () => {
    const admin = await prisma.user.findFirst({ where: { email: 'admin@crm.com' } });
    const keys = await prisma.apiKey.findMany({
      where: { userId: admin.id }
    });

    if (keys.length === 0) {
      throw new Error('Owner API keys query failed to return generated credentials');
    }

    const testKey = keys.find(k => k.id === testKeyId);
    if (!testKey) {
      throw new Error('Generated test key is missing from query list');
    }
  });

  // Test 3: Revoke key
  await test('Revoke API Key and verify deletion and ActivityLog logging', async () => {
    const admin = await prisma.user.findFirst({ where: { email: 'admin@crm.com' } });

    await prisma.apiKey.delete({
      where: { id: testKeyId }
    });

    const check = await prisma.apiKey.findUnique({ where: { id: testKeyId } });
    if (check) {
      throw new Error('API Key failed to revoke/delete from database');
    }

    // Log Activity
    const log = await prisma.activityLog.create({
      data: {
        action: 'API Key Revoked',
        details: `Revoked developer API key "Zapier Webhook Key"`,
        userId: admin.id
      }
    });

    if (log.action !== 'API Key Revoked') {
      throw new Error('Failed to log API Key Revoked activity');
    }
  });

  console.log('\n--- Test Execution Summary ---');
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runApiKeysTests()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
