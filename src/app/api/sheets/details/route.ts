import { NextRequest, NextResponse } from 'next/server';
import { SheetsService } from '@/lib/google/sheets';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
  const accessToken = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sheetId = req.nextUrl.searchParams.get('sheetId');
  if (!sheetId) return NextResponse.json({ error: 'sheetId is required' }, { status: 400 });

  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const sheetsService = new SheetsService(oauth2Client);
    const details = await sheetsService.getSheetDetails(sheetId);
    return NextResponse.json(details);
  } catch (error) {
    console.error('Error fetching sheet details:', error);
    return NextResponse.json({ error: 'Failed to fetch sheet details' }, { status: 500 });
  }
}
