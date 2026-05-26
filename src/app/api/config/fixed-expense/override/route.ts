import { NextRequest, NextResponse } from 'next/server';
import { buildSheetsService } from '@/lib/api/auth';
import { monthKeyToLabel } from '@/lib/google/sheets';

export async function POST(req: NextRequest) {
  try {
    const auth = await buildSheetsService();
    if ('error' in auth) return auth.error;
    const { service } = auth;

    const { sheetId, monthKey, expenseName, income, note } = await req.json();
    if (!sheetId) return NextResponse.json({ error: 'sheetId is required' }, { status: 400 });

    const label = monthKeyToLabel(monthKey);
    const current = await service.readConfig(sheetId);
    await service.ensureMonthTabExists(sheetId, label, current.fixedExpenses, current.monthlyIncome);
    await service.setMonthTabFixedExpenseAmount(sheetId, label, expenseName, income, note ?? undefined);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Fixed expense override POST error:', error);
    return NextResponse.json({ error: 'Failed to set fixed expense override' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await buildSheetsService();
    if ('error' in auth) return auth.error;
    const { service } = auth;

    const { sheetId, monthKey, expenseName } = await req.json();
    if (!sheetId) return NextResponse.json({ error: 'sheetId is required' }, { status: 400 });

    const label = monthKeyToLabel(monthKey);
    const current = await service.readConfig(sheetId);
    const defaultAmount = current.fixedExpenses.find(fe => fe.name === expenseName)?.amount ?? 0;
    await service.setMonthTabFixedExpenseAmount(sheetId, label, expenseName, defaultAmount);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Fixed expense override DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete fixed expense override' }, { status: 500 });
  }
}
