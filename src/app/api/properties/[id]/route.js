import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

async function verifyAuthAndAccess(request) {
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

  return { decoded };
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
      jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    } catch (e) {
      return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });
    }

    const property = await prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json({ property });
  } catch (error) {
    console.error('Property GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const access = await verifyAuthAndAccess(request);
    if (access.error) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { decoded } = access;
    const { title, description, price, address, status, type } = await request.json();

    if (!title || !price || !address) {
      return NextResponse.json({ error: 'Title, price, and address are required fields' }, { status: 400 });
    }

    const existingProperty = await prisma.property.findUnique({ where: { id } });
    if (!existingProperty) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: {
        title,
        description: description || null,
        price: parseFloat(price),
        address,
        status: status || existingProperty.status,
        type: type || existingProperty.type,
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        action: 'Property Updated',
        details: `Property "${title}" updated by ${decoded.role}. New price: ${price} PKR. Status: ${status}`,
        userId: decoded.userId,
      },
    });

    return NextResponse.json({ property: updatedProperty });
  } catch (error) {
    console.error('Property update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const access = await verifyAuthAndAccess(request);
    if (access.error) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { decoded } = access;
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Delete property
    await prisma.property.delete({
      where: { id },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        action: 'Property Deleted',
        details: `Property listing "${property.title}" was removed`,
        userId: decoded.userId,
      },
    });

    return NextResponse.json({ message: 'Property listing deleted successfully' });
  } catch (error) {
    console.error('Property deletion error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
