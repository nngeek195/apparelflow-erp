import { cookies, headers } from 'next/headers';
import { adminAuth } from '@/lib/firebaseAdmin';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isDemo: boolean;
}

/**
 * Validates the caller's identity strictly via Firebase JWT ID Token.
 * Accepts token from Authorization header ('Bearer <jwt>') OR 'apparelflow_jwt' cookie.
 * If no valid token is provided, returns null to lock down the application.
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

    // Role switcher evaluation header or cookie (if supervisor wants to evaluate verifier/sewing perspective)
    const demoRoleHeader = reqHeaders.get('x-demo-role') as Role | null;
    const demoRoleCookie = reqCookies.get('apparelflow_role')?.value as Role | null;
    const activeRole = demoRoleHeader || demoRoleCookie;

    return {
      id: dbUser.id,
      email: dbUser.email,
      fullName: dbUser.fullName,
      role: activeRole && Object.values(Role).includes(activeRole) ? activeRole : dbUser.role,
      isDemo: false,
    };
  } catch (err) {
    console.warn('Firebase JWT token verification failed:', err);
    return null;
  }
}
