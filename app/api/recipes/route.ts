import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/authHelper';

export async function GET() {
  try {
    const recipes = await prisma.recipe.findMany({
      include: {
        components: true,
        _count: {
          select: { cuttingOrders: true },
        },
      },
      orderBy: { recipeCode: 'asc' },
    });

    return NextResponse.json({ success: true, recipes });
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

    const { recipeCode, name, category, stdFabricYards, wastageCap, components } = await req.json();

    if (!recipeCode || !name || !stdFabricYards || !wastageCap) {
      return NextResponse.json({ error: 'Missing required recipe fields' }, { status: 400 });
    }

    const recipe = await prisma.recipe.create({
      data: {
        recipeCode,
        name,
        category: category || 'General',
        stdFabricYards: parseFloat(stdFabricYards),
        wastageCap: parseFloat(wastageCap),
        components: {
          create: (components || []).map((c: any) => ({
            componentName: c.componentName,
            piecesPerGarment: parseInt(c.piecesPerGarment, 10) || 1,
            imageUrl: c.imageUrl || null,
          })),
        },
      },
      include: {
        components: true,
      },
    });

    return NextResponse.json({ success: true, recipe }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
