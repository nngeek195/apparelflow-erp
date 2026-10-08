import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/authHelper';
import { sendVerificationEmail } from '@/lib/email';
import { OrderStatus, ItemStatus, Role } from '@prisma/client';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check: Only cutting_verifier can sign off on verification
    if (user.role !== Role.cutting_verifier) {
      return NextResponse.json(
        { error: `Forbidden: Only cutting verifiers can sign off on quality verification. Current role: ${user.role}` },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { items, decision, rejectionNote, actualFabricYds } = body;

    if (!decision || !['APPROVED', 'REJECTED'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision. Must be APPROVED or REJECTED' }, { status: 400 });
    }

    if (decision === 'REJECTED' && (!rejectionNote || rejectionNote.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Rejection remarks are mandatory when an order is REJECTED.' },
        { status: 400 }
      );
    }

    const order = await prisma.cuttingOrder.findUnique({
      where: { id },
      include: {
        recipe: { include: { components: true } },
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 1. Calculate actual wastage percentage
    const finalActualFabricYds = actualFabricYds !== undefined ? parseFloat(actualFabricYds) : order.actualFabricYds;
    const standardFabricYds = order.recipe.stdFabricYards * order.targetQty;
    const diffYds = finalActualFabricYds - standardFabricYds;
    const wastagePct = standardFabricYds > 0 ? (diffYds / standardFabricYds) * 100 : 0;

    // 2. Update Verification Items with actual counts & statuses
    if (items && Array.isArray(items)) {
      for (const item of items) {
        let status = item.status as ItemStatus;
        const actual = parseInt(item.actualQty, 10);
        const expected = parseInt(item.expectedQty, 10);

        if (!status) {
          if (actual === expected) {
            status = ItemStatus.GREEN;
          } else if (Math.abs(actual - expected) / expected <= 0.05) {
            status = ItemStatus.YELLOW;
          } else {
            status = ItemStatus.RED;
          }
        }

        await prisma.verificationItem.update({
          where: { id: item.id },
          data: {
            actualQty: actual,
            status,
          },
        });
      }
    }

    // 3. Upsert Verification Log
    const newStatus = decision === 'APPROVED' ? OrderStatus.VERIFIED : OrderStatus.REJECTED;

    const verificationLog = await prisma.verificationLog.upsert({
      where: { orderId: order.id },
      update: {
        verifierId: user.id,
        decision,
        rejectionNote: decision === 'REJECTED' ? rejectionNote : null,
        wastagePct: parseFloat(wastagePct.toFixed(2)),
        timestamp: new Date(),
      },
      create: {
        orderId: order.id,
        verifierId: user.id,
        decision,
        rejectionNote: decision === 'REJECTED' ? rejectionNote : null,
        wastagePct: parseFloat(wastagePct.toFixed(2)),
      },
      include: { verifier: true },
    });

    // 4. Update Cutting Order status and actual fabric yds
    const updatedOrder = await prisma.cuttingOrder.update({
      where: { id: order.id },
      data: {
        status: newStatus,
        actualFabricYds: finalActualFabricYds,
      },
      include: {
        recipe: true,
        items: { include: { component: true } },
        verificationLog: { include: { verifier: true } },
        creator: true,
      },
    });

    // 5. Send automated audit email via Resend in the background
    try {
      await sendVerificationEmail({
        orderNo: updatedOrder.orderNo,
        recipeName: updatedOrder.recipe.name,
        targetQty: updatedOrder.targetQty,
        decision: decision as 'APPROVED' | 'REJECTED',
        wastagePct,
        wastageCap: updatedOrder.recipe.wastageCap,
        verifierName: user.fullName,
        rejectionNote,
      });
    } catch (emailErr) {
      console.warn('Failed to send verification notification email:', emailErr);
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      verificationLog,
    });
  } catch (error: any) {
    console.error('Verification submission failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
