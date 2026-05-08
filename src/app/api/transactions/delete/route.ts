import { NextRequest, NextResponse } from 'next/server';
import { buildSheetsService } from '@/lib/api/auth';

export async function POST(req: NextRequest) {
  try {
    const auth = buildSheetsService(req);
    if ('error' in auth) return auth.error;
    const { service } = auth;

    const { sheetId, tab, row } = await req.json();
    if (!sheetId || !tab || typeof row !== 'number') {
      return NextResponse.json({ error: 'sheetId, tab, and row are required' }, { status: 400 });
    }

    await service.deleteTransaction(sheetId, tab, row);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Transaction delete error:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
