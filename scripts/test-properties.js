const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runPropertiesTests() {
  console.log('\n--- Running Phase 4 Property Module Integration Tests ---');
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

  let testPropId = null;

  // Test 1: Create a property record directly (backend simulation)
  await test('Create Property Listing and Emit ActivityLog', async () => {
    const testTitle = 'Penthouse Suite Test';
    const testPrice = 15000000;
    const testAddress = 'Block A, Faisal Town';
    const agent = await prisma.user.findFirst({ where: { email: 'agent@crm.com' } });

    const newProp = await prisma.property.create({
      data: {
        title: testTitle,
        price: testPrice,
        address: testAddress,
        status: 'AVAILABLE',
        type: 'RESIDENTIAL',
      }
    });

    testPropId = newProp.id;

    if (!newProp.id) {
      throw new Error('Failed to insert property');
    }

    // Log Activity simulating backend route handler
    const log = await prisma.activityLog.create({
      data: {
        action: 'Property Created',
        details: `Property listing "${testTitle}" added at ${testAddress} for ${testPrice} PKR`,
        userId: agent.id
      }
    });

    if (!log.id || log.action !== 'Property Created') {
      throw new Error('Failed to log Property Created activity');
    }
  });

  // Test 2: Query filtering by status & type & price range
  await test('Query Properties with status, type, and price range filters', async () => {
    const matchingProps = await prisma.property.findMany({
      where: {
        status: 'AVAILABLE',
        type: 'RESIDENTIAL',
        price: {
          gte: 10000000,
          lte: 20000000,
        }
      }
    });

    if (matchingProps.length === 0) {
      throw new Error('Filter query should return the newly inserted test property');
    }
  });

  // Test 3: Update Property details
  await test('Update Property Price and Status and log changes', async () => {
    const updated = await prisma.property.update({
      where: { id: testPropId },
      data: {
        price: 15500000,
        status: 'PENDING'
      }
    });

    if (updated.price !== 15500000 || updated.status !== 'PENDING') {
      throw new Error('Property fields failed to update');
    }

    const agent = await prisma.user.findFirst({ where: { email: 'agent@crm.com' } });

    // Log Activity
    const log = await prisma.activityLog.create({
      data: {
        action: 'Property Updated',
        details: `Property "${updated.title}" updated price to 15500000 PKR`,
        userId: agent.id
      }
    });

    if (log.action !== 'Property Updated') {
      throw new Error('Failed to log Property Updated activity');
    }
  });

  // Test 4: Delete Property
  await test('Delete Property and cleanup', async () => {
    const prop = await prisma.property.findUnique({ where: { id: testPropId } });
    await prisma.property.delete({
      where: { id: testPropId }
    });

    const deletedCheck = await prisma.property.findUnique({ where: { id: testPropId } });
    if (deletedCheck) {
      throw new Error('Property was not successfully deleted');
    }

    const agent = await prisma.user.findFirst({ where: { email: 'agent@crm.com' } });

    // Log Activity
    const log = await prisma.activityLog.create({
      data: {
        action: 'Property Deleted',
        details: `Property listing "${prop.title}" was removed`,
        userId: agent.id
      }
    });

    if (log.action !== 'Property Deleted') {
      throw new Error('Failed to log Property Deleted activity');
    }
  });

  console.log('\n--- Test Execution Summary ---');
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runPropertiesTests()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
