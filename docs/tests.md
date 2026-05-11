# Test Suite Documentation

60 tests across 5 files. All tests use [Vitest](https://vitest.dev/).

Run tests:
```bash
npm test              # run once
npm run test:watch    # watch mode
npm run test:coverage # with coverage report
```

---

## Overview

All user actions in this app flow through one chain:

```
UI click → API route → SheetsService method → Google Sheets API
```

The tests cover three layers of that chain:

| Layer | File(s) | Strategy |
|---|---|---|
| Pure helper functions | `sheets.helpers.test.ts` | Direct call, no mocks |
| SheetsService business logic | `sheets.service.test.ts` | Google API mocked |
| API route handlers | `transactions.test.ts`, `transactions.add.test.ts`, `config.test.ts` | SheetsService mocked |

---

## File 1: `sheets.helpers.test.ts` — 16 tests

Tests small utility functions exported from `src/lib/google/sheets.ts`. No mocks, no async — input in, value out.

---

### `quoteSheet`

Wraps a sheet name in single quotes for use in a Google Sheets range string like `'Apr 2026'!A:E`. Single quotes inside the name must be escaped as two single quotes — that is the spreadsheet range escaping rule.

| # | Test | Input | Expected |
|---|---|---|---|
| 1 | Wraps a normal name in single quotes | `'Apr 2026'` | `"'Apr 2026'"` |
| 2 | Escapes single quotes in the name | `"Peter's Budget"` | `"'Peter''s Budget'"` |
| 3 | Handles empty string | `''` | `"''"` |

**Test 2 matters because:** if a sheet name contains an apostrophe and it is not escaped, the range string becomes malformed and the API call fails silently or with a cryptic error.

---

### `getMonthLabel`

Converts a date string (`'2026-05-10'`) into the tab name format (`'May 2026'`). This determines which month tab a transaction belongs to when it is added.

| # | Test | Input | Expected |
|---|---|---|---|
| 4 | Returns Jan for month 01 | `'2026-01-15'` | `'Jan 2026'` |
| 5 | Returns Dec for month 12 | `'2025-12-31'` | `'Dec 2025'` |
| 6 | Returns correct label for mid-year | `'2024-07-04'` | `'Jul 2024'` |

**Tests 4 and 5 matter because:** January (index 0) and December (index 11) are the boundary values in the month name array. Off-by-one errors show up at boundaries.

---

### `monthKeyToLabel` / `monthLabelToKey`

These two functions convert between the internal sort key format (`'2026-04'`) and the human-readable tab name (`'Apr 2026'`). They must be perfect inverses because keys are used for sorting and comparing months, while labels are used for actual sheet tab names.

| # | Test | Input | Expected |
|---|---|---|---|
| 7 | Round-trips `2026-01` | `monthLabelToKey(monthKeyToLabel('2026-01'))` | `'2026-01'` |
| 8 | Round-trips `2026-12` | `monthLabelToKey(monthKeyToLabel('2026-12'))` | `'2026-12'` |
| 9 | Round-trips `2025-04` | `monthLabelToKey(monthKeyToLabel('2025-04'))` | `'2025-04'` |
| 10 | Round-trips `2024-07` | `monthLabelToKey(monthKeyToLabel('2024-07'))` | `'2024-07'` |
| 11 | Converts key to label | `'2026-04'` | `'Apr 2026'` |
| 12 | Converts label to key | `'Apr 2026'` | `'2026-04'` |
| 13 | Pads single-digit month with zero | `'Jan 2026'` | `'2026-01'` (not `'2026-1'`) |

**Test 13 matters because:** months are compared as strings (`'2026-04' < '2026-05'`). Without the leading zero, `'2026-9'` would sort after `'2026-10'`, breaking the ordering logic in `ensurePastMonthTabs`.

---

### `nextMonthKey`

Increments a YYYY-MM key by one month. Used by `ensurePastMonthTabs` to walk forward through months looking for gaps.

| # | Test | Input | Expected |
|---|---|---|---|
| 14 | Increments a mid-year month | `'2026-03'` | `'2026-04'` |
| 15 | Rolls over December to January of the next year | `'2025-12'` | `'2026-01'` |
| 16 | Increments November without rollover | `'2026-11'` | `'2026-12'` |

**Test 15 matters because:** if the December rollover is broken, the function produces `'2025-13'`, which never matches any real tab and causes an infinite loop in `ensurePastMonthTabs`.

---

### `monthLabelToNum`

Converts a label like `'Apr 2026'` to a single integer so months can be compared by magnitude. Used to filter which tabs are "past" vs. "future."

| # | Test | Assertion | Why |
|---|---|---|---|
| 17 | Later month in same year is greater | `monthLabelToNum('Apr 2026') > monthLabelToNum('Mar 2026')` | Within a year, later months must produce larger numbers |
| 18 | Jan of next year is greater than Dec of current year | `monthLabelToNum('Jan 2027') > monthLabelToNum('Dec 2026')` | Year boundary must be ordered correctly |
| 19 | Same month always returns the same number | `monthLabelToNum('Apr 2026') === monthLabelToNum('Apr 2026')` | Idempotency |

---

### `sectionDataEnd`

Scans rows starting from a given index and returns the index where the current section ends — either at a blank row or when it hits a known section header like `CATEGORIES`. Used throughout `readConfig` and `addConfigItem` to determine how many data rows a section has.

| # | Test | Input rows | Start index | Expected |
|---|---|---|---|---|
| 20 | Stops at a blank row | `[['Groceries'], ['Rent'], [''], ['Gas']]` | `0` | `2` |
| 21 | Stops at a CONFIG_SECTION_SET header | `[['Groceries'], ['Rent'], ['CATEGORIES'], ['Food']]` | `0` | `2` |
| 22 | Case-insensitive section header match | `[['Groceries'], ['cards'], ['Food']]` | `0` | `1` |
| 23 | Runs to end of array when no stop condition | `[['Groceries'], ['Rent'], ['Gas']]` | `0` | `3` |
| 24 | Respects the fromIdx offset | `[['INCOME'], ['5000'], [''], ['Rent']]` | `1` | `2` |
| 25 | Returns fromIdx immediately on a blank start row | `[[''], ['Rent']]` | `0` | `0` |

**Test 21 matters because:** even without a blank separator row, reaching the next section header must stop the scan — otherwise data from one section leaks into the next.

**Test 22 matters because:** a user typing `cards` in lowercase would cause the parser to over-read into the next section if the check were case-sensitive.

**Test 24 matters because:** callers always pass a start index that skips the section label and its column header row. The offset must be honored so the function does not scan rows it should skip.

---

## File 2: `sheets.service.test.ts` — 27 tests

Tests `SheetsService` methods with the Google Sheets API fully mocked. Five mock functions replace all real API calls:

| Mock | Replaces |
|---|---|
| `mockValuesGet` | `spreadsheets.values.get` — reads rows from a range |
| `mockValuesUpdate` | `spreadsheets.values.update` — overwrites a range |
| `mockValuesAppend` | `spreadsheets.values.append` — appends rows |
| `mockSpreadsheetsGet` | `spreadsheets.get` — gets spreadsheet metadata (sheet list, IDs) |
| `mockBatchUpdate` | `spreadsheets.batchUpdate` — insert/delete rows, create/delete sheets |

### CONFIG_ROWS fixture

Several tests share this 28-row array that simulates a complete Config tab:

```
Row 0:  INCOME              (section label)
Row 1:  Amount              (column header — skipped by parser)
Row 2:  5000                (data: the income value)
Row 3:  (blank)
Row 4:  INCOME OVERRIDES
Row 5:  Month, Amount, Note (column header)
Row 6:  2026-01, 4500, bonus (data: one override)
Row 7:  (blank)
Row 8:  FIXED EXPENSE OVERRIDES
Row 9:  Month, Expense, Amount, Note (column header)
Row 10: (blank — no overrides)
Row 11: SAVING GOALS
Row 12: Name, Target, Initial (column header)
Row 13: Emergency, 10000, 2000 (data: one goal)
Row 14: (blank)
Row 15: CATEGORIES
Row 16: Name (column header)
Row 17: Groceries (data)
Row 18: Gas (data)
Row 19: (blank)
Row 20: CARDS
Row 21: Name (column header)
Row 22: Visa (data)
Row 23: (blank)
Row 24: FIXED EXPENSES
Row 25: Name, Amount (column header)
Row 26: Rent, 2000 (data)
Row 27: Netflix, 15 (data)
```

---

### `readConfig`

| # | Test | Input | Expected |
|---|---|---|---|
| 26 | Parses all sections from a full Config tab | `CONFIG_ROWS` | `monthlyIncome: 5000`, `incomeRowIndex: 3`, categories: `[{id:'18', name:'Groceries'}, {id:'19', name:'Gas'}]`, cards: `[{id:'23', name:'Visa'}]`, fixedExpenses: `[{id:'27', name:'Rent', amount:2000}, {id:'28', name:'Netflix', amount:15}]`, savingGoals: `[{id:'14', name:'Emergency', amount:10000, initialAmount:2000}]` |
| 27 | Parses income overrides and notes | `CONFIG_ROWS` | `monthlyIncomeOverrides: {'2026-01': 4500}`, `monthlyIncomeOverrideNotes: {'2026-01': 'bonus'}` |
| 28 | Returns safe defaults when the sheet is empty | `[]` (empty) | `monthlyIncome: 0`, all arrays `[]` |

**ID values explained (test 26):** Items do not have stored IDs — the row number in the spreadsheet is the ID, because row number is how `updateConfigItem` and `deleteConfigItem` find the right row. The parser sets `id = String(rowNum)` using the 1-based row index. Groceries is at row index 17, so `id = '18'` (17 + 1). The `incomeRowIndex` of `3` is the 1-based row of the income value (row index 2 + 1), used when `updateConfigItem` needs to overwrite that cell.

**Test 27 matters because:** income overrides let you set a different income for a specific month. If the month key or amount is parsed incorrectly, the dashboard shows wrong totals for that month.

**Test 28 matters because:** a brand new sheet has no data. The app must not crash or return garbage for an empty Config tab.

---

### `addTransaction`

| # | Test | Setup | Input | Expected behavior |
|---|---|---|---|---|
| 29 | Appends to an existing month tab | `spreadsheets.get` returns a sheet list containing `'May 2026'` | `date='2026-05-10'`, `amount=50`, `category='Groceries'`, `card='Visa'`, `note='lunch'` | `batchUpdate` NOT called; `values.append` called with `range: "'May 2026'!A:E"` and `values: [['2026-05-10', 50, 'Groceries', 'Visa', 'lunch']]` |
| 30 | Creates the month tab first when it does not exist | First `spreadsheets.get` returns no sheets; `values.get` returns `CONFIG_ROWS`; second `spreadsheets.get` returns the new sheet with `sheetId: 99` | Same transaction targeting May 2026 | `batchUpdate` called (addSheet); `values.append` called with `range: "'May 2026'!A:E"` |

**Test 29 explained:** The date `'2026-05-10'` maps to `'May 2026'` via `getMonthLabel`. Since that tab already exists, the service goes straight to appending. No sheet creation occurs.

**Test 30 explained:** When you add your first transaction for a new month, the tab does not exist yet. The service must read the config (to get the income and fixed expenses layout), create the tab with the correct structure (INCOME / FIXED EXPENSES / TRANSACTIONS sections), and then append the transaction. Three separate `spreadsheets.get` calls happen: one to check existence, one inside `readConfig` (via `values.get`), and one to retrieve the new tab's numeric sheet ID for the bold-formatting `batchUpdate`.

---

### `addConfigItem`

| # | Test | Input | Expected |
|---|---|---|---|
| 31 | Throws for an unknown type | `type='unknown'`, `name='Test'` | Rejects with `'Failed to add config item'` |
| 32 | Writes a category row with just the name | `type='category'`, `name='Dining'` | `values.update` called with `values: [['Dining']]` |
| 33 | Writes a fixed_expense row with name and parsed amount | `type='fixed_expense'`, `name='Netflix'`, `value='15'` (string) | `values.update` called with `values: [['Netflix', 15]]` — amount is a number |
| 34 | Writes a saving_goal row with name, amount, and initial amount | `type='saving_goal'`, `name='Vacation'`, `value='5000'`, `extra='500'` | `values.update` called with `values: [['Vacation', 5000, 500]]` |

**Test 31 matters because:** the config type is looked up in a map (`TYPE_TO_SECTION`). An unrecognized type would silently skip the insert with no error. The throw surfaces bugs immediately.

**Test 33 matters because:** the amount arrives as a string from the API request body. It must be converted to a number before writing to the sheet. If written as a string, any spreadsheet formula that sums fixed expenses would treat the cell as text and return zero.

**Test 34 matters because:** saving goals have three columns (Name, Target, Initial) instead of two. This confirms the `extra` parameter correctly maps to the third column.

---

### `deleteConfigItem`

| # | Test | Setup | Input | Expected |
|---|---|---|---|---|
| 35 | Calls batchUpdate with the correct 0-based row range | `spreadsheets.get` returns `Config` tab with `sheetId: 0` | `rowIndex=10` (1-based) | `batchUpdate` called with `deleteDimension: { range: { sheetId: 0, dimension: 'ROWS', startIndex: 9, endIndex: 10 } }` |

**Explained:** The Google Sheets API uses 0-based row indices. The app stores 1-based row numbers (because that is how Google Sheets displays them to users). The conversion is `startIndex = rowIndex - 1`. If this is off by one, the wrong row gets deleted — potentially removing a different category, card, or expense than the user intended.

---

### `ensureMonthTabExists`

| # | Test | Setup | Input | Expected |
|---|---|---|---|---|
| 36 | Does nothing when the tab already exists | `spreadsheets.get` returns a sheet list containing `'May 2026'` | `monthLabel='May 2026'`, `fixedExpenses=[]`, `income=5000` | `batchUpdate` NOT called |
| 37 | Creates the sheet when the tab is missing | First `spreadsheets.get` returns empty list; second returns the new `'May 2026'` sheet with `sheetId: 55` | `monthLabel='May 2026'`, `fixedExpenses=[{name:'Rent', amount:2000}]`, `income=5000` | `batchUpdate` called with `addSheet: { properties: { title: 'May 2026' } }` |

**Test 36 matters because:** this function is called every time the dashboard loads to ensure the current month tab exists. It must be a no-op when the tab is already there — otherwise it would attempt to create a duplicate and the API would error.

---

### `ensurePastMonthTabs`

The system clock is frozen to `2026-05-11` for these tests so "current month" is deterministically May 2026 regardless of when the test suite runs.

| # | Test | Setup | Expected |
|---|---|---|---|
| 38 | Does not create tabs when there are no gaps | `spreadsheets.get` returns `['Apr 2026']` | `batchUpdate` NOT called |
| 39 | Creates the missing month tab between latest past tab and current month | `spreadsheets.get` returns `['Mar 2026']`; second `spreadsheets.get` returns the new `'Apr 2026'` sheet | `batchUpdate` called with `addSheet` for `'Apr 2026'` |

**Test 38 explained:** Apr 2026 is immediately before May 2026 (current month). There are no gaps to fill. This is the normal steady-state case — the function should be silent.

**Test 39 explained:** If the app was unused during April, Apr 2026 is missing. When May loads, the function detects the gap and creates Apr. Note: only Apr is created, not any earlier gaps (e.g. Feb), because the function fills forward from the *latest* past tab only. Mar 2026 is the latest past tab, so it starts from the month after Mar and walks forward to May.

---

### `setMonthTabIncome`

| # | Test | Setup | Input | Expected |
|---|---|---|---|---|
| 40 | Writes income to the correct row | `values.get` returns 4 rows: title, blank, `INCOME` at index 2, value row | `monthLabel='Apr 2026'`, `income=6000`, `note='raise'` | `values.update` called with `range: "'Apr 2026'!A4:B4"` and `values: [[6000, 'raise']]` |
| 41 | Does nothing when tab has no INCOME label | `values.get` returns only `TRANSACTIONS` header rows (old-format tab) | `monthLabel='Apr 2026'`, `income=6000` | `values.update` NOT called |

**Row number explained (test 40):** `INCOME` is at row index 2. The value row is index 3 (immediately after). The 1-based row number is `3 + 1 = 4`, so the range is `A4:B4`. If this calculation were off by one, the function would overwrite the `INCOME` label itself or some other row.

**Test 41 matters because:** older month tabs may have been created before the INCOME section was added to the layout. The function silently exits rather than writing to the wrong place on those tabs.

---

### `deleteTransaction`

| # | Test | Setup | Input | Expected |
|---|---|---|---|---|
| 42 | Calls batchUpdate with the correct 0-based row range | `spreadsheets.get` returns `'Apr 2026'` with `sheetId: 7` | `tabName='Apr 2026'`, `rowIndex=15` (1-based) | `batchUpdate` called with `deleteDimension: { range: { sheetId: 7, dimension: 'ROWS', startIndex: 14, endIndex: 15 } }` |
| 43 | Throws when the month tab is not found | `spreadsheets.get` returns `'Mar 2026'` only | `tabName='Apr 2026'`, `rowIndex=15` | Rejects with `'Failed to delete transaction'` |

**Test 42 explained:** The `sheetId` in the range must be the numeric ID of the `'Apr 2026'` tab (7), not the spreadsheet ID. The `startIndex` is `rowIndex - 1 = 14` (0-based). If the wrong sheetId is used, the deletion targets the wrong tab entirely.

**Test 43 matters because:** if the tab is not found, `tabSheetId` would be `undefined` and the batchUpdate request would be malformed. The explicit throw prevents a silent mis-delete on a random tab.

---

### `readTransactions`

#### Tab row layout used in the tests

```
Row 0:  Apr 2026 Budget
Row 1:  (blank)
Row 2:  INCOME
Row 3:  5000, ''
Row 4:  (blank)
Row 5:  FIXED EXPENSES
Row 6:  Name, Amount, Note    (column header)
Row 7:  Rent, 2000, ''
Row 8:  (blank)
Row 9:  TRANSACTIONS          ← txnLabelIdx = 9
Row 10: Date, Amount, Category, Card, Note  (column header)
Row 11: 2026-04-01, 50, Groceries, Visa, lunch
Row 12: 2026-04-02, 30, Gas, Amex, ''
```

| # | Test | Expected |
|---|---|---|
| 44 | Parses transactions, income, and fixed expenses from month tabs | `monthTabKeys: ['2026-04']`; `monthConfigs['2026-04'].income: 5000`; `monthConfigs['2026-04'].fixedExpenses: [{name:'Rent', amount:2000, note:undefined}]`; 2 transactions (see below) |
| 45 | Skips transaction rows that have no date and no amount | 1 transaction (blank row not counted) |

**Transaction shape (test 44):**

The row number formula is `txnLabelIdx + 2 + dataIndex + 1`:
- First data row (index 0): `9 + 2 + 0 + 1 = 12`
- Second data row (index 1): `9 + 2 + 1 + 1 = 13`

```
transactions[0]: { id: 'Apr 2026|12', tab: 'Apr 2026', row: 12,
                   date: '2026-04-01', amount: 50,
                   category: 'Groceries', card: 'Visa', note: 'lunch' }

transactions[1]: { id: 'Apr 2026|13', tab: 'Apr 2026', row: 13,
                   date: '2026-04-02', amount: 30,
                   category: 'Gas', card: 'Amex', note: '' }
```

The `id` is `tab|row` and is the identifier used when calling `deleteTransaction`.

**Test 45 matters because:** deleted rows in Google Sheets leave blank rows inside the TRANSACTIONS section. Without the skip guard, those show up as `{ date: '', amount: 0 }` phantom transactions in the UI.

---

## File 3: `transactions.test.ts` — GET /api/transactions — 4 tests

`buildSheetsService` is mocked to return either a fake service object or an auth error. The actual route handler is called directly, and its `NextResponse` is inspected.

Default setup for each test:
- `buildSheetsService` returns a mock service
- `readConfig` returns `FULL_CONFIG` (`monthlyIncome: 5000`, `fixedExpenses: [{name:'Rent', amount:2000}]`)
- `ensurePastMonthTabs` resolves with `undefined`
- `readTransactions` resolves with `{ transactions: [], monthTabKeys: [], monthConfigs: {} }`

| # | Test | Setup override | Input | Expected |
|---|---|---|---|---|
| 46 | Returns 401 when auth fails | `buildSheetsService` returns `{ error: NextResponse(..., {status:401}) }` | Request with no auth header | HTTP 401 |
| 47 | Returns 400 when sheetId is missing | — | `GET /api/transactions` (no query param) | HTTP 400, body `error` contains `'sheetId'` |
| 48 | Calls all three service methods and returns the result | `readTransactions` returns `{ transactions:[], monthTabKeys:['2026-04'], monthConfigs:{} }` | `GET /api/transactions?sheetId=sheet123` | HTTP 200; body equals the `readTransactions` result; `readConfig('sheet123')` called; `ensurePastMonthTabs('sheet123', 5000, [{name:'Rent',amount:2000}])` called; `readTransactions('sheet123')` called |
| 49 | Returns 500 when the service throws | `readConfig` rejects with `new Error('API error')` | `GET /api/transactions?sheetId=sheet123` | HTTP 500 |

**Test 48 detail:** `ensurePastMonthTabs` receives the income and fixed expenses from the config result — not hardcoded values. This verifies the route correctly threads the output of `readConfig` into the arguments of `ensurePastMonthTabs`.

---

## File 4: `transactions.add.test.ts` — POST /api/transactions/add — 7 tests

| # | Test | Body | Expected |
|---|---|---|---|
| 50 | Returns 401 when auth fails | `{ sheetId, date, amount }` + no auth | HTTP 401 |
| 51 | Returns 400 when sheetId is missing | `{ date: '2026-05-10', amount: 50 }` | HTTP 400 |
| 52 | Returns 400 when date is missing | `{ sheetId: 'abc', amount: 50 }` | HTTP 400 |
| 53 | Returns 400 when amount is missing | `{ sheetId: 'abc', date: '2026-05-10' }` | HTTP 400 |
| 54 | Calls addTransaction with all fields | `{ sheetId:'sheet123', date:'2026-05-10', amount:50.5, category:'Groceries', card:'Visa', note:'lunch' }` | HTTP 200, `{ ok: true }`, `addTransaction('sheet123','2026-05-10',50.5,'Groceries','Visa','lunch')` called |
| 55 | Defaults optional fields to empty strings | `{ sheetId:'sheet123', date:'2026-05-10', amount:50 }` | `addTransaction('sheet123','2026-05-10',50,'','','')` called |
| 56 | Returns 500 when the service throws | `{ sheetId, date, amount }` + `addTransaction` rejects | HTTP 500 |

**Tests 51–53:** Each test removes exactly one of the three required fields. This verifies that each field is individually validated, not just the first one.

**Test 55 matters because:** `category`, `card`, and `note` are optional in the UI but the service always writes all five columns to the sheet. `undefined` would write nothing to a cell and shift the column structure; empty string preserves it.

---

## File 5: `config.test.ts` — GET /api/config — 4 tests

| # | Test | Setup | Input | Expected |
|---|---|---|---|---|
| 57 | Returns 401 when auth fails | `buildSheetsService` returns auth error | Request with no auth | HTTP 401 |
| 58 | Returns 400 when sheetId is missing | — | `GET /api/config` (no query param) | HTTP 400, body `error` contains `'sheetId'` |
| 59 | Returns config without incomeRowIndex | `readConfig` returns `FULL_CONFIG` (which includes `incomeRowIndex: 3`) | `GET /api/config?sheetId=sheet123` | HTTP 200; body does NOT contain `incomeRowIndex`; `monthlyIncome: 5000`; `categories: [{id:'18', name:'Groceries'}]`; `readConfig('sheet123')` called |
| 60 | Returns 500 when the service throws | `readConfig` rejects | `GET /api/config?sheetId=sheet123` | HTTP 500 |

**Test 59 detail:** `incomeRowIndex` is an internal implementation detail — it is the spreadsheet row number the service needs when overwriting the income cell. The frontend has no use for it, and exposing it would be confusing. The route strips it via destructuring (`const { incomeRowIndex: _, ...config } = await service.readConfig(sheetId)`) before returning the response. This test verifies that strip is actually happening.
