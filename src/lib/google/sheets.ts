// Google Sheets API wrapper
import { google, sheets_v4, Auth} from 'googleapis';

export interface SheetMetadata {
  id: string;
  name: string;
  modifiedTime?: string;
  thumbnailLink?: string;
  ownedByMe?: boolean;
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_TAB_REGEX = /^[A-Z][a-z]{2} \d{4}$/;

// Config section labels (must match exactly what's written to the sheet)
const CONFIG_SECTIONS = ['INCOME', 'SAVING GOALS', 'CATEGORIES', 'CARDS', 'FIXED EXPENSES'] as const;
const CONFIG_SECTION_SET = new Set<string>(CONFIG_SECTIONS);

const TYPE_TO_SECTION: Record<string, string> = {
  income: 'INCOME',
  saving_goal: 'SAVING GOALS',
  category: 'CATEGORIES',
  card: 'CARDS',
  fixed_expense: 'FIXED EXPENSES',
};

// Returns 0-based index of the first row that is blank or starts a new section,
// starting the scan from `fromIdx`. This marks the exclusive end of a section's data.
function sectionDataEnd(rows: string[][], fromIdx: number): number {
  let i = fromIdx;
  while (i < rows.length) {
    const cell = (rows[i]?.[0] ?? '').toString().trim().toUpperCase();
    if (cell === '' || CONFIG_SECTION_SET.has(cell)) break;
    i++;
  }
  return i;
}

function quoteSheet(name: string): string {
  return `'${name.replace(/'/g, "''")}'`;
}

function getMonthLabel(dateStr: string): string {
  const parts = dateStr.split('-');
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export class SheetsService {
  private auth: Auth.OAuth2Client;
  private sheets: sheets_v4.Sheets;

  constructor(auth: Auth.OAuth2Client) {
    this.auth = auth;
    this.sheets = google.sheets({ version: 'v4', auth });
  }

  async listSheets(): Promise<SheetMetadata[]> {
    try {
      const drive = google.drive({ version: 'v3', auth: this.auth });
      const response = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed = false",
        fields: 'files(id, name, modifiedTime, thumbnailLink, ownedByMe)',
        orderBy: 'modifiedTime desc',
      });

      return response.data.files?.map(file => ({
        id: file.id!,
        name: file.name!,
        modifiedTime: file.modifiedTime ?? undefined,
        thumbnailLink: file.thumbnailLink ?? undefined,
        ownedByMe: file.ownedByMe ?? undefined,
      })) || [];
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Error listing sheets:', error);
      throw new Error(`Failed to load sheets: ${msg}`);
    }
  }

  async createBudgetSheet(name: string): Promise<{ id: string; url: string; name: string }> {
    try {
      const response = await this.sheets.spreadsheets.create({
        requestBody: {
          properties: { title: name },
          sheets: [
            { properties: { sheetId: 0, title: 'Config' } },
          ],
        },
      });

      const spreadsheetId = response.data.spreadsheetId!;
      const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

      const configLayout: (string | number)[][] = [
        ['INCOME'],
        ['Amount'],
        [],
        ['SAVING GOALS'],
        ['Name', 'Target', 'Initial'],
        [],
        ['CATEGORIES'],
        ['Name'],
        [],
        ['CARDS'],
        ['Name'],
        [],
        ['FIXED EXPENSES'],
        ['Name', 'Amount'],
      ];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Config!A1',
        valueInputOption: 'RAW',
        requestBody: { values: configLayout },
      });

      // Bold section labels and column headers
      const boldRowIdxs = [0, 1, 3, 4, 6, 7, 9, 10, 12, 13]; // 0-based
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: boldRowIdxs.map(rowIdx => ({
            repeatCell: {
              range: { sheetId: 0, startRowIndex: rowIdx, endRowIndex: rowIdx + 1 },
              cell: { userEnteredFormat: { textFormat: { bold: true } } },
              fields: 'userEnteredFormat.textFormat.bold',
            },
          })),
        },
      });

      return { id: spreadsheetId, url: spreadsheetUrl, name };
    } catch (error) {
      console.error('Error creating sheet:', error);
      throw new Error('Failed to create budget sheet');
    }
  }

  async validateSheet(sheetId: string): Promise<{ valid: boolean; missing?: string[] }> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: sheetId,
        fields: 'sheets.properties.title',
      });

      const sheetTitles = response.data.sheets?.map(s => s.properties?.title) || [];
      if (!sheetTitles.includes('Config')) {
        return { valid: false, missing: ['Config'] };
      }

      return { valid: true };
    } catch (error) {
      console.error('Error validating sheet:', error);
      return { valid: false, missing: ['Unable to read sheet'] };
    }
  }

  async getSheetDetails(sheetId: string): Promise<{ name: string; url: string }> {
    try {
      const drive = google.drive({ version: 'v3', auth: this.auth });
      const response = await drive.files.get({
        fileId: sheetId,
        fields: 'name',
      });

      const url = `https://docs.google.com/spreadsheets/d/${sheetId}`;
      return { name: response.data.name || 'Unknown', url };
    } catch (error) {
      console.error('Error getting sheet details:', error);
      throw new Error('Failed to get sheet details');
    }
  }

  async readConfig(sheetId: string): Promise<{
    categories: { id: string; name: string }[];
    cards: { id: string; name: string }[];
    fixedExpenses: { id: string; name: string; amount: number }[];
    monthlyIncome: number;
    incomeRowIndex: number | null;
    savingGoals: { id: string; name: string; amount: number; initialAmount: number }[];
  }> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Config!A:C',
      });

      const rows = (response.data.values || []) as string[][];

      // Locate each section label (0-based row index)
      const sectionIdx: Partial<Record<string, number>> = {};
      rows.forEach((row, i) => {
        const cell = (row[0] ?? '').toString().trim().toUpperCase();
        if (CONFIG_SECTION_SET.has(cell)) sectionIdx[cell] = i;
      });

      // Collect data rows for a section: skip label row + column-header row, stop at blank/next section
      const getDataRows = (label: string) => {
        const labelIdx = sectionIdx[label];
        if (labelIdx == null) return [] as { row: string[]; rowNum: number }[];
        const dataStart = labelIdx + 2;
        const dataEnd = sectionDataEnd(rows, dataStart);
        const result: { row: string[]; rowNum: number }[] = [];
        for (let i = dataStart; i < dataEnd; i++) {
          if (rows[i] && (rows[i][0] ?? '').toString().trim() !== '') {
            result.push({ row: rows[i], rowNum: i + 1 }); // rowNum is 1-based
          }
        }
        return result;
      };

      const incomeRows = getDataRows('INCOME');
      const monthlyIncome = incomeRows.length > 0 ? parseFloat(incomeRows[0].row[0] ?? '') || 0 : 0;
      const incomeRowIndex = incomeRows.length > 0 ? incomeRows[0].rowNum : null;

      const categories = getDataRows('CATEGORIES').map(({ row, rowNum }) => ({
        id: String(rowNum), name: (row[0] ?? '').toString(),
      }));
      const cards = getDataRows('CARDS').map(({ row, rowNum }) => ({
        id: String(rowNum), name: (row[0] ?? '').toString(),
      }));
      const fixedExpenses = getDataRows('FIXED EXPENSES').map(({ row, rowNum }) => ({
        id: String(rowNum), name: (row[0] ?? '').toString(), amount: parseFloat(row[1] ?? '') || 0,
      }));
      const savingGoals = getDataRows('SAVING GOALS').map(({ row, rowNum }) => ({
        id: String(rowNum), name: (row[0] ?? '').toString(), amount: parseFloat(row[1] ?? '') || 0, initialAmount: parseFloat(row[2] ?? '') || 0,
      }));

      return { categories, cards, fixedExpenses, monthlyIncome, incomeRowIndex, savingGoals };
    } catch (error) {
      console.error('Error reading config:', error);
      throw new Error('Failed to read config');
    }
  }

  async addConfigItem(sheetId: string, type: string, name: string, value = '', extra = ''): Promise<void> {
    try {
      const sectionLabel = TYPE_TO_SECTION[type];
      if (!sectionLabel) throw new Error(`Unknown config type: ${type}`);

      // Read current layout to find insertion point
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Config!A:C',
      });
      const rows = (response.data.values || []) as string[][];

      const labelIdx = rows.findIndex(
        r => (r[0] ?? '').toString().trim().toUpperCase() === sectionLabel
      );
      if (labelIdx === -1) throw new Error(`Config section "${sectionLabel}" not found`);

      // Data starts two rows after the label (skip label + column header)
      const insertAt = sectionDataEnd(rows, labelIdx + 2); // 0-based

      // Get the numeric sheet ID for insertDimension
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: sheetId,
        fields: 'sheets.properties',
      });
      const configNumericId = spreadsheet.data.sheets?.find(
        s => s.properties?.title === 'Config'
      )?.properties?.sheetId ?? 0;

      // Insert a blank row at the insertion point
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: [{
            insertDimension: {
              range: { sheetId: configNumericId, dimension: 'ROWS', startIndex: insertAt, endIndex: insertAt + 1 },
              inheritFromBefore: true,
            },
          }],
        },
      });

      // Write data into the newly inserted row (1-based: insertAt + 1)
      const newRowNum = insertAt + 1;
      let rowData: (string | number)[];
      let rangeEnd = 'B';
      if (type === 'income') {
        rowData = [parseFloat(value) || 0];
        rangeEnd = 'A';
      } else if (type === 'category' || type === 'card') {
        rowData = [name];
        rangeEnd = 'A';
      } else if (type === 'saving_goal') {
        rowData = [name, parseFloat(value) || 0, parseFloat(extra) || 0];
        rangeEnd = 'C';
      } else {
        rowData = [name, parseFloat(value) || 0];
      }

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `Config!A${newRowNum}:${rangeEnd}${newRowNum}`,
        valueInputOption: 'RAW',
        requestBody: { values: [rowData] },
      });
    } catch (error) {
      console.error('Error adding config item:', error);
      throw new Error('Failed to add config item');
    }
  }

  async updateConfigItem(sheetId: string, rowIndex: number, type: string, name: string, value = '', extra = ''): Promise<void> {
    try {
      let rowData: (string | number)[];
      let rangeEnd = 'B';
      if (type === 'income') {
        rowData = [parseFloat(value) || 0];
        rangeEnd = 'A';
      } else if (type === 'category' || type === 'card') {
        rowData = [name];
        rangeEnd = 'A';
      } else if (type === 'saving_goal') {
        rowData = [name, parseFloat(value) || 0, parseFloat(extra) || 0];
        rangeEnd = 'C';
      } else {
        rowData = [name, parseFloat(value) || 0];
      }

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `Config!A${rowIndex}:${rangeEnd}${rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: { values: [rowData] },
      });
    } catch (error) {
      console.error('Error updating config item:', error);
      throw new Error('Failed to update config item');
    }
  }

  async deleteConfigItem(sheetId: string, rowIndex: number): Promise<void> {
    try {
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: sheetId,
        fields: 'sheets.properties',
      });
      const configSheetId = spreadsheet.data.sheets?.find(
        (s) => s.properties?.title === 'Config'
      )?.properties?.sheetId;

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: configSheetId,
                dimension: 'ROWS',
                startIndex: rowIndex - 1,
                endIndex: rowIndex,
              },
            },
          }],
        },
      });
    } catch (error) {
      console.error('Error deleting config item:', error);
      throw new Error('Failed to delete config item');
    }
  }

  // Creates a monthly tab with a Fixed Expenses table and a Transactions table.
  private async createMonthSheet(
    spreadsheetId: string,
    monthLabel: string,
    fixedExpenses: { name: string; amount: number }[],
  ): Promise<void> {
    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: monthLabel } } }],
      },
    });

    const expenseRows = fixedExpenses.map(fe => [fe.name, fe.amount]);
    const rows: (string | number)[][] = [
      [`${monthLabel} Budget`],
      [],
      ['FIXED EXPENSES'],
      ['Name', 'Amount'],
      ...expenseRows,
      [],
      ['TRANSACTIONS'],
      ['Date', 'Amount', 'Category', 'Card', 'Note'],
    ];

    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${quoteSheet(monthLabel)}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: rows },
    });

    // Bold the title, section labels, and column headers
    const sheetMetadata = await this.sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties',
    });
    const numericSheetId = sheetMetadata.data.sheets?.find(
      s => s.properties?.title === monthLabel
    )?.properties?.sheetId;

    if (numericSheetId == null) return;

    const boldRows = [
      0,                              // title (row 1)
      2,                              // FIXED EXPENSES (row 3)
      3,                              // Name | Amount header (row 4)
      4 + expenseRows.length,         // blank row separator
      5 + expenseRows.length,         // TRANSACTIONS (row N+6)
      6 + expenseRows.length,         // Date | Amount | … header (row N+7)
    ];

    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: boldRows.map(rowIdx => ({
          repeatCell: {
            range: {
              sheetId: numericSheetId,
              startRowIndex: rowIdx,
              endRowIndex: rowIdx + 1,
            },
            cell: { userEnteredFormat: { textFormat: { bold: true } } },
            fields: 'userEnteredFormat.textFormat.bold',
          },
        })),
      },
    });
  }

  async readTransactions(spreadsheetId: string): Promise<{
    id: string; date: string; amount: number; category: string; card: string; note: string;
  }[]> {
    try {
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'sheets.properties',
      });

      const monthTabs = (spreadsheet.data.sheets || [])
        .map(s => s.properties?.title ?? '')
        .filter(title => MONTH_TAB_REGEX.test(title));

      const transactions: { id: string; date: string; amount: number; category: string; card: string; note: string }[] = [];

      for (const tabName of monthTabs) {
        const response = await this.sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${quoteSheet(tabName)}!A:E`,
        });

        const rows = response.data.values || [];

        // Find the "TRANSACTIONS" marker row
        let txnLabelIdx = -1;
        for (let i = 0; i < rows.length; i++) {
          if ((rows[i][0] ?? '').toString().toUpperCase() === 'TRANSACTIONS') {
            txnLabelIdx = i;
            break;
          }
        }
        if (txnLabelIdx === -1) continue;

        // Row after label is the column header; data starts two rows after the label
        const dataRows = rows.slice(txnLabelIdx + 2);
        dataRows.forEach((row, idx) => {
          const date = (row[0] ?? '').toString();
          const amount = parseFloat((row[1] ?? '').toString()) || 0;
          if (!date && !amount) return;
          // 1-based row index within the sheet
          const sheetRowNum = txnLabelIdx + 2 + idx + 1;
          transactions.push({
            id: `${tabName}|${sheetRowNum}`,
            date,
            amount,
            category: (row[2] ?? '').toString(),
            card: (row[3] ?? '').toString(),
            note: (row[4] ?? '').toString(),
          });
        });
      }

      return transactions;
    } catch (error) {
      console.error('Error reading transactions:', error);
      throw new Error('Failed to read transactions');
    }
  }

  async addTransaction(
    spreadsheetId: string,
    date: string,
    amount: number,
    category: string,
    card: string,
    note: string,
  ): Promise<void> {
    try {
      const monthLabel = getMonthLabel(date);

      // Check if the month tab already exists
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'sheets.properties',
      });
      const tabExists = (spreadsheet.data.sheets || []).some(
        s => s.properties?.title === monthLabel
      );

      if (!tabExists) {
        const config = await this.readConfig(spreadsheetId);
        await this.createMonthSheet(spreadsheetId, monthLabel, config.fixedExpenses);
      }

      await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${quoteSheet(monthLabel)}!A:E`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [[date, amount, category, card, note]] },
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw new Error('Failed to add transaction');
    }
  }

  // transactionId format: "Apr 2026|8"
  async deleteTransaction(spreadsheetId: string, tabName: string, rowIndex: number): Promise<void> {
    try {
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'sheets.properties',
      });
      const tabSheetId = spreadsheet.data.sheets?.find(
        s => s.properties?.title === tabName
      )?.properties?.sheetId;

      if (tabSheetId == null) throw new Error(`Month tab "${tabName}" not found`);

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: tabSheetId,
                dimension: 'ROWS',
                startIndex: rowIndex - 1,
                endIndex: rowIndex,
              },
            },
          }],
        },
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw new Error('Failed to delete transaction');
    }
  }
}
