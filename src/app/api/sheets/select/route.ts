import { NextRequest, NextResponse } from 'next/server';
import { buildSheetsService } from '@/lib/api/auth';

export async function POST(req: NextRequest) {
  try {
    const auth = buildSheetsService(req);
    if ('error' in auth) return auth.error;
    const { service: sheetsService } = auth;

    const body = await req.json();
    const { sheetId } = body;

    if (!sheetId) {
      return NextResponse.json(
        { error: 'Sheet ID is required' },
        { status: 400 }
      );
    }

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
