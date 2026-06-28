import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const { email, password, name, roleName } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      );
    }

    // Determine Role
    // For sandbox/development testing, we can let users specify roleName (ADMIN, AGENT, CLIENT).
    // If not specified, default to CLIENT.
    const targetRoleName = roleName || 'CLIENT';
    let role = await prisma.role.findUnique({
      where: { name: targetRoleName.toUpperCase() },
    });

    if (!role) {
      // Fallback to CLIENT if role doesn't exist
      role = await prisma.role.findUnique({
        where: { name: 'CLIENT' },
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        roleId: role.id,
      },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    // Don't return password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { message: 'User registered successfully', user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
