import { NextRequest, NextResponse } from 'next/server';
import { buildSheetsService } from '@/lib/api/auth';

export async function POST(req: NextRequest) {
  try {
    const auth = await buildSheetsService();
    if ('error' in auth) return auth.error;
    const { service: sheetsService } = auth;

    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Sheet name is required' },
        { status: 400 }
      );
    }

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
