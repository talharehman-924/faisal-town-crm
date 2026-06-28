import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
      jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    } catch (e) {
      return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });
    }

    const { title, targetAudience } = await request.json();
    if (!title || !targetAudience) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Heuristic generator fallback
    let subject = `Exclusive Launch: ${title} in Faisal Town!`;
    let body = `Dear Buyer,\n\nWe are excited to share an exclusive update regarding "${title}". As a valued contact in our "${targetAudience}" segment, we wanted to ensure you receive priority booking options and early pricing lists.\n\nFaisal Town is rapidly expanding, and premium plots in this sector represent a highly lucrative real estate opportunity with substantial capital appreciation yields.\n\nReply directly to this email or reach out to your assigned agent to secure a site visit.\n\nBest regards,\nFaisal Town CRM Marketing Team`;

    if (targetAudience === 'QUALIFIED_LEADS') {
      subject = `Urgent VIP Opportunity: ${title} matching your preferences`;
      body = `Dear Partner,\n\nBased on your active search preferences logged in our Faisal Town portal, we have matched your budget range with our latest inventory update: "${title}".\n\nThese premium plots are in high demand and are currently available for immediate contract signing.\n\nPlease review details in your buyer dashboard or schedule an urgent call with your agent.\n\nWarm regards,\nFaisal Town CRM Sales Team`;
    }

    return NextResponse.json({ subject, body });
  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
