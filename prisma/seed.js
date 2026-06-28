const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Wipe existing tables in safe order
  await prisma.activityLog.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.buyerPreference.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.property.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.apiKey.deleteMany();

  // 1. Create Permissions
  const permissionsData = [
    { name: 'view:dashboard', description: 'Access dashboard summary' },
    { name: 'manage:leads', description: 'Create, update, delete leads' },
    { name: 'manage:properties', description: 'Manage listings and details' },
    { name: 'manage:deals', description: 'Track negotiations and pipeline' },
    { name: 'view:reports', description: 'View performance metrics' },
    { name: 'manage:settings', description: 'Change system configuration' },
  ];

  const permissions = {};
  for (const perm of permissionsData) {
    permissions[perm.name] = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }
  console.log('Permissions seeded.');

  // 2. Create Roles
  const rolesData = [
    {
      name: 'ADMIN',
      description: 'System administrator with full access',
      permissions: Object.values(permissions),
    },
    {
      name: 'AGENT',
      description: 'Real estate agent who manages properties and clients',
      permissions: [
        permissions['view:dashboard'],
        permissions['manage:leads'],
        permissions['manage:properties'],
        permissions['manage:deals'],
      ],
    },
    {
      name: 'CLIENT',
      description: 'Property buyer or seller client',
      permissions: [
        permissions['view:dashboard'],
      ],
    },
  ];

  const roles = {};
  for (const roleInfo of rolesData) {
    roles[roleInfo.name] = await prisma.role.upsert({
      where: { name: roleInfo.name },
      update: {
        permissions: {
          set: roleInfo.permissions.map(p => ({ id: p.id })),
        },
      },
      create: {
        name: roleInfo.name,
        description: roleInfo.description,
        permissions: {
          connect: roleInfo.permissions.map(p => ({ id: p.id })),
        },
      },
    });
  }
  console.log('Roles seeded.');

  // 3. Create Users
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const agentPassword = await bcrypt.hash('agent123', 10);
  const clientPassword = await bcrypt.hash('client123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@crm.com' },
    update: {},
    create: {
      email: 'admin@crm.com',
      name: 'System Admin',
      password: hashedPassword,
      roleId: roles['ADMIN'].id,
    },
  });

  const agentUser = await prisma.user.upsert({
    where: { email: 'agent@crm.com' },
    update: {},
    create: {
      email: 'agent@crm.com',
      name: 'Faisal Agent',
      password: agentPassword,
      roleId: roles['AGENT'].id,
    },
  });

  const clientUser = await prisma.user.upsert({
    where: { email: 'client@crm.com' },
    update: {},
    create: {
      email: 'client@crm.com',
      name: 'Zahid Khan',
      password: clientPassword,
      roleId: roles['CLIENT'].id,
    },
  });

  console.log('Users seeded.');

  // 4. Create Properties
  const propertiesData = [
    { title: '10 Marla Luxury Villa', description: 'Double story modern villa in Faisal Town Executive Block', price: 42000000, address: 'Plot 412, Block B, Faisal Town', status: 'AVAILABLE', type: 'RESIDENTIAL' },
    { title: 'Commercial Plot Sector A', description: 'Corner commercial plot near main boulevard', price: 85000000, address: 'Plot 89, Sector A, Faisal Town', status: 'AVAILABLE', type: 'COMMERCIAL' },
    { title: '5 Marla Brand New House', description: 'Modern design layout, 3 bedrooms', price: 23000000, address: 'Plot 104, Block C, Faisal Town', status: 'PENDING', type: 'RESIDENTIAL' },
    { title: '1 Kanal Residential Plot', description: 'Prime location plot facing park', price: 55000000, address: 'Plot 2, Block A, Faisal Town', status: 'SOLD', type: 'LAND' },
  ];

  const properties = [];
  for (const prop of propertiesData) {
    const createdProp = await prisma.property.create({ data: prop });
    properties.push(createdProp);
  }
  console.log('Properties seeded.');

  // 5. Create Leads
  const leadsData = [
    { name: 'Ahmed Ali', email: 'ahmed@gmail.com', phone: '03001234567', status: 'NEW', source: 'WEBSITE', agentId: agentUser.id, aiScore: 88, aiInsights: 'Highly interested in Executive block residential properties. Match probability: 88%' },
    { name: 'Zainab Bibi', email: 'zainab@yahoo.com', phone: '03217654321', status: 'CONTACTED', source: 'REFERRAL', agentId: agentUser.id, aiScore: 95, aiInsights: 'Looking for premium commercial plots. Budget matches main boulevard listings. Match probability: 95%' },
    { name: 'Fatima Hassan', email: 'fatima@outlook.com', phone: '03339876543', status: 'QUALIFIED', source: 'SOCIAL_MEDIA', agentId: agentUser.id, aiScore: 72, aiInsights: 'Interested in smaller residential units. Budget matches 5 Marla houses. Match probability: 72%' },
    { name: 'Usman Lodhi', email: 'usman@gmail.com', phone: '03454567890', status: 'LOST', source: 'WEBSITE', agentId: agentUser.id, aiScore: 15, aiInsights: 'Lost prospect. No budget preferences set, phone unreachable. Lead score: 15%' },
  ];

  const leads = [];
  for (const lead of leadsData) {
    const createdLead = await prisma.lead.create({ data: lead });
    leads.push(createdLead);
  }
  console.log('Leads seeded.');

  // 6. Create Deals
  const dealsData = [
    { title: 'Zainab Commercial Deal', value: 85000000, status: 'NEGOTIATION', propertyId: properties[1].id, leadId: leads[1].id, agentId: agentUser.id },
    { title: 'Fatima 5 Marla House Purchase', value: 23000000, status: 'UNDER_CONTRACT', propertyId: properties[2].id, leadId: leads[2].id, agentId: agentUser.id },
    { title: 'Ahmed 10 Marla Villa Offer', value: 41000000, status: 'CLOSED_WON', propertyId: properties[0].id, leadId: leads[0].id, agentId: agentUser.id },
  ];

  for (const deal of dealsData) {
    await prisma.deal.create({ data: deal });
  }
  console.log('Deals seeded.');

  // 7. Create Buyer Preferences
  const prefData = [
    { leadId: leads[0].id, minBudget: 35000000, maxBudget: 45000000, preferredType: 'RESIDENTIAL', preferredLocation: 'Block B' },
    { leadId: leads[1].id, minBudget: 80000000, maxBudget: 90000000, preferredType: 'COMMERCIAL', preferredLocation: 'Sector A' },
    { leadId: leads[2].id, minBudget: 20000000, maxBudget: 25000000, preferredType: 'RESIDENTIAL', preferredLocation: 'Block C' },
  ];

  for (const pref of prefData) {
    await prisma.buyerPreference.create({ data: pref });
  }
  console.log('Buyer preferences seeded.');

  // 8. Create Campaigns
  const campaignsData = [
    { title: 'Executive Block Launch Notice', subject: 'Exciting Launch: Executive Block Plots in Faisal Town!', body: 'Dear buyer, we are pleased to inform you that new plots are now available in the Executive Block. Contact your assigned agent today!', status: 'DRAFT', targetAudience: 'ALL_LEADS' },
    { title: 'Qualified Buyers Follow-up Campaign', subject: 'Premium listings matching your budget', body: 'Greetings! We have parsed new properties matching your requirements in Faisal Town. View them today!', status: 'SENT', targetAudience: 'QUALIFIED_LEADS' }
  ];

  for (const cam of campaignsData) {
    await prisma.campaign.create({ data: cam });
  }
  console.log('Campaigns seeded.');

  // 9. Create System Settings
  const settingsData = [
    { key: 'brandingName', value: 'FAISAL TOWN CRM' },
    { key: 'currencySymbol', value: 'PKR' }
  ];

  for (const set of settingsData) {
    await prisma.systemSetting.create({ data: set });
  }
  console.log('System settings seeded.');

  // 10. Create Activity Logs
  const activitiesData = [
    { action: 'Lead Created', details: 'Lead Ahmed Ali registered from Website', userId: agentUser.id },
    { action: 'Property Status Updated', details: 'Plot 104, Block C status set to PENDING', userId: adminUser.id },
    { action: 'Deal Stage Updated', details: 'Ahmed 10 Marla Villa Offer marked CLOSED_WON', userId: agentUser.id },
    { action: 'User Registration', details: 'Zahid Khan registered as CLIENT', userId: adminUser.id },
  ];

  for (const act of activitiesData) {
    await prisma.activityLog.create({ data: act });
  }
  console.log('Activity logs seeded.');

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
