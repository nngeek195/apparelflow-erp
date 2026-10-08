import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const { role } = await req.json();

    if (!role || !Object.values(Role).includes(role)) {
      return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 });
    }

    const response = NextResponse.json({ success: true, activeRole: role });
    response.cookies.set('apparelflow_role', role, {
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
