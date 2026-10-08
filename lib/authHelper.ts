import { cookies, headers } from 'next/headers';
import { adminAuth } from '@/lib/firebaseAdmin';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

/**
 * Validates the caller's identity strictly via Firebase JWT ID Token.
 * Accepts token from Authorization header ('Bearer <jwt>') OR 'apparelflow_jwt' cookie.
 * If no valid token is provided, returns null.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const reqHeaders = await headers();
  const reqCookies = await cookies();

  // 1. Extract Firebase JWT from Authorization header or apparelflow_jwt cookie
  const authHeader = reqHeaders.get('authorization');
  let token: string | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split('Bearer ')[1].trim();
  } else {
    token = reqCookies.get('apparelflow_jwt')?.value || null;
  }

  // 2. Strict Lock: If no token exists, caller is completely unauthenticated
  if (!token) {
    return null;
  }

  try {
    // 3. Cryptographically verify the Firebase ID Token
    const decoded = await adminAuth.verifyIdToken(token);
    if (!decoded.email) {
      return null;
    }

    // 4. Retrieve or synchronize the user from Google Cloud SQL PostgreSQL
    let dbUser = await prisma.user.findUnique({
      where: { email: decoded.email },
    });

    if (!dbUser) {
      const assignedRole = (decoded.role as Role) || Role.cutting_supervisor;
      dbUser = await prisma.user.create({
        data: {
          email: decoded.email,
          fullName: decoded.name || decoded.email.split('@')[0],
          role: assignedRole,
        },
      });
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      fullName: dbUser.fullName,
      role: dbUser.role,
    };
  } catch (err) {
    console.warn('Firebase JWT token verification failed:', err);
    return null;
  }
}
