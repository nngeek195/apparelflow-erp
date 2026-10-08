import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { OrderStatus } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await prisma.cuttingOrder.findUnique({
      where: { id },
      include: {
        recipe: { include: { components: true } },
        items: { include: { component: true } },
        verificationLog: true,
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const updateData: any = {};
    if (body.status) {
      updateData.status = body.status as OrderStatus;
    }
    if (body.actualFabricYds !== undefined) {
      updateData.actualFabricYds = Number(body.actualFabricYds);
    }
    if (body.fabricRollId) {
      updateData.fabricRollId = body.fabricRollId;
    }

    const updated = await prisma.cuttingOrder.update({
      where: { id },
      data: updateData,
      include: {
        recipe: { include: { components: true } },
        items: { include: { component: true } },
        verificationLog: true,
      },
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
