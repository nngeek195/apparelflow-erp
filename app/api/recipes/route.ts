import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
