import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  
  response.cookies.set('apparelflow_jwt', '', {
    path: '/',
    httpOnly: true,
    maxAge: 0,
  });

  response.cookies.set('apparelflow_role', '', {
    path: '/',
    httpOnly: false,
    maxAge: 0,
  });

  return response;
}
