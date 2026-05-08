import { NextRequest, NextResponse } from 'next/server';
import { buildSheetsService } from '@/lib/api/auth';

export async function POST(req: NextRequest) {
  try {
    const auth = buildSheetsService(req);
    if ('error' in auth) return auth.error;
    const { service } = auth;

    const { sheetId, transactionId } = await req.json();
    if (!sheetId || !transactionId) {
      return NextResponse.json({ error: 'sheetId and transactionId are required' }, { status: 400 });
    }

    const separatorIdx = transactionId.lastIndexOf('|');
    if (separatorIdx === -1) {
      return NextResponse.json({ error: 'Invalid transactionId format' }, { status: 400 });
    }
    const tabName = transactionId.slice(0, separatorIdx);
    const rowIndex = parseInt(transactionId.slice(separatorIdx + 1));

    if (!tabName || isNaN(rowIndex)) {
      return NextResponse.json({ error: 'Invalid transactionId format' }, { status: 400 });
    }

    await service.deleteTransaction(sheetId, tabName, rowIndex);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Transaction delete error:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
