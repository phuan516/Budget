import { NextRequest, NextResponse } from 'next/server';
import { buildSheetsService } from '@/lib/api/auth';
import { monthKeyToLabel } from '@/lib/google/sheets';

export async function POST(req: NextRequest) {
  try {
    const auth = await buildSheetsService();
    if ('error' in auth) return auth.error;
    const { service } = auth;

    const { sheetId, monthKey, income, note } = await req.json();
    if (!sheetId) return NextResponse.json({ error: 'sheetId is required' }, { status: 400 });

    const label = monthKeyToLabel(monthKey);
    const current = await service.readConfig(sheetId);
    await service.ensureMonthTabExists(sheetId, label, current.fixedExpenses, current.monthlyIncome);
    await service.clearMonthTabIncomeEntries(sheetId, label);
    await service.setMonthTabIncome(sheetId, label, income, note ?? undefined);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Income override POST error:', error);
    return NextResponse.json({ error: 'Failed to set income override' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await buildSheetsService();
    if ('error' in auth) return auth.error;
    const { service } = auth;

    const { sheetId, monthKey } = await req.json();
    if (!sheetId) return NextResponse.json({ error: 'sheetId is required' }, { status: 400 });

    const label = monthKeyToLabel(monthKey);
    const current = await service.readConfig(sheetId);
    await service.setMonthTabIncome(sheetId, label, current.monthlyIncome);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Income override DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete income override' }, { status: 500 });
  }
}
