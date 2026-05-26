import { NextRequest, NextResponse } from 'next/server';
import { buildSheetsService } from '@/lib/api/auth';
import { currentMonthLabel } from '@/lib/google/sheets';

export async function POST(req: NextRequest) {
  try {
    const auth = await buildSheetsService();
    if ('error' in auth) return auth.error;
    const { service } = auth;

    const { sheetId, type, name, value, extra } = await req.json();
    if (!sheetId) return NextResponse.json({ error: 'sheetId is required' }, { status: 400 });

    await service.addConfigItem(sheetId, type, name, value ?? '', extra ?? '');
    if (type === 'fixed_expense') {
      const updated = await service.readConfig(sheetId);
      await service.syncFixedExpensesToAllMonthSheets(sheetId, updated.fixedExpenses, currentMonthLabel());
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Config items POST error:', error);
    return NextResponse.json({ error: 'Failed to add config item' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await buildSheetsService();
    if ('error' in auth) return auth.error;
    const { service } = auth;

    const { sheetId, type, rowIndex, name, value, extra } = await req.json();
    if (!sheetId) return NextResponse.json({ error: 'sheetId is required' }, { status: 400 });

    await service.updateConfigItem(sheetId, rowIndex, type, name, value ?? '', extra ?? '');
    if (type === 'fixed_expense') {
      const updated = await service.readConfig(sheetId);
      await service.syncFixedExpensesToAllMonthSheets(sheetId, updated.fixedExpenses, currentMonthLabel());
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Config items PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update config item' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await buildSheetsService();
    if ('error' in auth) return auth.error;
    const { service } = auth;

    const { sheetId, type, rowIndex } = await req.json();
    if (!sheetId) return NextResponse.json({ error: 'sheetId is required' }, { status: 400 });

    await service.deleteConfigItem(sheetId, rowIndex);
    if (type === 'fixed_expense') {
      const updated = await service.readConfig(sheetId);
      await service.syncFixedExpensesToAllMonthSheets(sheetId, updated.fixedExpenses, currentMonthLabel());
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Config items DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete config item' }, { status: 500 });
  }
}
