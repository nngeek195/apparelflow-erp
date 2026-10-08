import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    // 1. Enforce Server-Side RBAC
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = user.user_metadata?.role;
    if (role !== 'ADMIN' && role !== 'SEWING_SUPERVISOR') {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    // 2. Query Isolation: Strictly enforce WHERE status = 'VERIFIED'
    const verifiedOrders = await prisma.cuttingOrder.findMany({
      where: {
        status: 'VERIFIED',
      },
      include: {
        recipe: true,
        items: {
          include: { component: true },
        },
        verificationLog: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ orders: verifiedOrders }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch sewing queue:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}