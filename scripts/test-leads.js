const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runLeadsTests() {
  console.log('\n--- Running Phase 3 Lead Management Integration Tests ---');
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

  // Test 1: Create a lead record directly (backend simulation)
  await test('Create Lead and Emit ActivityLog', async () => {
    const testName = 'Lead Test Name';
    const testEmail = 'leadtest@gmail.com';
    const agent = await prisma.user.findFirst({ where: { email: 'agent@crm.com' } });

    const newLead = await prisma.lead.create({
      data: {
        name: testName,
        email: testEmail,
        phone: '03009999999',
        status: 'NEW',
        source: 'WEBSITE',
        agentId: agent.id,
      }
    });

    testLeadId = newLead.id;

    if (!newLead.id) {
      throw new Error('Failed to insert lead');
    }

    // Log Activity simulating backend route handler
    const log = await prisma.activityLog.create({
      data: {
        action: 'Lead Created',
        details: `Lead ${testName} (${testEmail}) created and assigned to ${agent.name}`,
        userId: agent.id
      }
    });

    if (!log.id || log.action !== 'Lead Created') {
      throw new Error('Failed to log Lead Created activity');
    }
  });

  // Test 2: Query filtering by status & search query
  await test('Query Leads with Status and Search Filters', async () => {
    const matchingLeads = await prisma.lead.findMany({
      where: {
        status: 'NEW',
        OR: [
          { name: { contains: 'Test' } },
          { email: { contains: 'test' } }
        ]
      }
    });

    if (matchingLeads.length === 0) {
      throw new Error('Filter query should return the newly inserted test lead');
    }
  });

  // Test 3: Update Lead
  await test('Update Lead Status and log changes', async () => {
    const updated = await prisma.lead.update({
      where: { id: testLeadId },
      data: {
        status: 'CONTACTED'
      }
    });

    if (updated.status !== 'CONTACTED') {
      throw new Error('Status failed to update');
    }

    // Log Activity
    const log = await prisma.activityLog.create({
      data: {
        action: 'Lead Updated',
        details: `Lead ${updated.name} updated status to CONTACTED`,
        userId: updated.agentId
      }
    });

    if (log.action !== 'Lead Updated') {
      throw new Error('Failed to log Lead Updated activity');
    }
  });

  // Test 4: Delete Lead
  await test('Delete Lead and cleanup', async () => {
    const lead = await prisma.lead.findUnique({ where: { id: testLeadId } });
    await prisma.lead.delete({
      where: { id: testLeadId }
    });

    const deletedCheck = await prisma.lead.findUnique({ where: { id: testLeadId } });
    if (deletedCheck) {
      throw new Error('Lead was not successfully deleted');
    }

    // Log Activity
    const log = await prisma.activityLog.create({
      data: {
        action: 'Lead Deleted',
        details: `Lead ${lead.name} deleted successfully`
      }
    });

    if (log.action !== 'Lead Deleted') {
      throw new Error('Failed to log Lead Deleted activity');
    }
  });

  console.log('\n--- Test Execution Summary ---');
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runLeadsTests()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
