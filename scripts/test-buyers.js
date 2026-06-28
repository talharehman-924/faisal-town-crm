const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runBuyersTests() {
  console.log('\n--- Running Phase 6 Buyer Management Integration Tests ---');
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

  let testLeadId = null;

  // Test 1: Fetch active buyers list
  await test('Fetch Active Buyers (leads in NEW/CONTACTED/QUALIFIED)', async () => {
    const buyers = await prisma.lead.findMany({
      where: {
        status: { in: ['NEW', 'CONTACTED', 'QUALIFIED'] }
      }
    });

    if (buyers.length === 0) {
      throw new Error('Expected seeded active leads to be fetched as buyers');
    }

    testLeadId = buyers[0].id;
  });

  // Test 2: Save Preferences
  await test('Upsert Buyer Preferences and log to ActivityLog', async () => {
    const agent = await prisma.user.findFirst({ where: { email: 'agent@crm.com' } });
    
    // Save preference
    const pref = await prisma.buyerPreference.upsert({
      where: { leadId: testLeadId },
      update: {
        minBudget: 35000000,
        maxBudget: 45000000,
        preferredType: 'RESIDENTIAL',
        preferredLocation: 'Block B'
      },
      create: {
        leadId: testLeadId,
        minBudget: 35000000,
        maxBudget: 45000000,
        preferredType: 'RESIDENTIAL',
        preferredLocation: 'Block B'
      }
    });

    if (!pref.id) {
      throw new Error('Failed to upsert buyer preference');
    }

    // Log Activity
    const log = await prisma.activityLog.create({
      data: {
        action: 'Buyer Preferences Updated',
        details: `Updated preferences for buyer (Budget: 35000000-45000000 PKR, Type: RESIDENTIAL)`,
        userId: agent.id
      }
    });

    if (!log.id || log.action !== 'Buyer Preferences Updated') {
      throw new Error('Failed to log Buyer Preferences Updated activity');
    }
  });

  // Test 3: Matching Engine Logic
  await test('Run Property Matching Engine filters correctly', async () => {
    const pref = await prisma.buyerPreference.findUnique({
      where: { leadId: testLeadId }
    });

    // Query AVAILABLE properties matching budget, type, and location
    const matches = await prisma.property.findMany({
      where: {
        status: 'AVAILABLE',
        type: pref.preferredType,
        price: {
          gte: pref.minBudget,
          lte: pref.maxBudget,
        },
        address: {
          contains: pref.preferredLocation
        }
      }
    });

    if (matches.length === 0) {
      throw new Error('Expected at least one matching property from seed data (e.g. 10 Marla Luxury Villa at 42,000,000 in Block B)');
    }

    const villaMatch = matches.find(p => p.title.includes('10 Marla Luxury Villa'));
    if (!villaMatch) {
      throw new Error('Did not find correct seeded villa matching preferences');
    }
  });

  console.log('\n--- Test Execution Summary ---');
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runBuyersTests()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
