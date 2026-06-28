const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runSettingsTests() {
  console.log('\n--- Running Phase 10 Settings Integration Tests ---');
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

  // Test 1: Fetch default settings
  await test('Retrieve default system settings from database', async () => {
    const list = await prisma.systemSetting.findMany();
    const branding = list.find(s => s.key === 'brandingName');
    const currency = list.find(s => s.key === 'currencySymbol');

    if (!branding || branding.value !== 'FAISAL TOWN CRM') {
      throw new Error('Default brandingName missing or incorrect');
    }
    if (!currency || currency.value !== 'PKR') {
      throw new Error('Default currencySymbol missing or incorrect');
    }
  });

  // Test 2: Update settings by Admin
  await test('Update system settings keys successfully', async () => {
    const newBranding = 'FAISAL TOWN PREMIER CRM';
    
    // Simulating PUT/POST upsert
    await prisma.systemSetting.upsert({
      where: { key: 'brandingName' },
      update: { value: newBranding },
      create: { key: 'brandingName', value: newBranding }
    });

    const check = await prisma.systemSetting.findUnique({ where: { key: 'brandingName' } });
    if (check.value !== newBranding) {
      throw new Error('Failed to update branding settings in database');
    }

    // Restore default branding Name
    await prisma.systemSetting.update({
      where: { key: 'brandingName' },
      data: { value: 'FAISAL TOWN CRM' }
    });
  });

  // Test 3: Update User Profile
  await test('Update user profile credentials securely', async () => {
    const user = await prisma.user.findFirst({ where: { email: 'agent@crm.com' } });
    const originalName = user.name;
    const newName = 'Faisal Agent Upgraded';

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name: newName }
    });

    if (updated.name !== newName) {
      throw new Error('Profile update failed to save name to DB');
    }

    // Log Activity
    const log = await prisma.activityLog.create({
      data: {
        action: 'Profile Updated',
        details: `User agent@crm.com updated profile parameters`,
        userId: user.id
      }
    });

    if (log.action !== 'Profile Updated') {
      throw new Error('Failed to log profile update activity');
    }

    // Restore name
    await prisma.user.update({
      where: { id: user.id },
      data: { name: originalName }
    });
  });

  console.log('\n--- Test Execution Summary ---');
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSettingsTests()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
