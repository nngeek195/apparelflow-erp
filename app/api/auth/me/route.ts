import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/authHelper';
import { Role } from '@prisma/client';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    user,
    availableRoles: [
      {
        role: Role.cutting_supervisor,
        title: 'Cutting Supervisor',
        description: 'Creates orders, tracks batch cutting & yardage allocation',
        avatar: '✂️',
      },
      {
        role: Role.cutting_verifier,
        title: 'Cutting Verifier',
        description: 'Performs piece audits, logs wastage %, issues approvals/rejections',
        avatar: '🔍',
      },
      {
        role: Role.sewing_supervisor,
        title: 'Sewing Supervisor',
        description: 'Receives verified orders into the assembly line',
        avatar: '🧵',
      },
    ],
  });
}
