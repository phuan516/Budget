import { NextRequest, NextResponse } from 'next/server';
import { buildSheetsService } from '@/lib/api/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await buildSheetsService();
    if ('error' in auth) return auth.error;
    const { service } = auth;

    const sheetId = req.nextUrl.searchParams.get('sheetId');
    if (!sheetId) return NextResponse.json({ error: 'sheetId is required' }, { status: 400 });

    const config = await service.readConfig(sheetId);
    await service.ensurePastMonthTabs(sheetId, config.monthlyIncome, config.fixedExpenses);
    const result = await service.readTransactions(sheetId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Transactions GET error:', error);
    return NextResponse.json({ error: 'Failed to load transactions' }, { status: 500 });
  }
}
