import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const settingsList = await prisma.systemSetting.findMany();
    const settings = {};
    settingsList.forEach(s => {
      settings[s.key] = s.value;
    });

    // Default fallbacks if empty
    if (!settings.brandingName) settings.brandingName = 'FAISAL TOWN CRM';
    if (!settings.currencySymbol) settings.currencySymbol = 'PKR';

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Settings fetch error:', error);
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

    // Role check: Only ADMIN can change system branding
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { brandingName, currencySymbol } = await request.json();

    if (!brandingName || !currencySymbol) {
      return NextResponse.json({ error: 'Missing settings values' }, { status: 400 });
    }

    await prisma.systemSetting.upsert({
      where: { key: 'brandingName' },
      update: { value: brandingName },
      create: { key: 'brandingName', value: brandingName }
    });

    await prisma.systemSetting.upsert({
      where: { key: 'currencySymbol' },
      update: { value: currencySymbol },
      create: { key: 'currencySymbol', value: currencySymbol }
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        action: 'System Settings Updated',
        details: `Updated branding name to "${brandingName}" and currency to "${currencySymbol}"`,
        userId: decoded.userId
      }
    });

    return NextResponse.json({ message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Settings saving error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
