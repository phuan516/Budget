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

      // Add headers to Config sheet
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        requestBody: {
          requests: [
            {
              appendCells: {
                sheetId: 0,
                rows: [
                  {
                    values: [
                      { userEnteredValue: { stringValue: 'Type' } },
                      { userEnteredValue: { stringValue: 'Name' } },
                      { userEnteredValue: { stringValue: 'Value' } },
                    ],
                  },
                ],
                fields: 'userEnteredValue',
              },
            },
          ],
        },
      });

      // Add headers to Transactions sheet
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        requestBody: {
          requests: [
            {
              appendCells: {
                sheetId: 1,
                rows: [
                  {
                    values: [
                      { userEnteredValue: { stringValue: 'Date' } },
                      { userEnteredValue: { stringValue: 'Amount' } },
                      { userEnteredValue: { stringValue: 'Category' } },
                      { userEnteredValue: { stringValue: 'Card' } },
                      { userEnteredValue: { stringValue: 'Note' } },
                    ],
                  },
                ],
                fields: 'userEnteredValue',
              },
            },
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
}
