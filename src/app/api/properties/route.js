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
    } catch (err) {
      return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')) : null;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')) : null;

    // Build Prisma query filters
    const where = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { address: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (minPrice !== null || maxPrice !== null) {
      where.price = {};
      if (minPrice !== null) where.price.gte = minPrice;
      if (maxPrice !== null) where.price.lte = maxPrice;
    }

    const properties = await prisma.property.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ properties });
  } catch (error) {
    console.error('Properties fetch error:', error);
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

    // Role check: CLIENT role cannot manage properties
    if (decoded.role === 'CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { title, description, price, address, status, type } = await request.json();

    if (!title || !price || !address) {
      return NextResponse.json(
        { error: 'Title, price, and address are required fields' },
        { status: 400 }
      );
    }

    // Create property record
    const property = await prisma.property.create({
      data: {
        title,
        description: description || null,
        price: parseFloat(price),
        address,
        status: status || 'AVAILABLE',
        type: type || 'RESIDENTIAL',
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        action: 'Property Created',
        details: `Property listing "${title}" added at ${address} for ${price} PKR`,
        userId: decoded.userId,
      },
    });

    return NextResponse.json({ property }, { status: 201 });
  } catch (error) {
    console.error('Property creation error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
