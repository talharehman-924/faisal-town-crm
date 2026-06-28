import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    } catch (e) {
      return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });
    }

    const key = await prisma.apiKey.findUnique({ where: { id } });
    if (!key) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    // Authorization ownership check
    if (key.userId !== decoded.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.apiKey.delete({ where: { id } });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        action: 'API Key Revoked',
        details: `Revoked developer API key "${key.name}"`,
        userId: decoded.userId
      }
    });

    return NextResponse.json({ message: 'API key successfully revoked' });
  } catch (error) {
    console.error('API key revocation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
