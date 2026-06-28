import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import jwt from 'jsonwebtoken';

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

    // Restriction check: Only ADMIN role is authorized to execute integration tests
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return new Promise((resolve) => {
      exec('npm run test', { cwd: process.cwd() }, (error, stdout, stderr) => {
        resolve(NextResponse.json({
          success: !error,
          log: stdout || stderr,
        }));
      });
    });
  } catch (error) {
    console.error('Test run error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
