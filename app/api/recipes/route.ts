import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const recipes = await prisma.recipe.findMany({
      include: {
        components: true,
      },
      orderBy: { recipeCode: 'asc' },
    });

    return NextResponse.json({ success: true, recipes });
  } catch (error: any) {
    console.error('Recipes GET failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const { name, category, stdFabricYards, wastageCap, components } = body;

    if (!name || stdFabricYards === undefined || wastageCap === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, standard fabric yards, or wastage cap.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(components) || components.length === 0) {
      return NextResponse.json(
        { error: 'At least one garment component is required for the recipe.' },
        { status: 400 }
      );
    }

    // Auto-generate recipeCode if not provided
    let recipeCode = body.recipeCode?.trim();
    if (!recipeCode) {
      const count = await prisma.recipe.count();
      recipeCode = `REC-${String(count + 1).padStart(3, '0')}`;
    }

    // Check unique code
    const existing = await prisma.recipe.findUnique({
      where: { recipeCode },
    });
    if (existing) {
      recipeCode = `${recipeCode}-${Date.now().toString().slice(-4)}`;
    }

    const recipe = await prisma.recipe.create({
      data: {
        recipeCode,
        name: name.trim(),
        category: category?.trim() || 'General Apparel',
        stdFabricYards: Number(stdFabricYards),
        wastageCap: Number(wastageCap),
        components: {
          create: components.map((c: any) => ({
            componentName: c.componentName.trim(),
            piecesPerGarment: Math.max(1, Number(c.piecesPerGarment) || 1),
          })),
        },
      },
      include: {
        components: true,
      },
    });

    return NextResponse.json({ success: true, recipe }, { status: 201 });
  } catch (error: any) {
    console.error('Recipe creation failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to create recipe' }, { status: 500 });
  }
}
