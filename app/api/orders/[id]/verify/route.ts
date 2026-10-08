import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Enforce Server-Side RBAC
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = user.user_metadata?.role;
    if (role !== 'ADMIN' && role !== 'CUTTING_VERIFIER') {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const orderId = params.id;
    const body = await request.json();
    const { decision, rejectionNote, items } = body; // items: Array<{ id: string, actualQty: number }>

    if (!decision || (decision === 'REJECTED' && !rejectionNote)) {
      return NextResponse.json({ error: 'Invalid payload: Rejection note is mandatory.' }, { status: 400 });
    }

    // 2. Fetch Order Data for Validation
    const order = await prisma.cuttingOrder.findUnique({
      where: { id: orderId },
      include: { recipe: true, items: true },
    });

    if (!order || order.status !== 'PENDING_VERIFICATION') {
      return NextResponse.json({ error: 'Order not found or not in pending state.' }, { status: 404 });
    }

    // 3. Evaluate Status Flags & Enforce Hard Stop
    let hasShortage = false;
    const processedItems = order.items.map((dbItem) => {
      const submittedItem = items.find((i: any) => i.id === dbItem.id);
      const actualQty = submittedItem ? Number(submittedItem.actualQty) : 0;
      
      let status: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
      if (actualQty < dbItem.expectedQty) {
        status = 'RED';
        hasShortage = true;
      } else if (actualQty > dbItem.expectedQty) {
        status = 'YELLOW';
      }

      return { id: dbItem.id, actualQty, status };
    });

    // SERVER-SIDE HARD STOP
    if (decision === 'APPROVED' && hasShortage) {
      return NextResponse.json({ 
        error: 'HARD STOP: Cannot approve an order with RED (shortage) components.' 
      }, { status: 422 });
    }

    // 4. Calculate Wastage
    const expectedFabric = order.targetQty * order.recipe.stdFabricYards;
    const wastagePct = ((order.actualFabricYds - expectedFabric) / expectedFabric) * 100;

    // 5. Execute Transaction: Update Order & Log Audit Trail
    await prisma.$transaction(async (tx) => {
      // Update individual component counts and statuses
      for (const item of processedItems) {
        await tx.verificationItem.update({
          where: { id: item.id },
          data: { actualQty: item.actualQty, status: item.status },
        });
      }

      // Update parent order status
      const newStatus = decision === 'APPROVED' ? 'VERIFIED' : 'REJECTED';
      await tx.cuttingOrder.update({
        where: { id: orderId },
        data: { status: newStatus },
      });

      // Create Immutable Audit Log
      await tx.verificationLog.create({
        data: {
          orderId,
          verifierId: user.id,
          verifierName: user.user_metadata?.fullName || 'Unknown',
          decision,
          rejectionNote: decision === 'REJECTED' ? rejectionNote : null,
          wastagePct: Number(wastagePct.toFixed(2)),
        },
      });
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Verification failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}