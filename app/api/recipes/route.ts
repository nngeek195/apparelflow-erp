import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/authHelper';
import { getNextRecipeCode } from '@/lib/sequenceHelper';

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

    const body = await req.json();
    const { name, category, stdFabricYards, wastageCap, components } = body;

    if (!name || stdFabricYards === undefined || wastageCap === undefined) {
      return NextResponse.json({ error: 'Missing required recipe fields (name, std fabric yards, or wastage cap)' }, { status: 400 });
    }

    let attempts = 0;
    let recipe: any = null;

    while (attempts < 5) {
      attempts++;
      let assignedRecipeCode = body.recipeCode?.trim();
      if (!assignedRecipeCode || attempts > 1) {
        assignedRecipeCode = await getNextRecipeCode();
      } else {
        const exists = await prisma.recipe.findUnique({ where: { recipeCode: assignedRecipeCode } });
        if (exists) {
          assignedRecipeCode = await getNextRecipeCode();
        }
      }

      try {
        recipe = await prisma.recipe.create({
          data: {
            recipeCode: assignedRecipeCode,
            name: name.trim(),
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
        break; // Successfully created without duplicate
      } catch (createErr: any) {
        if (createErr.code === 'P2002' && attempts < 5) {
          // Unique constraint hit: retry with next sequential ascending recipe code
          continue;
        }
        throw createErr;
      }
    }

    return NextResponse.json({ success: true, recipe }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
