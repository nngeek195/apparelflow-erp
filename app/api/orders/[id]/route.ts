import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/authHelper';
import { OrderStatus } from '@prisma/client';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = await prisma.cuttingOrder.findUnique({
      where: { id },
      include: {
        recipe: {
          include: { components: true },
        },
        creator: true,
        items: {
          include: { component: true },
          orderBy: { component: { componentName: 'asc' } },
        },
        verificationLog: {
          include: { verifier: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const order = await prisma.cuttingOrder.update({
      where: { id },
      data: {
        ...(body.status && { status: body.status as OrderStatus }),
        ...(body.actualFabricYds !== undefined && { actualFabricYds: parseFloat(body.actualFabricYds) }),
        ...(body.fabricRollId && { fabricRollId: body.fabricRollId }),
      },
      include: {
        recipe: true,
        items: { include: { component: true } },
        verificationLog: true,
      },
    });

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
