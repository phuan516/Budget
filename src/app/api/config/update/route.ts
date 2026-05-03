import { NextRequest, NextResponse } from 'next/server';
import { SheetsService, currentMonthLabel } from '@/lib/google/sheets';
import { google } from 'googleapis';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { sheetId, action, type, name, value, extra, rowIndex, income, monthKey, expenseName, pastMonths, note } = body;

    if (!sheetId) return NextResponse.json({ error: 'sheetId is required' }, { status: 400 });

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const service = new SheetsService(oauth2Client);

    const thisMonth = currentMonthLabel();
    if (action === 'add') {
      await service.addConfigItem(sheetId, type, name, value ?? '', extra ?? '');
      if (type === 'fixed_expense') {
        const updated = await service.readConfig(sheetId);
        await service.syncFixedExpensesToAllMonthSheets(sheetId, updated.fixedExpenses, thisMonth);
        // Protect past months: new expense shouldn't inflate historical budgets
        if (Array.isArray(pastMonths) && pastMonths.length > 0) {
          const toProtect = (pastMonths as string[])
            .filter(m => updated.fixedExpenseOverrides[m]?.[name] === undefined)
            .map(m => ({ monthKey: m, expenseName: name, amount: 0 }));
          await service.setManyFixedExpenseOverrides(sheetId, toProtect);
        }
      }
    } else if (action === 'delete') {
      await service.deleteConfigItem(sheetId, rowIndex);
      if (type === 'fixed_expense') {
        const updated = await service.readConfig(sheetId);
        await service.syncFixedExpensesToAllMonthSheets(sheetId, updated.fixedExpenses, thisMonth);
      }
    } else if (action === 'update') {
      if (type === 'fixed_expense' && Array.isArray(pastMonths) && pastMonths.length > 0) {
        const current = await service.readConfig(sheetId);
        const oldExpense = current.fixedExpenses.find(fe => parseInt(fe.id) === rowIndex);
        if (oldExpense) {
          const toProtect = (pastMonths as string[])
            .filter(m => current.fixedExpenseOverrides[m]?.[name] === undefined)
            .map(m => ({ monthKey: m, expenseName: name, amount: oldExpense.amount }));
          await service.setManyFixedExpenseOverrides(sheetId, toProtect);
        }
      }
      await service.updateConfigItem(sheetId, rowIndex, type, name, value ?? '', extra ?? '');
      if (type === 'fixed_expense') {
        const updated = await service.readConfig(sheetId);
        await service.syncFixedExpensesToAllMonthSheets(sheetId, updated.fixedExpenses, thisMonth);
      }
    } else if (action === 'setIncome') {
      const current = await service.readConfig(sheetId);
      // Protect past months: lock them to the current income before changing the default
      if (Array.isArray(pastMonths) && pastMonths.length > 0) {
        const toProtect = (pastMonths as string[])
          .filter(m => current.monthlyIncomeOverrides[m] === undefined)
          .map(m => ({ monthKey: m, amount: current.monthlyIncome }));
        await service.setManyMonthlyIncomeOverrides(sheetId, toProtect);
      }
      if (current.incomeRowIndex) {
        await service.updateConfigItem(sheetId, current.incomeRowIndex, 'income', 'monthly_income', String(income));
      } else {
        await service.addConfigItem(sheetId, 'income', 'monthly_income', String(income));
      }
    } else if (action === 'setMonthlyIncomeOverride') {
      await service.setMonthlyIncomeOverride(sheetId, monthKey, income, note ?? undefined);
    } else if (action === 'deleteMonthlyIncomeOverride') {
      await service.deleteMonthlyIncomeOverride(sheetId, monthKey);
    } else if (action === 'setFixedExpenseOverride') {
      await service.setFixedExpenseOverride(sheetId, monthKey, expenseName, income, note ?? undefined);
    } else if (action === 'deleteFixedExpenseOverride') {
      await service.deleteFixedExpenseOverride(sheetId, monthKey, expenseName);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Config update error:', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
