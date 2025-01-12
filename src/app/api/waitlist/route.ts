// app/api/waitlist/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { waitlist } from '@/db/schema';
import { nanoid } from 'nanoid';

// Rate limiting implementation
const rateLimit = new Map();
const RATE_LIMIT_DURATION = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per minute

// Validate email format
const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// API Security middleware
const validateRequest = async (request: Request) => {
  const headersList = await headers();
  const origin = headersList.get('origin');
  const allowedOrigins = [
    'https://smartpractise.com',
    'https://www.smartpractise.com',
    'http://localhost:3000',
    'http://localhost:3001'
  ];

  // Origin check
  if (!allowedOrigins.includes(origin || '')) {
    return { isValid: false, error: 'Invalid origin', status: 403 };
  }

  // Rate limiting
  const ip = headersList.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  const userRate = rateLimit.get(ip) || { count: 0, timestamp: now };

  if (now - userRate.timestamp > RATE_LIMIT_DURATION) {
    userRate.count = 1;
    userRate.timestamp = now;
  } else {
    userRate.count++;
    if (userRate.count > MAX_REQUESTS) {
      return { isValid: false, error: 'Rate limit exceeded', status: 429 };
    }
  }
  rateLimit.set(ip, userRate);

  return { isValid: true };
};

export async function POST(request: Request) {
  try {
    // Validate request
    const validation = await validateRequest(request);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { email, consent, referralSource } = body;

    // Validate required fields
    if (!email || consent === undefined) {
      return NextResponse.json(
        { error: 'Email and consent are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check for existing email
    const existingUser = await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.email, email))
      .execute();

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Get request metadata
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    // Create new waitlist entry
    const newEntry = await db
      .insert(waitlist)
      .values({
        id: nanoid(), // Generate unique ID
        email,
        consent,
        referralSource: referralSource || null,
        status: 'pending',
        timestamp: new Date()
      })
      .returning();

    // Log signup for analytics (implement your logging solution)
    console.log('New waitlist signup:', {
      email,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { 
        message: 'Successfully joined waitlist',
        id: newEntry[0].id
      },
      { 
        status: 201,
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    );

  } catch (error) {
    console.error('Waitlist signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const validation = await validateRequest(request);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email || !validateEmail(email)) {
      return NextResponse.json(
        { error: 'Valid email parameter is required' },
        { status: 400 }
      );
    }

    const record = await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.email, email))
      .execute();

    if (!record.length) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: record[0].status,
      joinedAt: record[0].timestamp
    });

  } catch (error) {
    console.error('Waitlist lookup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const validation = await validateRequest(request);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email || !validateEmail(email)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const record = await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.email, email))
      .execute();

    if (!record.length) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    await db
      .update(waitlist)
      .set({ status: 'unsubscribed' })
      .where(eq(waitlist.email, email))
      .execute();

    return NextResponse.json({
      message: 'Successfully unsubscribed'
    });

  } catch (error) {
    console.error('Waitlist unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}