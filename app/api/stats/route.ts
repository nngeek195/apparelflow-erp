import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

export async function GET() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      pendingVerification,
      inProgress,
      verified,
      rejected,
      totalRecipes,
      todayOrders,
      verificationLogs,
      allOrders,
    ] = await Promise.all([
      prisma.cuttingOrder.count(),
      prisma.cuttingOrder.count({ where: { status: OrderStatus.PENDING_VERIFICATION } }),
      prisma.cuttingOrder.count({ where: { status: OrderStatus.CUTTING_IN_PROGRESS } }),
      prisma.cuttingOrder.count({ where: { status: OrderStatus.VERIFIED } }),
      prisma.cuttingOrder.count({ where: { status: OrderStatus.REJECTED } }),
      prisma.recipe.count(),
      prisma.cuttingOrder.findMany({
        where: {
          createdAt: { gte: todayStart },
        },
        select: {
          id: true,
          actualFabricYds: true,
          targetQty: true,
          status: true,
        },
      }),
      prisma.verificationLog.findMany({
        select: { wastagePct: true },
      }),
      prisma.cuttingOrder.findMany({
        select: { actualFabricYds: true, targetQty: true, status: true },
      }),
    ]);

    const avgWastage =
      verificationLogs.length > 0
        ? verificationLogs.reduce((acc, cur) => acc + cur.wastagePct, 0) / verificationLogs.length
        : 0;

    const totalYards = allOrders.reduce((acc, cur) => acc + cur.actualFabricYds, 0);
    const totalGarments = allOrders.reduce((acc, cur) => acc + cur.targetQty, 0);

    const todayBatchesCount = todayOrders.length;
    const todayYards = todayOrders.reduce((acc, cur) => acc + cur.actualFabricYds, 0);
    const todayGarments = todayOrders.reduce((acc, cur) => acc + cur.targetQty, 0);

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
        todayBatchesCount,
        todayYards: parseFloat(todayYards.toFixed(1)),
        todayGarments,
      },
    });
  } catch (error: any) {
    console.error('Stats GET failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
