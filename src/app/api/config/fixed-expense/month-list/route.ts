import { NextRequest, NextResponse } from 'next/server';
import { buildSheetsService } from '@/lib/api/auth';
import { monthKeyToLabel } from '@/lib/google/sheets';

export async function POST(req: NextRequest) {
  try {
    const auth = buildSheetsService(req);
    if ('error' in auth) return auth.error;
    const { service } = auth;

    const { sheetId, monthKey, fixedExpenses } = await req.json();
    if (!sheetId) return NextResponse.json({ error: 'sheetId is required' }, { status: 400 });

    const label = monthKeyToLabel(monthKey);
    await service.setMonthTabAllFixedExpenses(sheetId, label, fixedExpenses);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Month fixed expenses POST error:', error);
    return NextResponse.json({ error: 'Failed to set month fixed expenses' }, { status: 500 });
  }
}
