import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: true,
      },
    });

    const permissions = await prisma.permission.findMany();

    return NextResponse.json({ roles, permissions });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
