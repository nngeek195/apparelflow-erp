import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const { idToken, requestedRole } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    // 1. Verify the Firebase Auth ID Token (JWT) on the server
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { email, name, uid } = decodedToken;

    if (!email) {
      return NextResponse.json({ error: 'Email missing from Firebase Auth token' }, { status: 400 });
    }

    // Check existing role in DB or use requested / default role
    const existingUser = await prisma.user.findUnique({ where: { email } });
    const assignedRole: Role =
      existingUser?.role ||
      (requestedRole && Object.values(Role).includes(requestedRole)
        ? requestedRole
        : Role.cutting_supervisor);

    // 2. Set Custom User Claims in Firebase
    try {
      await adminAuth.setCustomUserClaims(uid, { role: assignedRole });
    } catch (claimErr) {
      console.warn('Could not set custom user claims:', claimErr);
    }

    // 3. Upsert user into Google Cloud SQL PostgreSQL database
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        fullName: name || existingUser?.fullName || email.split('@')[0],
      },
      create: {
        email,
        fullName: name || email.split('@')[0],
        role: assignedRole,
      },
    });

    const response = NextResponse.json({ success: true, user, idToken }, { status: 200 });

    // Store verified JWT in secure HTTP-only cookie
    response.cookies.set('apparelflow_jwt', idToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set('apparelflow_role', user.role, {
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error('Server auth error:', error);
    return NextResponse.json({ error: 'Authentication failed', details: error.message }, { status: 500 });
  }
}