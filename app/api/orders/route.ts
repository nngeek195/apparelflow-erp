import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/authHelper';
import { getNextOrderNo, getNextFabricRollId } from '@/lib/sequenceHelper';
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

    const body = await req.json();
    const { recipeId, targetQty, actualFabricYds, status } = body;

    if (!recipeId || !targetQty || actualFabricYds === undefined) {
      return NextResponse.json({ error: 'Missing required order fields (recipe, quantity, or actual yards)' }, { status: 400 });
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

    // Auto-generate ascending unique numbers if missing or if collision occurs
    let attempts = 0;
    let order: any = null;

    while (attempts < 5) {
      attempts++;
      // Determine order number: if provided and not duplicate on attempt 1, use it; otherwise auto-generate next
      let assignedOrderNo = body.orderNo?.trim();
      if (!assignedOrderNo || attempts > 1) {
        assignedOrderNo = await getNextOrderNo();
      } else {
        // If provided, ensure it does not duplicate an existing order
        const exists = await prisma.cuttingOrder.findUnique({ where: { orderNo: assignedOrderNo } });
        if (exists) {
          assignedOrderNo = await getNextOrderNo();
        }
      }

      // Determine fabric roll ID
      let assignedFabricRollId = body.fabricRollId?.trim();
      if (!assignedFabricRollId) {
        assignedFabricRollId = await getNextFabricRollId();
      }

      try {
        order = await prisma.cuttingOrder.create({
          data: {
            orderNo: assignedOrderNo,
            recipeId,
            targetQty: qty,
            fabricRollId: assignedFabricRollId,
            actualFabricYds: fabricYds,
            status: initialStatus,
            createdBy: user.id,
            items: {
              create: recipe.components.map((comp) => {
                const expected = comp.piecesPerGarment * qty;
                return {
                  componentId: comp.id,
                  expectedQty: expected,
                  actualQty: expected,
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
        break; // Successfully created without duplicate
      } catch (createErr: any) {
        if (createErr.code === 'P2002' && attempts < 5) {
          // Unique constraint hit: retry with next sequential ascending order number
          continue;
        }
        throw createErr;
      }
    }

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating cutting order:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}