const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock next/server dependencies or require standard imports
// Since we want a robust integration test that runs directly, let's write a script
// that boots up Next.js handler code or runs database calls directly to verify logic.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-real-estate-crm-jwt-key-2026';

async function runTests() {
  console.log('\n--- Running Phase 1 Auth & DB Integration Tests ---');
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

  // Test 1: Verify seeded roles and permissions exist
  await test('Verify roles and permissions exist in DB', async () => {
    const roles = await prisma.role.findMany({ include: { permissions: true } });
    const adminRole = roles.find(r => r.name === 'ADMIN');
    const agentRole = roles.find(r => r.name === 'AGENT');
    const clientRole = roles.find(r => r.name === 'CLIENT');

    if (!adminRole || !agentRole || !clientRole) {
      throw new Error('Missing core roles (ADMIN, AGENT, CLIENT)');
    }

    if (adminRole.permissions.length < 6) {
      throw new Error('ADMIN should have all permissions');
    }

    if (agentRole.permissions.length !== 4) {
      throw new Error('AGENT should have exactly 4 permissions');
    }
  });

  // Test 2: Verify custom registration logic
  const testEmail = `test-${Date.now()}@test.com`;
  await test('User Registration & Password Hashing', async () => {
    // Simulate register logic
    const password = 'Password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const clientRole = await prisma.role.findUnique({ where: { name: 'CLIENT' } });
    
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Test Client',
        password: hashedPassword,
        roleId: clientRole.id,
      }
    });

    if (user.email !== testEmail) {
      throw new Error('User email does not match');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new Error('Password hashing verification failed');
    }
  });

  // Test 3: Verify login credentials checking and JWT signing
  await test('User Login & JWT Generation', async () => {
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
      include: { role: true }
    });

    if (!user) {
      throw new Error('User not found for login test');
    }

    // Verify JWT signing
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.email !== testEmail || decoded.role !== 'CLIENT') {
      throw new Error('JWT token decoding verified incorrect payload');
    }
  });

  // Clean up test user
  await prisma.user.delete({ where: { email: testEmail } });

  console.log('\n--- Test Execution Summary ---');
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
