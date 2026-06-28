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

    const { leadId } = await request.json();
    if (!leadId) {
      return NextResponse.json({ error: 'Missing leadId' }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        buyerPreference: true,
        deals: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // AI scoring algorithm logic
    let score = 50; // base score
    let insights = '';

    // Factor 1: Status
    if (lead.status === 'QUALIFIED') score += 25;
    else if (lead.status === 'CONTACTED') score += 10;
    else if (lead.status === 'LOST') score -= 30;

    // Factor 2: Source
    if (lead.source === 'REFERRAL') score += 15;
    else if (lead.source === 'WEBSITE') score += 5;

    // Factor 3: Search Preferences & Deals
    if (lead.buyerPreference) {
      score += 10;
      insights = `Looking for ${lead.buyerPreference.preferredType} in ${lead.buyerPreference.preferredLocation || 'Faisal Town'}. `;
    } else {
      insights = 'No active search preferences configured. ';
    }

    if (lead.deals.length > 0) {
      score += 15;
      const activeDeal = lead.deals[0];
      insights += `Currently negotiating deal: "${activeDeal.title}" (Value: ${activeDeal.value} PKR).`;
    } else {
      insights += 'No active negotiations in pipeline.';
    }

    // Clamp score within 1-100 boundary limits
    score = Math.max(1, Math.min(100, score));
    insights = `AI Analysis: ${insights} Confidence Match Score: ${score}%`;

    // Cache calculated scores to DB
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        aiScore: score,
        aiInsights: insights,
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        action: 'Lead AI Scored',
        details: `Re-calculated AI metrics for lead ${lead.name} (Score: ${score}%, Insights: ${insights})`,
        userId: decoded.userId,
      },
    });

    return NextResponse.json({ lead: updatedLead });
  } catch (error) {
    console.error('AI lead scoring error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
