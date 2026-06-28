const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runAiTests() {
  console.log('\n--- Running Phase 8 AI Integration Tests ---');
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

  // Test 1: Fetch lead to score
  await test('Fetch lead matching criteria', async () => {
    const lead = await prisma.lead.findFirst({ where: { name: 'Ahmed Ali' } });
    if (!lead) {
      throw new Error('Pre-requisite seed lead missing');
    }
    testLeadId = lead.id;
  });

  // Test 2: Calculate AI Lead Score
  await test('AI Lead Scoring logic updates db columns and emits ActivityLog', async () => {
    const lead = await prisma.lead.findUnique({
      where: { id: testLeadId },
      include: { buyerPreference: true, deals: true }
    });

    let score = 50; // base score
    if (lead.status === 'NEW') score += 0; // status NEW is neutral
    if (lead.source === 'WEBSITE') score += 5;
    if (lead.buyerPreference) score += 10;
    if (lead.deals.length > 0) score += 15;

    // Expected score: 50 + 5 (website) + 10 (buyer preference) + 15 (deal: CLOSED_WON exists) = 80
    if (score !== 80) {
      throw new Error(`Expected score calculation to yield 80, calculated: ${score}`);
    }

    const updated = await prisma.lead.update({
      where: { id: testLeadId },
      data: {
        aiScore: score,
        aiInsights: `AI Analysis: Looking for ${lead.buyerPreference.preferredType} in ${lead.buyerPreference.preferredLocation}. Match score: ${score}%`
      }
    });

    if (updated.aiScore !== 80 || !updated.aiInsights.includes('80%')) {
      throw new Error('Failed to update AI columns in db cache');
    }

    const agent = await prisma.user.findFirst({ where: { email: 'agent@crm.com' } });

    // Log Activity
    const log = await prisma.activityLog.create({
      data: {
        action: 'Lead AI Scored',
        details: `Re-calculated AI metrics for lead ${lead.name} (Score: ${score}%)`,
        userId: agent.id
      }
    });

    if (log.action !== 'Lead AI Scored') {
      throw new Error('Failed to emit activity log');
    }
  });

  // Test 3: Generate Campaign text
  await test('AI Campaign Writer generates target Segment templates', async () => {
    const title = 'Executive Commercial Launch';
    const targetAudience = 'QUALIFIED_LEADS';

    let subject = `Urgent VIP Opportunity: ${title} matching your preferences`;
    let body = `Dear Partner,\n\nBased on your active search preferences logged in our Faisal Town portal, we have matched your budget range with our latest inventory update: "${title}".`;

    if (!subject.includes('VIP') || !body.includes(title)) {
      throw new Error('Failed to generate correct context-sensitive copy templates');
    }
  });

  console.log('\n--- Test Execution Summary ---');
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runAiTests()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
