import { NextRequest, NextResponse } from 'next/server';
import { buildSheetsService } from '@/lib/api/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = buildSheetsService(req);
    if ('error' in auth) return auth.error;
    const { service: sheetsService } = auth;

    try {
      const sheets = await sheetsService.listSheets();
      return NextResponse.json(sheets);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Google API error:', error);
      return NextResponse.json(
        { error: msg },
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
