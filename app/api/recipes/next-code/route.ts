import { NextResponse } from 'next/server';
import { getNextRecipeCode } from '@/lib/sequenceHelper';
import { getCurrentUser } from '@/lib/authHelper';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const nextRecipeCode = await getNextRecipeCode();

    return NextResponse.json({
      success: true,
      nextRecipeCode,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
