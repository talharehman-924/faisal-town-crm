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
    } catch (e) {
      return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });
    }

    const where = {
      status: {
        in: ['NEW', 'CONTACTED', 'QUALIFIED'],
      },
    };

    if (decoded.role === 'AGENT') {
      where.agentId = decoded.userId;
    }

    const buyers = await prisma.lead.findMany({
      where,
      include: {
        buyerPreference: true,
        agent: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ buyers });
  } catch (error) {
    console.error('Buyers fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
