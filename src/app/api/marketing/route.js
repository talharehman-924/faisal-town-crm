import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    } catch (e) {
      return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });
    }

    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Campaigns fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    } catch (e) {
      return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });
    }

    // Role check: CLIENT role cannot manage marketing campaigns
    if (decoded.role === 'CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { title, subject, body, targetAudience } = await request.json();

    if (!title || !subject || !body || !targetAudience) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        title,
        subject,
        body,
        targetAudience,
        status: 'DRAFT',
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        action: 'Campaign Drafted',
        details: `Marketing campaign template "${title}" drafted for segment ${targetAudience}`,
        userId: decoded.userId,
      },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error('Campaign creation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
