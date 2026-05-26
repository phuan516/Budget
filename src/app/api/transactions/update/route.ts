import { NextRequest, NextResponse } from 'next/server';
import { buildSheetsService } from '@/lib/api/auth';

export async function POST(req: NextRequest) {
  try {
    const auth = await buildSheetsService();
    if ('error' in auth) return auth.error;
    const { service } = auth;

    const { sheetId, tab, row, date, amount, category, card, note } = await req.json();
    if (!sheetId || !tab || typeof row !== 'number' || !date || amount == null) {
      return NextResponse.json({ error: 'sheetId, tab, row, date, and amount are required' }, { status: 400 });
    }

    await service.updateTransaction(sheetId, tab, row, date, amount, category ?? '', card ?? '', note ?? '');
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Transaction update error:', error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}
