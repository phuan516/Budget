import { NextRequest, NextResponse } from 'next/server';
import { SheetsService } from '@/lib/google/sheets';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const sheetsService = new SheetsService(oauth2Client);

    try {
      const sheets = await sheetsService.listSheets();
      return NextResponse.json(sheets);
    } catch (error) {
      console.error('Google API error:', error);
      return NextResponse.json(
        { error: 'Failed to load sheets' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error listing sheets:', error);
    return NextResponse.json(
      { error: 'Failed to load sheets' },
      { status: 500 }
    );
  }
}
