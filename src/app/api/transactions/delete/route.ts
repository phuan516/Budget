import { NextRequest, NextResponse } from 'next/server';
import { SheetsService } from '@/lib/google/sheets';
import { google } from 'googleapis';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { sheetId, rowIndex } = await req.json();
    if (!sheetId || !rowIndex) {
      return NextResponse.json({ error: 'sheetId and rowIndex are required' }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const service = new SheetsService(oauth2Client);

    await service.deleteTransaction(sheetId, rowIndex);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Transaction delete error:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
