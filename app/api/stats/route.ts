import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

export async function GET() {
  try {
    const [totalOrders, pendingVerification, inProgress, verified, rejected, totalRecipes] =
      await Promise.all([
        prisma.cuttingOrder.count(),
        prisma.cuttingOrder.count({ where: { status: OrderStatus.PENDING_VERIFICATION } }),
        prisma.cuttingOrder.count({ where: { status: OrderStatus.CUTTING_IN_PROGRESS } }),
        prisma.cuttingOrder.count({ where: { status: OrderStatus.VERIFIED } }),
        prisma.cuttingOrder.count({ where: { status: OrderStatus.REJECTED } }),
        prisma.recipe.count(),
      ]);

    // Calculate average wastage from verification logs
    const verificationLogs = await prisma.verificationLog.findMany({
      select: { wastagePct: true },
    });

    const avgWastage =
      verificationLogs.length > 0
        ? verificationLogs.reduce((acc, cur) => acc + cur.wastagePct, 0) / verificationLogs.length
        : 0;

    // Total yards processed
    const ordersWithYards = await prisma.cuttingOrder.findMany({
      select: { actualFabricYds: true, targetQty: true },
    });

    const totalYards = ordersWithYards.reduce((acc, cur) => acc + cur.actualFabricYds, 0);
    const totalGarments = ordersWithYards.reduce((acc, cur) => acc + cur.targetQty, 0);

    const rejectionRate = totalOrders > 0 ? (rejected / totalOrders) * 100 : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalOrders,
        pendingVerification,
        inProgress,
        verified,
        rejected,
        totalRecipes,
        avgWastage: parseFloat(avgWastage.toFixed(2)),
        totalYards: parseFloat(totalYards.toFixed(1)),
        totalGarments,
        rejectionRate: parseFloat(rejectionRate.toFixed(1)),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
