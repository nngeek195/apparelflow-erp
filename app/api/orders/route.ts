import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/authHelper';
import { OrderStatus, ItemStatus, Role } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as OrderStatus | null;
    const search = searchParams.get('search');

    const where: any = {};
    if (status && Object.values(OrderStatus).includes(status)) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { orderNo: { contains: search, mode: 'insensitive' } },
        { fabricRollId: { contains: search, mode: 'insensitive' } },
        { recipe: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const orders = await prisma.cuttingOrder.findMany({
      where,
      include: {
        recipe: {
          include: { components: true },
        },
        creator: true,
        items: {
          include: { component: true },
        },
        verificationLog: {
          include: { verifier: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check: Only cutting_supervisor can create cutting orders
    if (user.role !== Role.cutting_supervisor) {
      return NextResponse.json(
        { error: `Forbidden: Only cutting supervisors can create orders. Current role: ${user.role}` },
        { status: 403 }
      );
    }

    const { orderNo, recipeId, targetQty, fabricRollId, actualFabricYds, status } = await req.json();

    if (!orderNo || !recipeId || !targetQty || !fabricRollId || actualFabricYds === undefined) {
      return NextResponse.json({ error: 'Missing required order fields' }, { status: 400 });
    }

    // Fetch recipe and its components to calculate expected quantities
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: { components: true },
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    const qty = parseInt(targetQty, 10);
    const fabricYds = parseFloat(actualFabricYds);
    const initialStatus = status || OrderStatus.PENDING_VERIFICATION;

    // Create cutting order and auto-generate verification items for all recipe components
    const order = await prisma.cuttingOrder.create({
      data: {
        orderNo,
        recipeId,
        targetQty: qty,
        fabricRollId,
        actualFabricYds: fabricYds,
        status: initialStatus,
        createdBy: user.id,
        items: {
          create: recipe.components.map((comp) => {
            const expected = comp.piecesPerGarment * qty;
            return {
              componentId: comp.id,
              expectedQty: expected,
              actualQty: expected, // initial count matches expected
              status: ItemStatus.GREEN,
            };
          }),
        },
      },
      include: {
        recipe: true,
        items: {
          include: { component: true },
        },
        creator: true,
      },
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating cutting order:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}