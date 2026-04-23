import { NextRequest, NextResponse } from 'next/server';
import { SheetsService } from '@/lib/google/sheets';
import { google } from 'googleapis';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { sheetId, date, amount, category, card, note } = await req.json();
    if (!sheetId || !date || amount == null) {
      return NextResponse.json({ error: 'sheetId, date, and amount are required' }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const service = new SheetsService(oauth2Client);

    await service.addTransaction(sheetId, date, amount, category ?? '', card ?? '', note ?? '');
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Transaction add error:', error);
    return NextResponse.json({ error: 'Failed to add transaction' }, { status: 500 });
  }
}
