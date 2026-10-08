import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: { components: true },
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, recipe });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { id } = await params;
    const body = await request.json();
    const { name, category, stdFabricYards, wastageCap, recipeCode, components } = body;

    const existing = await prisma.recipe.findUnique({
      where: { id },
      include: { components: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Execute update transaction
    const updatedRecipe = await prisma.$transaction(async (tx) => {
      // 1. Update recipe basic fields
      const updated = await tx.recipe.update({
        where: { id },
        data: {
          ...(name && { name: name.trim() }),
          ...(category && { category: category.trim() }),
          ...(stdFabricYards !== undefined && { stdFabricYards: Number(stdFabricYards) }),
          ...(wastageCap !== undefined && { wastageCap: Number(wastageCap) }),
          ...(recipeCode && { recipeCode: recipeCode.trim() }),
        },
      });

      // 2. If components provided, synchronize them
      if (Array.isArray(components) && components.length > 0) {
        // Delete existing components that are not linked to verification items
        // To be safe, we can delete and recreate components for this recipe
        try {
          await tx.recipeComponent.deleteMany({
            where: { recipeId: id },
          });

          await tx.recipeComponent.createMany({
            data: components.map((c: any) => ({
              recipeId: id,
              componentName: c.componentName.trim(),
              piecesPerGarment: Math.max(1, Number(c.piecesPerGarment) || 1),
            })),
          });
        } catch {
          // If foreign key constraint is hit (orders exist referencing components), update names/quantities
          for (const c of components) {
            if (c.id) {
              await tx.recipeComponent.update({
                where: { id: c.id },
                data: {
                  componentName: c.componentName.trim(),
                  piecesPerGarment: Math.max(1, Number(c.piecesPerGarment) || 1),
                },
              });
            } else {
              await tx.recipeComponent.create({
                data: {
                  recipeId: id,
                  componentName: c.componentName.trim(),
                  piecesPerGarment: Math.max(1, Number(c.piecesPerGarment) || 1),
                },
              });
            }
          }
        }
      }

      return tx.recipe.findUnique({
        where: { id },
        include: { components: true },
      });
    });

    return NextResponse.json({ success: true, recipe: updatedRecipe });
  } catch (error: any) {
    console.error('Recipe update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update recipe' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawRole = user.user_metadata?.role;
    const role = (rawRole || '').toUpperCase();
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin privilege required' }, { status: 403 });
    }

    const { id } = await params;

    // Check if recipe has orders
    const orderCount = await prisma.cuttingOrder.count({
      where: { recipeId: id },
    });

    if (orderCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete recipe: ${orderCount} existing cutting order(s) are bound to it.` },
        { status: 400 }
      );
    }

    await prisma.recipe.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
