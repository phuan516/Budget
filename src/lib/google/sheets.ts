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
const CONFIG_SECTIONS = ['INCOME', 'INCOME OVERRIDES', 'FIXED EXPENSE OVERRIDES', 'SAVING GOALS', 'CATEGORIES', 'CARDS', 'FIXED EXPENSES'] as const;
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

function monthLabelToNum(label: string): number {
  const [mon, yr] = label.split(' ');
  return parseInt(yr) * 12 + MONTH_NAMES.indexOf(mon);
}

export function currentMonthLabel(): string {
  const now = new Date();
  return `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
}

export function monthKeyToLabel(key: string): string {
  const [yr, mo] = key.split('-').map(Number);
  return `${MONTH_NAMES[mo - 1]} ${yr}`;
}

// Convert a month label like "Apr 2026" to a YYYY-MM key like "2026-04"
function monthLabelToKey(label: string): string {
  const [mon, yr] = label.split(' ');
  return `${yr}-${String(MONTH_NAMES.indexOf(mon) + 1).padStart(2, '0')}`;
}

// Increment a YYYY-MM key by one month
function nextMonthKey(key: string): string {
  const [yr, mo] = key.split('-').map(Number);
  if (mo === 12) return `${yr + 1}-01`;
  return `${yr}-${String(mo + 1).padStart(2, '0')}`;
}

export class SheetsService {
  private auth: Auth.OAuth2Client;
  private sheets: sheets_v4.Sheets;

  constructor(auth: Auth.OAuth2Client) {
    this.auth = auth;
    this.sheets = google.sheets({ version: 'v4', auth });
  }

  // Returns all non-trashed Google Sheets in the user's Drive, ordered by most recently modified.
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

  // Creates a new spreadsheet with a Config tab pre-populated with all section headers and bold formatting.
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
        ['INCOME OVERRIDES'],
        ['Month', 'Amount'],
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
      const boldRowIdxs = [0, 1, 3, 4, 6, 7, 9, 10, 12, 13, 15, 16]; // 0-based
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

  // Checks that the given spreadsheet has a Config tab; used to verify a user-provided sheetId before the app adopts it.
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

  // Returns the display name and URL of a spreadsheet via the Drive API.
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

  // Parses the entire Config tab into structured data: income, categories, cards, fixed expenses, saving goals, and override maps.
  async readConfig(sheetId: string): Promise<{
    categories: { id: string; name: string }[];
    cards: { id: string; name: string }[];
    fixedExpenses: { id: string; name: string; amount: number }[];
    monthlyIncome: number;
    monthlyIncomeOverrides: { [monthKey: string]: number };
    monthlyIncomeOverrideNotes: { [monthKey: string]: string };
    fixedExpenseOverrides: { [monthKey: string]: { [expenseName: string]: number } };
    fixedExpenseOverrideNotes: { [monthKey: string]: { [expenseName: string]: string } };
    incomeRowIndex: number | null;
    savingGoals: { id: string; name: string; amount: number; initialAmount: number }[];
  }> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Config!A:D',
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

      const monthlyIncomeOverrides: { [monthKey: string]: number } = {};
      const monthlyIncomeOverrideNotes: { [monthKey: string]: string } = {};
      for (const { row } of getDataRows('INCOME OVERRIDES')) {
        const key = (row[0] ?? '').toString().trim();
        const amt = parseFloat((row[1] ?? '').toString()) || 0;
        if (key && amt) {
          monthlyIncomeOverrides[key] = amt;
          const note = (row[2] ?? '').toString().trim();
          if (note) monthlyIncomeOverrideNotes[key] = note;
        }
      }

      const fixedExpenseOverrides: { [monthKey: string]: { [expenseName: string]: number } } = {};
      const fixedExpenseOverrideNotes: { [monthKey: string]: { [expenseName: string]: string } } = {};
      for (const { row } of getDataRows('FIXED EXPENSE OVERRIDES')) {
        const monthKey = (row[0] ?? '').toString().trim();
        const expName = (row[1] ?? '').toString().trim();
        const rawAmt = (row[2] ?? '').toString().trim();
        const amt = rawAmt !== '' ? parseFloat(rawAmt) : NaN;
        if (monthKey && expName && !isNaN(amt)) {
          if (!fixedExpenseOverrides[monthKey]) fixedExpenseOverrides[monthKey] = {};
          fixedExpenseOverrides[monthKey][expName] = amt;
          const note = (row[3] ?? '').toString().trim();
          if (note) {
            if (!fixedExpenseOverrideNotes[monthKey]) fixedExpenseOverrideNotes[monthKey] = {};
            fixedExpenseOverrideNotes[monthKey][expName] = note;
          }
        }
      }

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

      return { categories, cards, fixedExpenses, monthlyIncome, monthlyIncomeOverrides, monthlyIncomeOverrideNotes, fixedExpenseOverrides, fixedExpenseOverrideNotes, incomeRowIndex, savingGoals };
    } catch (error) {
      console.error('Error reading config:', error);
      throw new Error('Failed to read config');
    }
  }

  // Inserts a new row into the correct Config section; pushes all rows below it down, invalidating cached row indices.
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

  // Overwrites a config row in-place by its 1-based row index; no row shifting occurs.
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

  // Deletes a config row by its 1-based row index, shifting all rows below it up.
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

  // Rewrites the FIXED EXPENSES section on every month tab at or after minMonthLabel to match the canonical list from Config.
  async syncFixedExpensesToAllMonthSheets(
    spreadsheetId: string,
    fixedExpenses: { name: string; amount: number }[],
    minMonthLabel?: string,
  ): Promise<void> {
    const spreadsheet = await this.sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties',
    });
    const minNum = minMonthLabel ? monthLabelToNum(minMonthLabel) : -Infinity;
    const monthTabs = (spreadsheet.data.sheets || [])
      .map(s => ({ title: s.properties?.title ?? '', sheetId: s.properties?.sheetId ?? 0 }))
      .filter(s => MONTH_TAB_REGEX.test(s.title))
      .filter(s => monthLabelToNum(s.title) >= minNum);

    for (const tab of monthTabs) {
      try {
        await this.syncFixedExpensesToMonthSheet(spreadsheetId, tab.title, tab.sheetId, fixedExpenses);
      } catch (err) {
        console.error(`Failed to sync fixed expenses to ${tab.title}:`, err);
      }
    }
  }

  // Rewrites the FIXED EXPENSES section on a single month tab, inserting or deleting rows as needed to match the new count.
  private async syncFixedExpensesToMonthSheet(
    spreadsheetId: string,
    monthLabel: string,
    numericSheetId: number,
    fixedExpenses: { name: string; amount: number }[],
  ): Promise<void> {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${quoteSheet(monthLabel)}!A:B`,
    });
    const rows = (response.data.values || []) as string[][];

    const feLabelIdx = rows.findIndex(
      r => (r[0] ?? '').toString().trim().toUpperCase() === 'FIXED EXPENSES'
    );
    if (feLabelIdx === -1) return;

    // Data rows start 2 after label (label row + column header row)
    const dataStart = feLabelIdx + 2;

    // Find end of current data rows (stop at blank or TRANSACTIONS)
    let dataEnd = dataStart;
    while (dataEnd < rows.length) {
      const cell = (rows[dataEnd]?.[0] ?? '').toString().trim().toUpperCase();
      if (cell === '' || cell === 'TRANSACTIONS') break;
      dataEnd++;
    }

    const currentCount = dataEnd - dataStart;
    const newCount = fixedExpenses.length;
    const diff = newCount - currentCount;

    if (diff > 0) {
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            insertDimension: {
              range: { sheetId: numericSheetId, dimension: 'ROWS', startIndex: dataEnd, endIndex: dataEnd + diff },
              inheritFromBefore: false,
            },
          }],
        },
      });
    } else if (diff < 0) {
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: { sheetId: numericSheetId, dimension: 'ROWS', startIndex: dataStart + newCount, endIndex: dataEnd },
            },
          }],
        },
      });
    }

    if (newCount > 0) {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${quoteSheet(monthLabel)}!A${dataStart + 1}:B${dataStart + newCount}`,
        valueInputOption: 'RAW',
        requestBody: { values: fixedExpenses.map(fe => [fe.name, fe.amount]) },
      });
    }
  }

  // Creates a new month tab with INCOME, FIXED EXPENSES, and TRANSACTIONS sections, then bolds all headers.
  private async createMonthSheet(
    spreadsheetId: string,
    monthLabel: string,
    fixedExpenses: { name: string; amount: number }[],
    income: number = 0,
  ): Promise<void> {
    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: monthLabel } } }],
      },
    });

    const expenseRows = fixedExpenses.map(fe => [fe.name, fe.amount, '']);
    const rows: (string | number)[][] = [
      [`${monthLabel} Budget`],   // row 0 (1-based: 1)
      [],                          // row 1
      ['INCOME'],                  // row 2
      [income, ''],                // row 3 — col A = amount, col B = note
      [],                          // row 4
      ['FIXED EXPENSES'],          // row 5
      ['Name', 'Amount', 'Note'],  // row 6
      ...expenseRows,              // rows 7+
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

    // 0-based row indices to bold:
    // 0: title, 2: INCOME, 5: FIXED EXPENSES, 6: Name|Amount|Note header
    // 7+expenseRows.length+1: TRANSACTIONS, 7+expenseRows.length+2: Date|Amount|... header
    const afterExpenses = 7 + expenseRows.length;
    const boldRows = [
      0,               // title
      2,               // INCOME label
      5,               // FIXED EXPENSES label
      6,               // Name | Amount | Note header
      afterExpenses + 1, // TRANSACTIONS label (blank row at afterExpenses, then TRANSACTIONS)
      afterExpenses + 2, // Date | Amount | … header
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

  // Creates the month tab if it doesn't already exist; no-op if it does.
  async ensureMonthTabExists(
    spreadsheetId: string,
    monthLabel: string,
    fixedExpenses: { name: string; amount: number }[],
    income: number,
  ): Promise<void> {
    const spreadsheet = await this.sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties',
    });
    const tabExists = (spreadsheet.data.sheets || []).some(
      s => s.properties?.title === monthLabel
    );
    if (!tabExists) {
      await this.createMonthSheet(spreadsheetId, monthLabel, fixedExpenses, income);
    }
  }

  // Fills in any month tabs missing between the latest past tab and the current month (e.g. if the app was unused for several months).
  async ensurePastMonthTabs(
    spreadsheetId: string,
    income: number,
    fixedExpenses: { name: string; amount: number }[],
  ): Promise<void> {
    const spreadsheet = await this.sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties',
    });

    const existingMonthTabs = (spreadsheet.data.sheets || [])
      .map(s => s.properties?.title ?? '')
      .filter(title => MONTH_TAB_REGEX.test(title));

    if (existingMonthTabs.length === 0) return;

    const existingKeys = new Set(existingMonthTabs.map(label => monthLabelToKey(label)));

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Find the latest past month key (keys < currentMonthKey)
    const pastKeys = [...existingKeys].filter(k => k < currentMonthKey).sort();
    if (pastKeys.length === 0) return;

    const latestPastKey = pastKeys[pastKeys.length - 1];

    // Iterate from the month after latestPastKey up to (but not including) currentMonthKey
    let key = nextMonthKey(latestPastKey);
    while (key < currentMonthKey) {
      if (!existingKeys.has(key)) {
        const label = monthKeyToLabel(key);
        try {
          await this.createMonthSheet(spreadsheetId, label, fixedExpenses, income);
        } catch (err) {
          console.error(`Failed to create past month tab ${label}:`, err);
        }
      }
      key = nextMonthKey(key);
    }
  }

  // Writes the income amount and optional note into a month tab's INCOME value row; silently no-ops on old-format tabs without an INCOME section.
  async setMonthTabIncome(
    spreadsheetId: string,
    monthLabel: string,
    income: number,
    note?: string,
  ): Promise<void> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${quoteSheet(monthLabel)}!A:B`,
      });
      const rows = (response.data.values || []) as string[][];

      const incomeLabelIdx = rows.findIndex(
        r => (r[0] ?? '').toString().trim().toUpperCase() === 'INCOME'
      );
      if (incomeLabelIdx === -1) return; // old-format tab — Config override handles it

      // The value row is immediately after the label (1-based: incomeLabelIdx + 2)
      const valueRowNum = incomeLabelIdx + 2;
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${quoteSheet(monthLabel)}!A${valueRowNum}:B${valueRowNum}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[income, note ?? '']] },
      });
    } catch (error) {
      console.error(`Error setting income in month tab ${monthLabel}:`, error);
      throw new Error(`Failed to set income in month tab ${monthLabel}`);
    }
  }

  // Finds a fixed expense row by name in a month tab and overwrites its amount and optional note.
  async setMonthTabFixedExpenseAmount(
    spreadsheetId: string,
    monthLabel: string,
    expenseName: string,
    amount: number,
    note?: string,
  ): Promise<void> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${quoteSheet(monthLabel)}!A:C`,
      });
      const rows = (response.data.values || []) as string[][];

      const feLabelIdx = rows.findIndex(
        r => (r[0] ?? '').toString().trim().toUpperCase() === 'FIXED EXPENSES'
      );
      if (feLabelIdx === -1) return;

      // dataStart = feLabelIdx + 2 (skip label row + header row)
      const dataStart = feLabelIdx + 2;

      // Scan until blank or TRANSACTIONS
      let i = dataStart;
      while (i < rows.length) {
        const cell = (rows[i]?.[0] ?? '').toString().trim().toUpperCase();
        if (cell === '' || cell === 'TRANSACTIONS') break;
        if ((rows[i]?.[0] ?? '').toString().trim() === expenseName) {
          // 1-based row number
          const rowNum = i + 1;
          await this.sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${quoteSheet(monthLabel)}!B${rowNum}:C${rowNum}`,
            valueInputOption: 'RAW',
            requestBody: { values: [[amount, note ?? '']] },
          });
          return;
        }
        i++;
      }
      // Expense name not found in the tab — nothing to update
    } catch (error) {
      console.error(`Error setting fixed expense in month tab ${monthLabel}:`, error);
      throw new Error(`Failed to set fixed expense in month tab ${monthLabel}`);
    }
  }

  // Reads all month tabs, returning every transaction, per-month income/fixed expense config as stored in each tab, and the ordered list of month keys.
  async readTransactions(spreadsheetId: string): Promise<{
    transactions: { id: string; date: string; amount: number; category: string; card: string; note: string }[];
    monthTabKeys: string[];
    monthConfigs: Record<string, { income?: number; incomeNote?: string; fixedExpenses: { name: string; amount: number; note?: string }[] }>;
  }> {
    try {
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'sheets.properties',
      });

      const monthTabs = (spreadsheet.data.sheets || [])
        .map(s => s.properties?.title ?? '')
        .filter(title => MONTH_TAB_REGEX.test(title));

      const monthTabKeys = monthTabs.map(title => {
        const [mon, yr] = title.split(' ');
        return `${yr}-${String(MONTH_NAMES.indexOf(mon) + 1).padStart(2, '0')}`;
      });

      const transactions: { id: string; date: string; amount: number; category: string; card: string; note: string }[] = [];
      const monthConfigs: Record<string, { income?: number; incomeNote?: string; fixedExpenses: { name: string; amount: number; note?: string }[] }> = {};

      for (let tabIdx = 0; tabIdx < monthTabs.length; tabIdx++) {
        const tabName = monthTabs[tabIdx];
        const monthKey = monthTabKeys[tabIdx];

        const response = await this.sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${quoteSheet(tabName)}!A:E`,
        });

        const rows = (response.data.values || []) as string[][];

        // --- Read INCOME section ---
        let tabIncome: number | undefined;
        let tabIncomeNote: string | undefined;
        const incomeLabelIdx = rows.findIndex(
          r => (r[0] ?? '').toString().trim().toUpperCase() === 'INCOME'
        );
        if (incomeLabelIdx !== -1) {
          const incomeValueRow = rows[incomeLabelIdx + 1];
          if (incomeValueRow) {
            const rawAmt = (incomeValueRow[0] ?? '').toString().trim();
            if (rawAmt !== '') {
              tabIncome = parseFloat(rawAmt) || 0;
              const rawNote = (incomeValueRow[1] ?? '').toString().trim();
              if (rawNote) tabIncomeNote = rawNote;
            }
          }
        }

        // --- Read FIXED EXPENSES section ---
        const tabFixedExpenses: { name: string; amount: number; note?: string }[] = [];
        const feLabelIdx = rows.findIndex(
          r => (r[0] ?? '').toString().trim().toUpperCase() === 'FIXED EXPENSES'
        );
        if (feLabelIdx !== -1) {
          const feDataStart = feLabelIdx + 2; // skip label + header row
          let feIdx = feDataStart;
          while (feIdx < rows.length) {
            const cell = (rows[feIdx]?.[0] ?? '').toString().trim();
            const cellUpper = cell.toUpperCase();
            if (cell === '' || cellUpper === 'TRANSACTIONS') break;
            const name = cell;
            const amount = parseFloat((rows[feIdx]?.[1] ?? '').toString()) || 0;
            const note = (rows[feIdx]?.[2] ?? '').toString().trim() || undefined;
            tabFixedExpenses.push({ name, amount, note });
            feIdx++;
          }
        }

        monthConfigs[monthKey] = {
          income: tabIncome,
          incomeNote: tabIncomeNote,
          fixedExpenses: tabFixedExpenses,
        };

        // --- Read TRANSACTIONS section ---
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

      return { transactions, monthTabKeys, monthConfigs };
    } catch (error) {
      console.error('Error reading transactions:', error);
      throw new Error('Failed to read transactions');
    }
  }

  // Appends a transaction row to the correct month tab, creating the tab first if it doesn't exist.
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
        await this.createMonthSheet(spreadsheetId, monthLabel, config.fixedExpenses, config.monthlyIncome);
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

  // Deletes a transaction row by its 1-based row index within the given month tab.
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
