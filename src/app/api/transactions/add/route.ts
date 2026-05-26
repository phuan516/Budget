import { NextRequest, NextResponse } from 'next/server';
import { buildSheetsService } from '@/lib/api/auth';

export async function POST(req: NextRequest) {
  try {
    const auth = await buildSheetsService();
    if ('error' in auth) return auth.error;
    const { service } = auth;

    const { sheetId, date, amount, category, card, note } = await req.json();
    if (!sheetId || !date || amount == null) {
      return NextResponse.json({ error: 'sheetId, date, and amount are required' }, { status: 400 });
    }

    await service.addTransaction(sheetId, date, amount, category ?? '', card ?? '', note ?? '');
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Transaction add error:', error);
    return NextResponse.json({ error: 'Failed to add transaction' }, { status: 500 });
  }
}
