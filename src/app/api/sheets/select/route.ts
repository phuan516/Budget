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
    const { sheetId } = body;

    if (!sheetId) {
      return NextResponse.json(
        { error: 'Sheet ID is required' },
        { status: 400 }
      );
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const sheetsService = new SheetsService(oauth2Client);

    try {
      const validation = await sheetsService.validateSheet(sheetId);

      if (!validation.valid) {
        return NextResponse.json({
          valid: false,
          error: validation.missing?.join(', '),
        });
      }

      const details = await sheetsService.getSheetDetails(sheetId);
      return NextResponse.json({
        valid: true,
        sheet: {
          id: sheetId,
          name: details.name,
          url: details.url,
        },
      });
    } catch (error) {
      console.error('Validation error:', error);
      return NextResponse.json(
        { valid: false, error: 'Unable to validate sheet structure' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error selecting sheet:', error);
    return NextResponse.json(
      { error: 'Failed to select sheet' },
      { status: 500 }
    );
  }
}
