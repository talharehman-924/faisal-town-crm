import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

async function verifyAuthAndAccess(request, dealId) {
  const token = request.cookies.get('token')?.value;
  if (!token) return { error: 'Unauthorized', status: 401 };

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
  } catch (err) {
    return { error: 'Invalid Session', status: 401 };
  }

  if (decoded.role === 'CLIENT') {
    return { error: 'Forbidden', status: 403 };
  }

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
  });

  if (!deal) return { error: 'Deal not found', status: 404 };

  // Agent boundary check
  if (decoded.role === 'AGENT' && deal.agentId !== decoded.userId) {
    return { error: 'Forbidden: Deal assigned to another agent', status: 403 };
  }

  return { decoded, deal };
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const access = await verifyAuthAndAccess(request, id);
    if (access.error) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        property: true,
        lead: true,
        agent: true,
      },
    });

    return NextResponse.json({ deal });
  } catch (error) {
    console.error('Deal GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const access = await verifyAuthAndAccess(request, id);
    if (access.error) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { decoded, deal } = access;
    const { title, value, status, propertyId, leadId, agentId } = await request.json();

    if (!title || !value || !propertyId || !leadId) {
      return NextResponse.json({ error: 'Title, value, property, and lead are required fields' }, { status: 400 });
    }

    // Role check for changing agent assignment (Only Admin can reassign agents)
    let finalAgentId = deal.agentId;
    if (decoded.role === 'ADMIN') {
      finalAgentId = agentId || deal.agentId;
    }

    const updatedDeal = await prisma.deal.update({
      where: { id },
      data: {
        title,
        value: parseFloat(value),
        status: status || deal.status,
        propertyId,
        leadId,
        agentId: finalAgentId,
      },
      include: {
        property: true,
        lead: true,
        agent: true,
      },
    });

    // Detect stage changes for precise activity logging
    const stageChanged = deal.status !== updatedDeal.status;
    const logAction = stageChanged ? 'Deal Stage Updated' : 'Deal Updated';
    const logDetails = stageChanged 
      ? `Deal "${title}" stage advanced from ${deal.status} to ${updatedDeal.status}`
      : `Deal "${title}" details updated (Value: ${value} PKR)`;

    // Log Activity
    await prisma.activityLog.create({
      data: {
        action: logAction,
        details: logDetails,
        userId: decoded.userId,
      },
    });

    return NextResponse.json({ deal: updatedDeal });
  } catch (error) {
    console.error('Deal update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const access = await verifyAuthAndAccess(request, id);
    if (access.error) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { decoded, deal } = access;

    await prisma.deal.delete({
      where: { id },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        action: 'Deal Deleted',
        details: `Deal "${deal.title}" (Value: ${deal.value} PKR) deleted successfully`,
        userId: decoded.userId,
      },
    });

    return NextResponse.json({ message: 'Deal deleted successfully' });
  } catch (error) {
    console.error('Deal deletion error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
