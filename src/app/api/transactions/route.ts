import { NextRequest, NextResponse } from 'next/server';
import { SheetsService } from '@/lib/google/sheets';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sheetId = req.nextUrl.searchParams.get('sheetId');
    if (!sheetId) return NextResponse.json({ error: 'sheetId is required' }, { status: 400 });

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const service = new SheetsService(oauth2Client);

    const config = await service.readConfig(sheetId);
    await service.ensurePastMonthTabs(sheetId, config.monthlyIncome, config.fixedExpenses);
    const result = await service.readTransactions(sheetId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Transactions GET error:', error);
    return NextResponse.json({ error: 'Failed to load transactions' }, { status: 500 });
  }
}
