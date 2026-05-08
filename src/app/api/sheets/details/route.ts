import { NextRequest, NextResponse } from 'next/server';
import { buildSheetsService } from '@/lib/api/auth';

export async function GET(req: NextRequest) {
  const auth = buildSheetsService(req);
  if ('error' in auth) return auth.error;
  const { service: sheetsService } = auth;

  const sheetId = req.nextUrl.searchParams.get('sheetId');
  if (!sheetId) return NextResponse.json({ error: 'sheetId is required' }, { status: 400 });

  try {
    const details = await sheetsService.getSheetDetails(sheetId);
    return NextResponse.json(details);
  } catch (error) {
    console.error('Error fetching sheet details:', error);
    return NextResponse.json({ error: 'Failed to fetch sheet details' }, { status: 500 });
  }
}
