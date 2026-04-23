import { NextRequest, NextResponse } from 'next/server';
import { SheetsService } from '@/lib/google/sheets';
import { google } from 'googleapis';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const service = new SheetsService(oauth2Client);

    await service.deleteTransaction(sheetId, tabName, rowIndex);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Transaction delete error:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
