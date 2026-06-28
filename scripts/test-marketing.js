const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runMarketingTests() {
  console.log('\n--- Running Phase 7 Marketing Integration Tests ---');
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

  let testCampaignId = null;

  // Test 1: Create a draft campaign template directly
  await test('Create Campaign template and emit ActivityLog', async () => {
    const testTitle = 'Test Campaign Block B';
    const testSubject = 'Plot Launch Special Offer';
    const agent = await prisma.user.findFirst({ where: { email: 'agent@crm.com' } });

    const newCamp = await prisma.campaign.create({
      data: {
        title: testTitle,
        subject: testSubject,
        body: 'Special discount for early buyers in Block B...',
        targetAudience: 'NEW_LEADS',
        status: 'DRAFT'
      }
    });

    testCampaignId = newCamp.id;

    if (!newCamp.id) {
      throw new Error('Failed to insert campaign');
    }

    // Log Activity
    const log = await prisma.activityLog.create({
      data: {
        action: 'Campaign Drafted',
        details: `Marketing campaign template "${testTitle}" drafted for segment NEW_LEADS`,
        userId: agent.id
      }
    });

    if (!log.id || log.action !== 'Campaign Drafted') {
      throw new Error('Failed to log Campaign Drafted activity');
    }
  });

  // Test 2: Query targeted audience segmentation count
  await test('Query targeted audience counts correct segment size', async () => {
    const campaign = await prisma.campaign.findUnique({ where: { id: testCampaignId } });
    
    const newLeadsCount = await prisma.lead.count({
      where: { status: 'NEW' }
    });

    // Seed has 4 leads total: Ahmed Ali (status NEW), Usman Lodhi (status LOST), Zainab (status CONTACTED), Fatima (status QUALIFIED)
    // Only Ahmed Ali is NEW => count should be 1
    if (newLeadsCount !== 1) {
      throw new Error(`Expected 1 NEW lead for segment NEW_LEADS, found ${newLeadsCount}`);
    }
  });

  // Test 3: Simulate send action and logs
  await test('Simulate Send campaign template and update status & audit logs', async () => {
    const agent = await prisma.user.findFirst({ where: { email: 'agent@crm.com' } });

    const updated = await prisma.campaign.update({
      where: { id: testCampaignId },
      data: { status: 'SENT' }
    });

    if (updated.status !== 'SENT') {
      throw new Error('Status failed to transition to SENT');
    }

    const newLeadsCount = await prisma.lead.count({ where: { status: 'NEW' } });

    // Log Activity
    const log = await prisma.activityLog.create({
      data: {
        action: 'Campaign Sent',
        details: `Broadcasted campaign "${updated.title}" to ${newLeadsCount} contacts in segment "NEW_LEADS"`,
        userId: agent.id
      }
    });

    if (log.action !== 'Campaign Sent') {
      throw new Error('Failed to log Campaign Sent activity');
    }
  });

  // Clean up test campaign
  await prisma.campaign.delete({ where: { id: testCampaignId } });

  console.log('\n--- Test Execution Summary ---');
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runMarketingTests()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
