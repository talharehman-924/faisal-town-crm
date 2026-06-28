import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    } catch (e) {
      return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });
    }

    if (decoded.role === 'CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign template not found' }, { status: 404 });
    }

    // Determine target segment filters
    const where = {};
    if (campaign.targetAudience === 'NEW_LEADS') {
      where.status = 'NEW';
    } else if (campaign.targetAudience === 'QUALIFIED_LEADS') {
      where.status = 'QUALIFIED';
    }

    const targetLeads = await prisma.lead.findMany({ where });
    const targetCount = targetLeads.length;

    // Simulate send operation
    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: { status: 'SENT' },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        action: 'Campaign Sent',
        details: `Broadcasted campaign "${campaign.title}" to ${targetCount} contacts in segment "${campaign.targetAudience}"`,
        userId: decoded.userId,
      },
    });

    return NextResponse.json({
      message: 'Campaign simulated broadcast completed successfully',
      targetCount,
      campaign: updatedCampaign,
    });
  } catch (error) {
    console.error('Campaign send error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
