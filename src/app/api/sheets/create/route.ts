import { NextRequest, NextResponse } from 'next/server';
import { SheetsService } from '@/lib/google/sheets';
import { google } from 'googleapis';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Sheet name is required' },
        { status: 400 }
      );
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const sheetsService = new SheetsService(oauth2Client);

    try {
      const result = await sheetsService.createBudgetSheet(name);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Google API error:', error);
      return NextResponse.json(
        { error: 'Failed to create budget sheet' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating sheet:', error);
    return NextResponse.json(
      { error: 'Failed to create budget sheet' },
      { status: 500 }
    );
  }
}
