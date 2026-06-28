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

    const agents = await prisma.user.findMany({
      where: {
        role: {
          name: {
            in: ['ADMIN', 'AGENT'],
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json({ agents });
  } catch (error) {
    console.error('Agents fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
