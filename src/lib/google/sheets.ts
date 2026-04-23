// Google Sheets API wrapper
import { google, sheets_v4, Auth} from 'googleapis';

export interface SheetMetadata {
  id: string;
  name: string;
  modifiedTime?: string;
  thumbnailLink?: string;
  ownedByMe?: boolean;
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
        q: "mimeType='application/vnd.google-apps.spreadsheet'",
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
      console.error('Error listing sheets:', error);
      throw new Error('Failed to load sheets');
    }
  }

  async createBudgetSheet(name: string): Promise<{ id: string; url: string; name: string }> {
    try {
      const response = await this.sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: name,
          },
          sheets: [
            {
              properties: {
                sheetId: 0,
                title: 'Config',
              },
            },
            {
              properties: {
                sheetId: 1,
                title: 'Transactions',
              },
            },
          ],
        },
      });

      const spreadsheetId = response.data.spreadsheetId!;
      const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

      // Write headers using A1 notation so we don't depend on internal sheetId values
      await this.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'RAW',
          data: [
            { range: 'Config!A1:C1', values: [['Type', 'Name', 'Value']] },
            { range: 'Transactions!A1:E1', values: [['Date', 'Amount', 'Category', 'Card', 'Note']] },
          ],
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
        ranges: ['Config', 'Transactions'],
        fields: 'sheets.properties.title',
      });

      const sheetTitles = response.data.sheets?.map(s => s.properties?.title) || [];
      const requiredSheets = ['Config', 'Transactions'];
      const missing = requiredSheets.filter(sheet => !sheetTitles.includes(sheet));

      if (missing.length > 0) {
        return { valid: false, missing };
      }

      // Check headers in Config sheet
      const configRange = 'Config!A1:C1';
      const configResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: configRange,
      });

      const configHeaders = configResponse.data.values?.[0] || [];
      const requiredConfigHeaders = ['Type', 'Name', 'Value'];
      const hasConfigHeaders = requiredConfigHeaders.every(
        (h, i) => configHeaders[i]?.toString().toLowerCase() === h.toLowerCase()
      );

      if (!hasConfigHeaders) {
        return { valid: false, missing: ['Config headers'] };
      }

      // Check headers in Transactions sheet
      const txnRange = 'Transactions!A1:E1';
      const txnResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: txnRange,
      });

      const txnHeaders = txnResponse.data.values?.[0] || [];
      const requiredTxnHeaders = ['Date', 'Amount', 'Category', 'Card', 'Note'];
      const hasTxnHeaders = requiredTxnHeaders.every(
        (h, i) => txnHeaders[i]?.toString().toLowerCase() === h.toLowerCase()
      );

      if (!hasTxnHeaders) {
        return { valid: false, missing: ['Transactions headers'] };
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
    savingGoals: { id: string; name: string; amount: number }[];
  }> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Config!A2:C',
      });

      const rows = response.data.values || [];
      const result = {
        categories: [] as { id: string; name: string }[],
        cards: [] as { id: string; name: string }[],
        fixedExpenses: [] as { id: string; name: string; amount: number }[],
        monthlyIncome: 0,
        incomeRowIndex: null as number | null,
        savingGoals: [] as { id: string; name: string; amount: number }[],
      };

      rows.forEach((row, idx) => {
        const type = (row[0] ?? '').toString().toLowerCase().trim();
        const name = (row[1] ?? '').toString();
        const value = (row[2] ?? '').toString();
        const rowIndex = idx + 2; // 1-based, skipping header at row 1
        const id = String(rowIndex);

        if (type === 'category') result.categories.push({ id, name });
        else if (type === 'card') result.cards.push({ id, name });
        else if (type === 'fixed_expense') result.fixedExpenses.push({ id, name, amount: parseFloat(value) || 0 });
        else if (type === 'income') { result.monthlyIncome = parseFloat(value) || 0; result.incomeRowIndex = rowIndex; }
        else if (type === 'saving_goal') result.savingGoals.push({ id, name, amount: parseFloat(value) || 0 });
      });

      return result;
    } catch (error) {
      console.error('Error reading config:', error);
      throw new Error('Failed to read config');
    }
  }

  async addConfigItem(sheetId: string, type: string, name: string, value = ''): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: 'Config!A:C',
        valueInputOption: 'RAW',
        requestBody: { values: [[type, name, value]] },
      });
    } catch (error) {
      console.error('Error adding config item:', error);
      throw new Error('Failed to add config item');
    }
  }

  async updateConfigItem(sheetId: string, rowIndex: number, type: string, name: string, value = ''): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `Config!A${rowIndex}:C${rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[type, name, value]] },
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

  async readTransactions(sheetId: string): Promise<{
    id: string; date: string; amount: number; category: string; card: string; note: string;
  }[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Transactions!A2:E',
      });

      const rows = response.data.values || [];
      return rows
        .map((row, idx) => ({
          id: String(idx + 2),
          date: (row[0] ?? '').toString(),
          amount: parseFloat((row[1] ?? '').toString()) || 0,
          category: (row[2] ?? '').toString(),
          card: (row[3] ?? '').toString(),
          note: (row[4] ?? '').toString(),
        }))
        .filter((t) => t.date || t.amount);
    } catch (error) {
      console.error('Error reading transactions:', error);
      throw new Error('Failed to read transactions');
    }
  }

  async addTransaction(
    sheetId: string,
    date: string,
    amount: number,
    category: string,
    card: string,
    note: string,
  ): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: 'Transactions!A:E',
        valueInputOption: 'RAW',
        requestBody: { values: [[date, amount, category, card, note]] },
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw new Error('Failed to add transaction');
    }
  }

  async deleteTransaction(sheetId: string, rowIndex: number): Promise<void> {
    try {
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: sheetId,
        fields: 'sheets.properties',
      });
      const txnSheetId = spreadsheet.data.sheets?.find(
        (s) => s.properties?.title === 'Transactions'
      )?.properties?.sheetId;

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: txnSheetId,
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
