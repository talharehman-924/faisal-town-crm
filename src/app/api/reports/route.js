import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
      jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    } catch (e) {
      return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });
    }

    // 1. Lead Metrics
    const totalLeads = await prisma.lead.count();
    const qualifiedLeads = await prisma.lead.count({ where: { status: 'QUALIFIED' } });
    const leadConversionRate = totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0;

    // 2. Property Status Distribution
    const totalProperties = await prisma.property.count();
    const availableProperties = await prisma.property.count({ where: { status: 'AVAILABLE' } });
    const pendingProperties = await prisma.property.count({ where: { status: 'PENDING' } });
    const soldProperties = await prisma.property.count({ where: { status: 'SOLD' } });

    // 3. Agent Performance Leaderboard
    // Fetch all users with AGENT role (or all agents)
    const agentRole = await prisma.role.findFirst({ where: { name: 'AGENT' } });
    const agents = await prisma.user.findMany({
      where: { roleId: agentRole?.id },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            leads: true,
            deals: true,
          },
        },
        deals: {
          where: { status: 'CLOSED_WON' },
          select: {
            value: true,
          },
        },
      },
    });

    const leaderboard = agents.map(agent => {
      const salesVolume = agent.deals.reduce((sum, d) => sum + d.value, 0);
      return {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        leadCount: agent._count.leads,
        dealCount: agent._count.deals,
        salesVolume,
      };
    }).sort((a, b) => b.salesVolume - a.salesVolume);

    // 4. Lead Source efficiency metrics
    const sources = ['WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'OTHER'];
    const sourceMetrics = await Promise.all(
      sources.map(async (src) => {
        const total = await prisma.lead.count({ where: { source: src } });
        const qualified = await prisma.lead.count({ where: { source: src, status: 'QUALIFIED' } });
        return {
          source: src,
          total,
          qualified,
          conversion: total > 0 ? (qualified / total) * 100 : 0,
        };
      })
    );

    return NextResponse.json({
      leads: {
        total: totalLeads,
        qualified: qualifiedLeads,
        conversionRate: parseFloat(leadConversionRate.toFixed(1)),
      },
      properties: {
        total: totalProperties,
        available: availableProperties,
        pending: pendingProperties,
        sold: soldProperties,
      },
      leaderboard,
      sourceMetrics,
    });
  } catch (error) {
    console.error('Reports fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
