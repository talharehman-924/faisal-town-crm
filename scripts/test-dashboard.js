const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runDashboardTests() {
  console.log('\n--- Running Phase 2 Dashboard Integration Tests ---');
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

  // Test 1: Verify seeded properties count & filtering
  await test('Verify Active Listings count & status filter', async () => {
    const activeCount = await prisma.property.count({
      where: { status: 'AVAILABLE' }
    });

    // Seed has 4 properties total, 2 are AVAILABLE ("10 Marla Luxury Villa", "Commercial Plot Sector A")
    if (activeCount !== 2) {
      throw new Error(`Expected 2 active listings, found ${activeCount}`);
    }
  });

  // Test 2: Verify Seeded Deals calculations & Sales Volume
  await test('Verify Sales Volume calculation (Closed-Won Sum)', async () => {
    const closedWonDeals = await prisma.deal.findMany({
      where: { status: 'CLOSED_WON' }
    });

    const sum = closedWonDeals.reduce((acc, deal) => acc + deal.value, 0);

    // Seed has 1 CLOSED_WON deal value 41,000,000 ("Ahmed 10 Marla Villa Offer")
    if (sum !== 41000000) {
      throw new Error(`Expected sales volume to be 41,000,000, found ${sum}`);
    }
  });

  // Test 3: Verify Conversion rate calculation
  await test('Verify deal conversion rate percentage calculation', async () => {
    const total = await prisma.deal.count();
    const wonCount = await prisma.deal.count({ where: { status: 'CLOSED_WON' } });
    const conversion = total > 0 ? Math.round((wonCount / total) * 100) : 0;

    // Seed has 3 deals total, 1 won => 1/3 => 33%
    if (conversion !== 33) {
      throw new Error(`Expected conversion rate to be 33%, found ${conversion}%`);
    }
  });

  // Test 4: Verify recent activity log retrieval
  await test('Verify recent ActivityLogs exist and order correctly', async () => {
    const activities = await prisma.activityLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    if (activities.length === 0) {
      throw new Error('No activity logs found in database');
    }

    if (activities.length > 1 && activities[0].createdAt < activities[1].createdAt) {
      throw new Error('Activity logs are not sorted by newest first');
    }
  });

  console.log('\n--- Test Execution Summary ---');
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runDashboardTests()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
