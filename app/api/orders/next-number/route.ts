import { NextResponse } from 'next/server';
import { getNextOrderNo, getNextFabricRollId } from '@/lib/sequenceHelper';
import { getCurrentUser } from '@/lib/authHelper';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [nextOrderNo, nextFabricRollId] = await Promise.all([
      getNextOrderNo(),
      getNextFabricRollId(),
    ]);

    return NextResponse.json({
      success: true,
      nextOrderNo,
      nextFabricRollId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
