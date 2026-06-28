const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runDealsTests() {
  console.log('\n--- Running Phase 5 Deal Pipeline Integration Tests ---');
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

  let testDealId = null;

  // Test 1: Create a deal record directly (backend simulation)
  await test('Create Deal and Emit ActivityLog', async () => {
    const testTitle = 'Faisal Town Plot 89 Deal';
    const testValue = 85000000;
    
    // Find relations from seeding
    const property = await prisma.property.findFirst({ where: { title: 'Commercial Plot Sector A' } });
    const lead = await prisma.lead.findFirst({ where: { name: 'Zainab Bibi' } });
    const agent = await prisma.user.findFirst({ where: { email: 'agent@crm.com' } });

    if (!property || !lead || !agent) {
      throw new Error('Pre-requisite seed data missing for deal test');
    }

    const newDeal = await prisma.deal.create({
      data: {
        title: testTitle,
        value: testValue,
        status: 'NEGOTIATION',
        propertyId: property.id,
        leadId: lead.id,
        agentId: agent.id,
      }
    });

    testDealId = newDeal.id;

    if (!newDeal.id) {
      throw new Error('Failed to insert deal');
    }

    // Log Activity simulating backend route handler
    const log = await prisma.activityLog.create({
      data: {
        action: 'Deal Created',
        details: `Deal "${testTitle}" initiated for Property "${property.title}" and Lead "${lead.name}" (Value: ${testValue} PKR)`,
        userId: agent.id
      }
    });

    if (!log.id || log.action !== 'Deal Created') {
      throw new Error('Failed to log Deal Created activity');
    }
  });

  // Test 2: Query deals scoped by agent
  await test('Query Deals and fetch linked relations', async () => {
    const agent = await prisma.user.findFirst({ where: { email: 'agent@crm.com' } });
    const agentDeals = await prisma.deal.findMany({
      where: { agentId: agent.id },
      include: {
        property: true,
        lead: true,
      }
    });

    if (agentDeals.length === 0) {
      throw new Error('Should fetch active deals for assigned agent');
    }

    const testDeal = agentDeals.find(d => d.id === testDealId);
    if (!testDeal || !testDeal.property || !testDeal.lead) {
      throw new Error('Linked Property or Lead relationships failed to resolve');
    }
  });

  // Test 3: Update Deal Stage and audit logs
  await test('Update Deal Stage (Stage Transition) and audit logs', async () => {
    const originalDeal = await prisma.deal.findUnique({ where: { id: testDealId } });
    const updated = await prisma.deal.update({
      where: { id: testDealId },
      data: {
        status: 'UNDER_CONTRACT'
      }
    });

    if (updated.status !== 'UNDER_CONTRACT') {
      throw new Error('Stage transition failed to update');
    }

    // Log Activity
    const log = await prisma.activityLog.create({
      data: {
        action: 'Deal Stage Updated',
        details: `Deal "${updated.title}" stage advanced from ${originalDeal.status} to ${updated.status}`,
        userId: updated.agentId
      }
    });

    if (log.action !== 'Deal Stage Updated') {
      throw new Error('Failed to log Deal Stage Updated activity');
    }
  });

  // Test 4: Delete Deal
  await test('Delete Deal and cleanup', async () => {
    const deal = await prisma.deal.findUnique({ where: { id: testDealId } });
    await prisma.deal.delete({
      where: { id: testDealId }
    });

    const deletedCheck = await prisma.deal.findUnique({ where: { id: testDealId } });
    if (deletedCheck) {
      throw new Error('Deal was not successfully deleted');
    }

    // Log Activity
    const log = await prisma.activityLog.create({
      data: {
        action: 'Deal Deleted',
        details: `Deal "${deal.title}" (Value: ${deal.value} PKR) deleted successfully`,
        userId: deal.agentId
      }
    });

    if (log.action !== 'Deal Deleted') {
      throw new Error('Failed to log Deal Deleted activity');
    }
  });

  console.log('\n--- Test Execution Summary ---');
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runDealsTests()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
