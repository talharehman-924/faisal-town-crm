import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    } catch (e) {
      return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });
    }

    const { leadId, minBudget, maxBudget, preferredType, preferredLocation } = await request.json();

    if (!leadId || minBudget === undefined || maxBudget === undefined || !preferredType) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 400 });
    }

    const preference = await prisma.buyerPreference.upsert({
      where: { leadId },
      update: {
        minBudget: parseFloat(minBudget),
        maxBudget: parseFloat(maxBudget),
        preferredType,
        preferredLocation: preferredLocation || '',
      },
      create: {
        leadId,
        minBudget: parseFloat(minBudget),
        maxBudget: parseFloat(maxBudget),
        preferredType,
        preferredLocation: preferredLocation || '',
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        action: 'Buyer Preferences Updated',
        details: `Updated preferences for buyer ${lead.name} (Budget: ${minBudget}-${maxBudget} PKR, Type: ${preferredType})`,
        userId: decoded.userId,
      },
    });

    return NextResponse.json({ preference });
  } catch (error) {
    console.error('Preference saving error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
