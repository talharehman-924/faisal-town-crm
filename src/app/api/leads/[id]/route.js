import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

async function verifyAuthAndAccess(request, leadId) {
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

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
  });

  if (!lead) return { error: 'Lead not found', status: 404 };

  // Agent boundary check
  if (decoded.role === 'AGENT' && lead.agentId !== decoded.userId) {
    return { error: 'Forbidden: Lead assigned to another agent', status: 403 };
  }

  return { decoded, lead };
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const access = await verifyAuthAndAccess(request, id);
    if (access.error) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const lead = await prisma.lead.findUnique({
      where: { id },
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

    return NextResponse.json({ lead });
  } catch (error) {
    console.error('Lead GET error:', error);
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

    const { decoded, lead } = access;
    const { name, email, phone, status, source, agentId } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required fields' }, { status: 400 });
    }

    // Role check for changing agent assignment (Only Admin can reassign agents)
    let finalAgentId = lead.agentId;
    if (decoded.role === 'ADMIN') {
      finalAgentId = agentId || null;
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        name,
        email,
        phone: phone || null,
        status: status || lead.status,
        source: source || lead.source,
        agentId: finalAgentId,
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
        action: 'Lead Updated',
        details: `Lead ${name} updated by ${decoded.role}. Assigned agent: ${updatedLead.agent?.name || 'Unassigned'}`,
        userId: decoded.userId,
      },
    });

    return NextResponse.json({ lead: updatedLead });
  } catch (error) {
    console.error('Lead update error:', error);
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

    const { decoded, lead } = access;

    await prisma.lead.delete({
      where: { id },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        action: 'Lead Deleted',
        details: `Lead ${lead.name} (${lead.email}) deleted successfully`,
        userId: decoded.userId,
      },
    });

    return NextResponse.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Lead deletion error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
