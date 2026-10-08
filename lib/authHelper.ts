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

export async function getCurrentUser(): Promise<AuthUser | null> {
  const reqHeaders = await headers();
  const reqCookies = await cookies();

  // 1. Check for Demo Role Switcher header or cookie first (for Audit Evaluation)
  const demoRoleHeader = reqHeaders.get('x-demo-role') as Role | null;
  const demoRoleCookie = reqCookies.get('apparelflow_role')?.value as Role | null;
  const activeRole = demoRoleHeader || demoRoleCookie;

  // 2. Check for Firebase Bearer Token
  const authHeader = reqHeaders.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      if (decoded.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: decoded.email },
        });

        if (dbUser) {
          // If demo role override is explicitly requested in session, respect it for evaluation
          return {
            id: dbUser.id,
            email: dbUser.email,
            fullName: dbUser.fullName,
            role: (activeRole && Object.values(Role).includes(activeRole)) ? activeRole : dbUser.role,
            isDemo: false,
          };
        }
      }
    } catch (err) {
      console.warn('Firebase token verification error:', err);
    }
  }

  // 3. Fallback to Demo User according to activeRole (default to cutting_supervisor)
  const targetRole = (activeRole && Object.values(Role).includes(activeRole))
    ? activeRole
    : Role.cutting_supervisor;

  const emailMap: Record<Role, string> = {
    [Role.cutting_supervisor]: 'supervisor@apparelflow.com',
    [Role.cutting_verifier]: 'verifier@apparelflow.com',
    [Role.sewing_supervisor]: 'sewing@apparelflow.com',
  };

  const demoUser = await prisma.user.findUnique({
    where: { email: emailMap[targetRole] },
  });

  if (demoUser) {
    return {
      id: demoUser.id,
      email: demoUser.email,
      fullName: demoUser.fullName,
      role: demoUser.role,
      isDemo: true,
    };
  }

  return null;
}
