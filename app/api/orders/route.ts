import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    // 1. Enforce Server-Side RBAC
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawRole = user.user_metadata?.role;
    const role = (rawRole || '').toUpperCase();
    if (role !== 'ADMIN' && role !== 'CUTTING_SUPERVISOR') {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    // 2. Parse and Validate Payload
    const body = await request.json();
    const { recipeId, targetQty, fabricRollId, actualFabricYds } = body;

    if (!recipeId || targetQty <= 0 || !fabricRollId || actualFabricYds <= 0) {
      return NextResponse.json({ error: 'Invalid input parameters' }, { status: 400 });
    }

    // 3. Fetch the Recipe & Components
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: { components: true },
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // 4. Generate Order Number
    const orderCount = await prisma.cuttingOrder.count();
    const orderNo = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, '0')}`;

    // 5. Execute Transaction: Create Order & Apply Multiplier Engine
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.cuttingOrder.create({
        data: {
          orderNo,
          recipeId,
          targetQty: Number(targetQty),
          fabricRollId,
          actualFabricYds: Number(actualFabricYds),
          status: 'CUTTING_IN_PROGRESS',
          creatorId: user.id,
          creatorEmail: user.email,
          creatorName: user.user_metadata?.fullName || 'Unknown',
        },
      });

      // Multiplier Engine: Target Qty * Pieces Per Garment
      const verificationItems = recipe.components.map((comp) => ({
        orderId: newOrder.id,
        componentId: comp.id,
        expectedQty: comp.piecesPerGarment * Number(targetQty),
        actualQty: 0,           // ADD THIS
        status: 'GREEN' as any, // ADD THIS
      }));

      await tx.verificationItem.createMany({
        data: verificationItems,
      });

      return newOrder;
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error: any) {
    console.error('Order creation failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const orders = await prisma.cuttingOrder.findMany({
      include: {
        recipe: {
          include: { components: true }
        },
        items: {
          include: { component: true }
        },
        verificationLog: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}