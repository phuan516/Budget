import { NextRequest, NextResponse } from 'next/server';
import { SheetsService, currentMonthLabel, monthKeyToLabel } from '@/lib/google/sheets';
import { google } from 'googleapis';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { sheetId, action, type, name, value, extra, rowIndex, income, monthKey, expenseName, note } = body;

    if (!sheetId) return NextResponse.json({ error: 'sheetId is required' }, { status: 400 });

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const service = new SheetsService(oauth2Client);

    const thisMonth = currentMonthLabel();
    if (action === 'add') {
      await service.addConfigItem(sheetId, type, name, value ?? '', extra ?? '');
      if (type === 'fixed_expense') {
        const updated = await service.readConfig(sheetId);
        // Sync only to current month onward — past month tabs keep their own fixed expenses
        await service.syncFixedExpensesToAllMonthSheets(sheetId, updated.fixedExpenses, thisMonth);
      }
    } else if (action === 'delete') {
      await service.deleteConfigItem(sheetId, rowIndex);
      if (type === 'fixed_expense') {
        const updated = await service.readConfig(sheetId);
        await service.syncFixedExpensesToAllMonthSheets(sheetId, updated.fixedExpenses, thisMonth);
      }
    } else if (action === 'update') {
      await service.updateConfigItem(sheetId, rowIndex, type, name, value ?? '', extra ?? '');
      if (type === 'fixed_expense') {
        const updated = await service.readConfig(sheetId);
        await service.syncFixedExpensesToAllMonthSheets(sheetId, updated.fixedExpenses, thisMonth);
      }
    } else if (action === 'setIncome') {
      const current = await service.readConfig(sheetId);
      if (current.incomeRowIndex) {
        await service.updateConfigItem(sheetId, current.incomeRowIndex, 'income', 'monthly_income', String(income));
      } else {
        await service.addConfigItem(sheetId, 'income', 'monthly_income', String(income));
      }
      // Keep the current month tab in sync — create it if needed, then update its income
      await service.ensureMonthTabExists(sheetId, thisMonth, current.fixedExpenses, income);
      await service.setMonthTabIncome(sheetId, thisMonth, income);
    } else if (action === 'setMonthlyIncomeOverride') {
      const label = monthKeyToLabel(monthKey);
      const current = await service.readConfig(sheetId);
      await service.ensureMonthTabExists(sheetId, label, current.fixedExpenses, current.monthlyIncome);
      await service.setMonthTabIncome(sheetId, label, income, note ?? undefined);
      await service.setMonthlyIncomeOverride(sheetId, monthKey, income, note ?? undefined);
    } else if (action === 'deleteMonthlyIncomeOverride') {
      const label = monthKeyToLabel(monthKey);
      const current = await service.readConfig(sheetId);
      await service.setMonthTabIncome(sheetId, label, current.monthlyIncome);
      await service.deleteMonthlyIncomeOverride(sheetId, monthKey);
    } else if (action === 'setFixedExpenseOverride') {
      const label = monthKeyToLabel(monthKey);
      const current = await service.readConfig(sheetId);
      await service.ensureMonthTabExists(sheetId, label, current.fixedExpenses, current.monthlyIncome);
      await service.setMonthTabFixedExpenseAmount(sheetId, label, expenseName, income, note ?? undefined);
    } else if (action === 'deleteFixedExpenseOverride') {
      const label = monthKeyToLabel(monthKey);
      const current = await service.readConfig(sheetId);
      const defaultAmount = current.fixedExpenses.find(fe => fe.name === expenseName)?.amount ?? 0;
      await service.setMonthTabFixedExpenseAmount(sheetId, label, expenseName, defaultAmount);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Config update error:', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
