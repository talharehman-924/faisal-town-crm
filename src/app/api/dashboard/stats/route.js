import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    // Optional auth check for secure stats retrieval
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    } catch (err) {
      return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });
    }

    // Compute stats
    // 1. Total Sales Volume (CLOSED_WON deals)
    const closedWonDeals = await prisma.deal.findMany({
      where: { status: 'CLOSED_WON' },
    });
    const totalSalesVolume = closedWonDeals.reduce((sum, deal) => sum + deal.value, 0);

    // 2. Active Listings (AVAILABLE properties)
    const activeListingsCount = await prisma.property.count({
      where: { status: 'AVAILABLE' },
    });

    // 3. Open Deals (NEGOTIATION or UNDER_CONTRACT)
    const openDealsCount = await prisma.deal.count({
      where: {
        status: {
          in: ['NEGOTIATION', 'UNDER_CONTRACT'],
        },
      },
    });

    // 4. Conversion Rate (CLOSED_WON / Total Deals)
    const totalDeals = await prisma.deal.count();
    const conversionRate = totalDeals > 0 
      ? Math.round((closedWonDeals.length / totalDeals) * 100)
      : 0;

    // 5. Leads Status distribution
    const leads = await prisma.lead.findMany();
    const leadStats = {
      NEW: leads.filter(l => l.status === 'NEW').length,
      CONTACTED: leads.filter(l => l.status === 'CONTACTED').length,
      QUALIFIED: leads.filter(l => l.status === 'QUALIFIED').length,
      LOST: leads.filter(l => l.status === 'LOST').length,
      total: leads.length,
    };

    // 6. Property Status distribution
    const properties = await prisma.property.findMany();
    const propertyStats = {
      AVAILABLE: properties.filter(p => p.status === 'AVAILABLE').length,
      PENDING: properties.filter(p => p.status === 'PENDING').length,
      SOLD: properties.filter(p => p.status === 'SOLD').length,
      total: properties.length,
    };

    return NextResponse.json({
      totalSalesVolume,
      activeListingsCount,
      openDealsCount,
      conversionRate,
      leadStats,
      propertyStats,
      totalDeals,
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
