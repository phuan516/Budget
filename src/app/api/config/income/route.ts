import { NextRequest, NextResponse } from 'next/server';
import { buildSheetsService } from '@/lib/api/auth';
import { currentMonthLabel } from '@/lib/google/sheets';

export async function POST(req: NextRequest) {
  try {
    const auth = await buildSheetsService();
    if ('error' in auth) return auth.error;
    const { service } = auth;

    const { sheetId, income } = await req.json();
    if (!sheetId) return NextResponse.json({ error: 'sheetId is required' }, { status: 400 });

    const current = await service.readConfig(sheetId);
    if (current.incomeRowIndex) {
      await service.updateConfigItem(sheetId, current.incomeRowIndex, 'income', 'monthly_income', String(income));
    } else {
      await service.addConfigItem(sheetId, 'income', 'monthly_income', String(income));
    }
    const thisMonth = currentMonthLabel();
    await service.ensureMonthTabExists(sheetId, thisMonth, current.fixedExpenses, income);
    await service.setMonthTabIncome(sheetId, thisMonth, income);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Config income POST error:', error);
    return NextResponse.json({ error: 'Failed to set income' }, { status: 500 });
  }
}
