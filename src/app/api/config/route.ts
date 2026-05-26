import { NextRequest, NextResponse } from 'next/server';
import { buildSheetsService } from '@/lib/api/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await buildSheetsService();
    if ('error' in auth) return auth.error;
    const { service } = auth;

    const sheetId = req.nextUrl.searchParams.get('sheetId');
    if (!sheetId) return NextResponse.json({ error: 'sheetId is required' }, { status: 400 });

    const { incomeRowIndex: _, ...config } = await service.readConfig(sheetId);
    return NextResponse.json(config);
  } catch (error) {
    console.error('Config GET error:', error);
    return NextResponse.json({ error: 'Failed to load config' }, { status: 500 });
  }
}
