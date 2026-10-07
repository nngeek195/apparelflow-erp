import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();

    // 1. Verify the Google Auth ID Token on the server
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { email, name, uid } = decodedToken;

    if (!email) {
      return NextResponse.json({ error: 'Email missing from Google Auth token' }, { status: 400 });
    }

    // 2. Set Custom User Claims in Firebase for fast role checks
    await adminAuth.setCustomUserClaims(uid, { role: 'cutting_supervisor' });

    // 3. Upsert user into PostgreSQL database
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        fullName: name || 'Admin User',
      },
      create: {
        email,
        fullName: name || 'Admin User',
        role: 'cutting_supervisor', // Assign initial role
      },
    });

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error: any) {
    console.error('Server auth error:', error);
    return NextResponse.json({ error: 'Authentication failed', details: error.message }, { status: 500 });
  }
}