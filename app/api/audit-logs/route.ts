import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const logs = await prisma.verificationLog.findMany({
      include: {
        verifier: true,
        order: {
          include: {
            recipe: true,
            creator: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
