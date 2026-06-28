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

    // Build Prisma query filters
    const where = {};

    // Role-based visibility
    if (decoded.role === 'AGENT') {
      where.agentId = decoded.userId;
    } else if (decoded.role === 'CLIENT') {
      // Clients shouldn't be viewing deals list
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const deals = await prisma.deal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            price: true,
            address: true,
          },
        },
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ deals });
  } catch (error) {
    console.error('Deals fetch error:', error);
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

    // Role check: CLIENT role cannot manage deals
    if (decoded.role === 'CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { title, value, status, propertyId, leadId, agentId } = await request.json();

    if (!title || !value || !propertyId || !leadId) {
      return NextResponse.json(
        { error: 'Title, value, property, and lead are required fields' },
        { status: 400 }
      );
    }

    // Verify Property and Lead exist
    const [property, lead] = await Promise.all([
      prisma.property.findUnique({ where: { id: propertyId } }),
      prisma.lead.findUnique({ where: { id: leadId } }),
    ]);

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 400 });
    }

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 400 });
    }

    // Default agent assignment
    const assignedAgentId = decoded.role === 'AGENT' ? decoded.userId : (agentId || decoded.userId);

    // Create deal record
    const deal = await prisma.deal.create({
      data: {
        title,
        value: parseFloat(value),
        status: status || 'NEGOTIATION',
        propertyId,
        leadId,
        agentId: assignedAgentId,
      },
      include: {
        property: true,
        lead: true,
        agent: true,
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        action: 'Deal Created',
        details: `Deal "${title}" initiated for Property "${property.title}" and Lead "${lead.name}" (Value: ${value} PKR)`,
        userId: decoded.userId,
      },
    });

    return NextResponse.json({ deal }, { status: 201 });
  } catch (error) {
    console.error('Deal creation error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
