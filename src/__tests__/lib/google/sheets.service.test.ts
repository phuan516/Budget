import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'
import { SheetsService } from '@/lib/google/sheets'

const { mockValuesGet, mockValuesUpdate, mockValuesAppend, mockSpreadsheetsGet, mockBatchUpdate } =
  vi.hoisted(() => ({
    mockValuesGet: vi.fn(),
    mockValuesUpdate: vi.fn(),
    mockValuesAppend: vi.fn(),
    mockSpreadsheetsGet: vi.fn(),
    mockBatchUpdate: vi.fn(),
  }))

vi.mock('googleapis', () => ({
  google: {
    sheets: vi.fn(() => ({
      spreadsheets: {
        values: { get: mockValuesGet, update: mockValuesUpdate, append: mockValuesAppend },
        get: mockSpreadsheetsGet,
        batchUpdate: mockBatchUpdate,
      },
    })),
    drive: vi.fn(() => ({ files: { list: vi.fn(), get: vi.fn() } })),
    auth: { OAuth2: vi.fn(() => ({})) },
  },
}))

const mockAuth = {} as never
const SHEET_ID = 'test-sheet-id'

function makeService() {
  return new SheetsService(mockAuth)
}

// Config tab rows fixture matching the real sheet layout
const CONFIG_ROWS = [
  ['INCOME'],
  ['Amount'],
  ['5000'],
  [],
  ['INCOME OVERRIDES'],
  ['Month', 'Amount', 'Note'],
  ['2026-01', '4500', 'bonus'],
  [],
  ['FIXED EXPENSE OVERRIDES'],
  ['Month', 'Expense', 'Amount', 'Note'],
  [],
  ['SAVING GOALS'],
  ['Name', 'Target', 'Initial'],
  ['Emergency', '10000', '2000'],
  [],
  ['CATEGORIES'],
  ['Name'],
  ['Groceries'],
  ['Gas'],
  [],
  ['CARDS'],
  ['Name'],
  ['Visa'],
  [],
  ['FIXED EXPENSES'],
  ['Name', 'Amount'],
  ['Rent', '2000'],
  ['Netflix', '15'],
]

describe('SheetsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBatchUpdate.mockResolvedValue({ data: {} })
    mockValuesUpdate.mockResolvedValue({ data: {} })
    mockValuesAppend.mockResolvedValue({ data: {} })
  })

  describe('readConfig', () => {
    it('parses income, categories, cards, fixed expenses, and saving goals', async () => {
      mockValuesGet.mockResolvedValueOnce({ data: { values: CONFIG_ROWS } })
      const result = await makeService().readConfig(SHEET_ID)

      expect(result.monthlyIncome).toBe(5000)
      expect(result.incomeRowIndex).toBe(3)
      expect(result.categories).toEqual([
        { id: '18', name: 'Groceries' },
        { id: '19', name: 'Gas' },
      ])
      expect(result.cards).toEqual([{ id: '23', name: 'Visa' }])
      expect(result.fixedExpenses).toEqual([
        { id: '27', name: 'Rent', amount: 2000 },
        { id: '28', name: 'Netflix', amount: 15 },
      ])
      expect(result.savingGoals).toEqual([
        { id: '14', name: 'Emergency', amount: 10000, initialAmount: 2000 },
      ])
    })

    it('parses income overrides and notes', async () => {
      mockValuesGet.mockResolvedValueOnce({ data: { values: CONFIG_ROWS } })
      const result = await makeService().readConfig(SHEET_ID)

      expect(result.monthlyIncomeOverrides).toEqual({ '2026-01': 4500 })
      expect(result.monthlyIncomeOverrideNotes).toEqual({ '2026-01': 'bonus' })
    })

    it('returns zero income and empty arrays when sheet has no data', async () => {
      mockValuesGet.mockResolvedValueOnce({ data: { values: [] } })
      const result = await makeService().readConfig(SHEET_ID)

      expect(result.monthlyIncome).toBe(0)
      expect(result.categories).toEqual([])
      expect(result.cards).toEqual([])
      expect(result.fixedExpenses).toEqual([])
      expect(result.savingGoals).toEqual([])
    })
  })

  describe('addTransaction', () => {
    it('appends to an existing month tab without creating a new sheet', async () => {
      mockSpreadsheetsGet.mockResolvedValueOnce({
        data: { sheets: [{ properties: { title: 'May 2026', sheetId: 1 } }] },
      })

      await makeService().addTransaction(SHEET_ID, '2026-05-10', 50, 'Groceries', 'Visa', 'lunch')

      expect(mockBatchUpdate).not.toHaveBeenCalled()
      expect(mockValuesAppend).toHaveBeenCalledWith(
        expect.objectContaining({
          range: "'May 2026'!A:E",
          requestBody: { values: [['2026-05-10', 50, 'Groceries', 'Visa', 'lunch']] },
        })
      )
    })

    it('creates the month tab first when it does not exist', async () => {
      // Check existence → not found
      mockSpreadsheetsGet.mockResolvedValueOnce({ data: { sheets: [] } })
      // readConfig call inside addTransaction
      mockValuesGet.mockResolvedValueOnce({ data: { values: CONFIG_ROWS } })
      // createMonthSheet's get for numericSheetId
      mockSpreadsheetsGet.mockResolvedValueOnce({
        data: { sheets: [{ properties: { title: 'May 2026', sheetId: 99 } }] },
      })

      await makeService().addTransaction(SHEET_ID, '2026-05-10', 50, 'Groceries', 'Visa', '')

      expect(mockBatchUpdate).toHaveBeenCalled()
      expect(mockValuesAppend).toHaveBeenCalledWith(
        expect.objectContaining({ range: "'May 2026'!A:E" })
      )
    })
  })

  describe('addConfigItem', () => {
    beforeEach(() => {
      mockSpreadsheetsGet.mockResolvedValue({
        data: { sheets: [{ properties: { title: 'Config', sheetId: 0 } }] },
      })
    })

    it('throws for an unknown config type', async () => {
      mockValuesGet.mockResolvedValue({ data: { values: [] } })
      await expect(makeService().addConfigItem(SHEET_ID, 'unknown', 'Test')).rejects.toThrow(
        'Failed to add config item'
      )
    })

    it('writes a category row with just the name', async () => {
      mockValuesGet.mockResolvedValue({
        data: { values: [['CATEGORIES'], ['Name'], ['Groceries']] },
      })

      await makeService().addConfigItem(SHEET_ID, 'category', 'Dining')

      expect(mockValuesUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ requestBody: { values: [['Dining']] } })
      )
    })

    it('writes a fixed_expense row with name and parsed amount', async () => {
      mockValuesGet.mockResolvedValue({
        data: { values: [['FIXED EXPENSES'], ['Name', 'Amount'], ['Rent', '2000']] },
      })

      await makeService().addConfigItem(SHEET_ID, 'fixed_expense', 'Netflix', '15')

      expect(mockValuesUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ requestBody: { values: [['Netflix', 15]] } })
      )
    })

    it('writes a saving_goal row with name, amount, and initial amount', async () => {
      mockValuesGet.mockResolvedValue({
        data: { values: [['SAVING GOALS'], ['Name', 'Target', 'Initial']] },
      })

      await makeService().addConfigItem(SHEET_ID, 'saving_goal', 'Vacation', '5000', '500')

      expect(mockValuesUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ requestBody: { values: [['Vacation', 5000, 500]] } })
      )
    })
  })

  describe('deleteConfigItem', () => {
    it('calls batchUpdate with a deleteDimension at the correct 0-based row range', async () => {
      mockSpreadsheetsGet.mockResolvedValue({
        data: { sheets: [{ properties: { title: 'Config', sheetId: 0 } }] },
      })

      await makeService().deleteConfigItem(SHEET_ID, 10)

      expect(mockBatchUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: {
            requests: [{
              deleteDimension: {
                range: { sheetId: 0, dimension: 'ROWS', startIndex: 9, endIndex: 10 },
              },
            }],
          },
        })
      )
    })
  })

  describe('ensureMonthTabExists', () => {
    it('does nothing when the tab already exists', async () => {
      mockSpreadsheetsGet.mockResolvedValueOnce({
        data: { sheets: [{ properties: { title: 'May 2026', sheetId: 1 } }] },
      })

      await makeService().ensureMonthTabExists(SHEET_ID, 'May 2026', [], 5000)

      expect(mockBatchUpdate).not.toHaveBeenCalled()
    })

    it('creates the sheet when the tab is missing', async () => {
      mockSpreadsheetsGet.mockResolvedValueOnce({ data: { sheets: [] } })
      mockSpreadsheetsGet.mockResolvedValueOnce({
        data: { sheets: [{ properties: { title: 'May 2026', sheetId: 55 } }] },
      })

      await makeService().ensureMonthTabExists(SHEET_ID, 'May 2026', [{ name: 'Rent', amount: 2000 }], 5000)

      expect(mockBatchUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: expect.objectContaining({
            requests: [{ addSheet: { properties: { title: 'May 2026' } } }],
          }),
        })
      )
    })
  })

  describe('ensurePastMonthTabs', () => {
    beforeAll(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-05-11T00:00:00Z'))
    })

    afterAll(() => {
      vi.useRealTimers()
    })

    it('does not create tabs when the latest past tab is the month before current', async () => {
      mockSpreadsheetsGet.mockResolvedValueOnce({
        data: { sheets: [{ properties: { title: 'Apr 2026', sheetId: 1 } }] },
      })

      await makeService().ensurePastMonthTabs(SHEET_ID, 5000, [])

      expect(mockBatchUpdate).not.toHaveBeenCalled()
    })

    it('creates the missing month tab between the latest past tab and current month', async () => {
      // Latest past tab is Mar 2026 → Apr 2026 is missing (current = May 2026)
      mockSpreadsheetsGet.mockResolvedValueOnce({
        data: { sheets: [{ properties: { title: 'Mar 2026', sheetId: 1 } }] },
      })
      // createMonthSheet's get for the new sheet's numericSheetId
      mockSpreadsheetsGet.mockResolvedValueOnce({
        data: { sheets: [{ properties: { title: 'Apr 2026', sheetId: 2 } }] },
      })

      await makeService().ensurePastMonthTabs(SHEET_ID, 5000, [])

      const addSheetCall = mockBatchUpdate.mock.calls.find(
        call => call[0]?.requestBody?.requests?.[0]?.addSheet?.properties?.title === 'Apr 2026'
      )
      expect(addSheetCall).toBeDefined()
    })
  })

  describe('setMonthTabIncome', () => {
    it('writes income to the value row immediately after the INCOME label', async () => {
      const rows = [
        ['Apr 2026 Budget'],
        [],
        ['INCOME'],        // index 2 → valueRowNum = 4 (1-based)
        ['5000', ''],
      ]
      mockValuesGet.mockResolvedValueOnce({ data: { values: rows } })

      await makeService().setMonthTabIncome(SHEET_ID, 'Apr 2026', 6000, 'raise')

      expect(mockValuesUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          range: "'Apr 2026'!A4:B4",
          requestBody: { values: [[6000, 'raise']] },
        })
      )
    })

    it('does nothing when the tab has no INCOME label', async () => {
      mockValuesGet.mockResolvedValueOnce({
        data: { values: [['TRANSACTIONS'], ['Date', 'Amount']] },
      })

      await makeService().setMonthTabIncome(SHEET_ID, 'Apr 2026', 6000)

      expect(mockValuesUpdate).not.toHaveBeenCalled()
    })
  })

  describe('deleteTransaction', () => {
    it('calls batchUpdate with a deleteDimension at the correct 0-based row range', async () => {
      mockSpreadsheetsGet.mockResolvedValueOnce({
        data: { sheets: [{ properties: { title: 'Apr 2026', sheetId: 7 } }] },
      })

      await makeService().deleteTransaction(SHEET_ID, 'Apr 2026', 15)

      expect(mockBatchUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: {
            requests: [{
              deleteDimension: {
                range: { sheetId: 7, dimension: 'ROWS', startIndex: 14, endIndex: 15 },
              },
            }],
          },
        })
      )
    })

    it('throws when the month tab is not found', async () => {
      mockSpreadsheetsGet.mockResolvedValueOnce({
        data: { sheets: [{ properties: { title: 'Mar 2026', sheetId: 3 } }] },
      })

      await expect(makeService().deleteTransaction(SHEET_ID, 'Apr 2026', 15)).rejects.toThrow(
        'Failed to delete transaction'
      )
    })
  })

  describe('readTransactions', () => {
    it('parses transactions, income, and fixed expenses from month tabs', async () => {
      mockSpreadsheetsGet.mockResolvedValueOnce({
        data: { sheets: [{ properties: { title: 'Apr 2026', sheetId: 1 } }] },
      })

      const tabRows = [
        ['Apr 2026 Budget'],                                       // row 0
        [],                                                        // row 1
        ['INCOME'],                                                // row 2
        ['5000', ''],                                              // row 3
        [],                                                        // row 4
        ['FIXED EXPENSES'],                                        // row 5
        ['Name', 'Amount', 'Note'],                                // row 6
        ['Rent', '2000', ''],                                      // row 7
        [],                                                        // row 8
        ['TRANSACTIONS'],                                          // row 9  ← txnLabelIdx
        ['Date', 'Amount', 'Category', 'Card', 'Note'],           // row 10
        ['2026-04-01', '50', 'Groceries', 'Visa', 'lunch'],       // row 11 → sheetRowNum 12
        ['2026-04-02', '30', 'Gas', 'Amex', ''],                  // row 12 → sheetRowNum 13
      ]
      mockValuesGet.mockResolvedValueOnce({ data: { values: tabRows } })

      const result = await makeService().readTransactions(SHEET_ID)

      expect(result.monthTabKeys).toEqual(['2026-04'])
      expect(result.monthConfigs['2026-04'].income).toBe(5000)
      expect(result.monthConfigs['2026-04'].fixedExpenses).toEqual([
        { name: 'Rent', amount: 2000, note: undefined },
      ])
      expect(result.transactions).toHaveLength(2)
      expect(result.transactions[0]).toMatchObject({
        id: 'Apr 2026|12',
        tab: 'Apr 2026',
        row: 12,
        date: '2026-04-01',
        amount: 50,
        category: 'Groceries',
        card: 'Visa',
        note: 'lunch',
      })
      expect(result.transactions[1]).toMatchObject({
        id: 'Apr 2026|13',
        row: 13,
        amount: 30,
      })
    })

    it('skips transaction rows that have no date and no amount', async () => {
      mockSpreadsheetsGet.mockResolvedValueOnce({
        data: { sheets: [{ properties: { title: 'Apr 2026', sheetId: 1 } }] },
      })

      const tabRows = [
        ['TRANSACTIONS'],                                    // row 0
        ['Date', 'Amount', 'Category', 'Card', 'Note'],     // row 1 (header)
        [],                                                  // row 2 → blank, skipped
        ['2026-04-01', '50', 'Groceries', 'Visa', ''],      // row 3
      ]
      mockValuesGet.mockResolvedValueOnce({ data: { values: tabRows } })

      const result = await makeService().readTransactions(SHEET_ID)

      expect(result.transactions).toHaveLength(1)
    })
  })
})
