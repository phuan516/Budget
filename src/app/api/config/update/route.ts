import { NextRequest, NextResponse } from 'next/server';
import { SheetsService } from '@/lib/google/sheets';
import { google } from 'googleapis';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { sheetId, action, type, name, value, extra, rowIndex, income } = body;

    if (!sheetId) return NextResponse.json({ error: 'sheetId is required' }, { status: 400 });

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const service = new SheetsService(oauth2Client);

    if (action === 'add') {
      await service.addConfigItem(sheetId, type, name, value ?? '', extra ?? '');
    } else if (action === 'delete') {
      await service.deleteConfigItem(sheetId, rowIndex);
    } else if (action === 'update') {
      await service.updateConfigItem(sheetId, rowIndex, type, name, value ?? '', extra ?? '');
    } else if (action === 'setIncome') {
      const current = await service.readConfig(sheetId);
      if (current.incomeRowIndex) {
        await service.updateConfigItem(sheetId, current.incomeRowIndex, 'income', 'monthly_income', String(income));
      } else {
        await service.addConfigItem(sheetId, 'income', 'monthly_income', String(income));
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Config update error:', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
