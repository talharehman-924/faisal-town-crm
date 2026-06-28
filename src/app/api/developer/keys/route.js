import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    } catch (e) {
      return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });
    }

    const keys = await prisma.apiKey.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ keys });
  } catch (error) {
    console.error('API keys fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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

    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Generate random secure token
    const generatedKey = `ft_${crypto.randomBytes(16).toString('hex')}`;

    const newKey = await prisma.apiKey.create({
      data: {
        key: generatedKey,
        name,
        userId: decoded.userId
      }
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        action: 'API Key Created',
        details: `Generated new developer API key "${name}"`,
        userId: decoded.userId
      }
    });

    return NextResponse.json({ apiKey: newKey }, { status: 201 });
  } catch (error) {
    console.error('API key generation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
