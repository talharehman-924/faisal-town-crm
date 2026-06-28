const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runReportsTests() {
  console.log('\n--- Running Phase 9 Reports Integration Tests ---');
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

  // Test 1: Query database counts for leads and check conversion logic
  await test('Verify lead conversion rates metrics aggregations', async () => {
    const totalLeads = await prisma.lead.count();
    const qualifiedLeads = await prisma.lead.count({ where: { status: 'QUALIFIED' } });
    const conversionRate = totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0;

    // Seed has 4 leads total: 1 is qualified (Fatima Hassan)
    // Conversion rate: (1 / 4) * 100 = 25.0%
    if (conversionRate !== 25) {
      throw new Error(`Expected conversion rate 25.0%, calculated: ${conversionRate}%`);
    }
  });

  // Test 2: Verify property distributions
  await test('Verify property status allocations count correctly', async () => {
    const available = await prisma.property.count({ where: { status: 'AVAILABLE' } });
    const pending = await prisma.property.count({ where: { status: 'PENDING' } });
    const sold = await prisma.property.count({ where: { status: 'SOLD' } });

    // Seed has 4 properties: Luxury Villa (AVAILABLE), Commercial Plot (AVAILABLE), Brand New House (PENDING), Residential Plot (SOLD)
    if (available !== 2 || pending !== 1 || sold !== 1) {
      throw new Error(`Expected AVAILABLE: 2, PENDING: 1, SOLD: 1. Found: ${available}, ${pending}, ${sold}`);
    }
  });

  // Test 3: Verify Agent leaderboard calculations
  await test('Verify Agent Performance Leaderboard calculations', async () => {
    const agentRole = await prisma.role.findFirst({ where: { name: 'AGENT' } });
    const agents = await prisma.user.findMany({
      where: { roleId: agentRole?.id },
      include: {
        deals: {
          where: { status: 'CLOSED_WON' }
        }
      }
    });

    const leaderboard = agents.map(agent => {
      const salesVolume = agent.deals.reduce((sum, d) => sum + d.value, 0);
      return {
        name: agent.name,
        salesVolume
      };
    });

    const testAgent = leaderboard.find(a => a.name === 'Faisal Agent');
    if (!testAgent) {
      throw new Error('Faisal Agent not found on leaderboard');
    }

    // Seed has one CLOSED_WON deal for Faisal Agent: "Ahmed 10 Marla Villa Offer" with value 41,000,000 PKR
    if (testAgent.salesVolume !== 41000000) {
      throw new Error(`Expected sales volume for Faisal Agent to be 41,000,000, calculated: ${testAgent.salesVolume}`);
    }
  });

  console.log('\n--- Test Execution Summary ---');
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runReportsTests()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
