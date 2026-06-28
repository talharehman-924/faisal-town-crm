import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(request, { params }) {
  try {
    const { leadId } = await params;
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
      jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    } catch (e) {
      return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });
    }

    const pref = await prisma.buyerPreference.findUnique({
      where: { leadId },
    });

    if (!pref) {
      return NextResponse.json({ matches: [], message: 'No preferences set for this buyer' });
    }

    // Matching criteria query
    const where = {
      status: 'AVAILABLE',
      type: pref.preferredType,
      price: {
        gte: pref.minBudget,
        lte: pref.maxBudget,
      },
    };

    if (pref.preferredLocation) {
      where.address = {
        contains: pref.preferredLocation,
      };
    }

    const matches = await prisma.property.findMany({
      where,
      orderBy: { price: 'asc' },
    });

    return NextResponse.json({ matches });
  } catch (error) {
    console.error('Buyer match error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
