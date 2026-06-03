import { NextRequest, NextResponse } from 'next/server';
import { buildSheetsService } from '@/lib/api/auth';
import { currentMonthLabel } from '@/lib/google/sheets';

export async function POST(req: NextRequest) {
  try {
    const auth = await buildSheetsService();
    if ('error' in auth) return auth.error;
    const { service } = auth;

    const { sheetId, amount, note, tabName, date } = await req.json();
    if (!sheetId) return NextResponse.json({ error: 'sheetId is required' }, { status: 400 });

    const entryDate = date ?? new Date().toISOString().slice(0, 10);
    const config = await service.readConfig(sheetId);
    const thisMonth = tabName ?? currentMonthLabel();
    await service.ensureMonthTabExists(sheetId, thisMonth, config.fixedExpenses, config.monthlyIncome);
    await service.addMonthTabIncomeEntry(sheetId, thisMonth, entryDate, amount, note ?? undefined);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Income entries POST error:', error);
    return NextResponse.json({ error: 'Failed to add income entry' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await buildSheetsService();
    if ('error' in auth) return auth.error;
    const { service } = auth;

    const { sheetId, tabName, rowIndex, amount, note } = await req.json();
    if (!sheetId) return NextResponse.json({ error: 'sheetId is required' }, { status: 400 });

    await service.updateMonthTabIncomeEntry(sheetId, tabName, rowIndex, amount, note ?? undefined);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Income entries PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update income entry' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await buildSheetsService();
    if ('error' in auth) return auth.error;
    const { service } = auth;

    const { sheetId, tabName, rowIndex } = await req.json();
    if (!sheetId) return NextResponse.json({ error: 'sheetId is required' }, { status: 400 });

    await service.deleteMonthTabIncomeEntry(sheetId, tabName, rowIndex);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Income entries DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete income entry' }, { status: 500 });
  }
}
