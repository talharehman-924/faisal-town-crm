import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    } catch (err) {
      return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const source = searchParams.get('source') || '';

    // Build Prisma query filters
    const where = {};

    // Role-based visibility
    if (decoded.role === 'AGENT') {
      where.agentId = decoded.userId;
    } else if (decoded.role === 'CLIENT') {
      // Clients shouldn't be viewing leads list
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Search query mapping (name/email/phone match)
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (source) {
      where.source = source;
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ leads });
  } catch (error) {
    console.error('Leads fetch error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
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
    } catch (err) {
      return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });
    }

    // Role check: CLIENT role cannot manage leads
    if (decoded.role === 'CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, email, phone, status, source, agentId } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required fields' },
        { status: 400 }
      );
    }

    // Create lead record
    // Default agent is the current user if it is an AGENT
    const assignedAgentId = decoded.role === 'AGENT' ? decoded.userId : (agentId || null);

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone: phone || null,
        status: status || 'NEW',
        source: source || 'WEBSITE',
        agentId: assignedAgentId,
      },
      include: {
        agent: {
          select: {
            name: true,
          },
        },
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        action: 'Lead Created',
        details: `Lead ${name} (${email}) created and assigned to ${lead.agent?.name || 'Unassigned'}`,
        userId: decoded.userId,
      },
    });

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    console.error('Lead creation error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
