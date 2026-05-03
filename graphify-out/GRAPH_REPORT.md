# Graph Report - Budget  (2026-05-02)

## Corpus Check
- 25 files · ~23,172 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 121 nodes · 128 edges · 4 communities detected
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 4|Community 4]]

## God Nodes (most connected - your core abstractions)
1. `SheetsService` - 27 edges
2. `sectionDataEnd()` - 8 edges
3. `quoteSheet()` - 7 edges
4. `monthKeyToLabel()` - 3 edges
5. `POST()` - 3 edges
6. `getMonthLabel()` - 2 edges
7. `monthLabelToNum()` - 2 edges
8. `currentMonthLabel()` - 2 edges
9. `nextMonthKey()` - 2 edges
10. `getPastMonthKeys()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `currentMonthLabel()` --calls--> `POST()`  [INFERRED]
  src/lib/google/sheets.ts → src/app/api/config/update/route.ts
- `monthKeyToLabel()` --calls--> `POST()`  [INFERRED]
  src/lib/google/sheets.ts → src/app/api/config/update/route.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.13
Nodes (7): currentMonthLabel(), getMonthLabel(), monthKeyToLabel(), monthLabelToNum(), nextMonthKey(), quoteSheet(), POST()

### Community 1 - "Community 1"
Cohesion: 0.19
Nodes (2): sectionDataEnd(), SheetsService

### Community 2 - "Community 2"
Cohesion: 0.17
Nodes (2): getPastMonthKeys(), handleSetIncome()

### Community 4 - "Community 4"
Cohesion: 0.25
Nodes (2): handleAdd(), todayISO()

## Knowledge Gaps
- **Thin community `Community 1`** (18 nodes): `sectionDataEnd()`, `SheetsService`, `.addConfigItem()`, `.constructor()`, `.createBudgetSheet()`, `.deleteConfigItem()`, `.deleteFixedExpenseOverride()`, `.deleteMonthlyIncomeOverride()`, `.deleteTransaction()`, `.getConfigSheetNumericId()`, `.getSheetDetails()`, `.listSheets()`, `.setFixedExpenseOverride()`, `.setManyFixedExpenseOverrides()`, `.setManyMonthlyIncomeOverrides()`, `.setMonthlyIncomeOverride()`, `.updateConfigItem()`, `.validateSheet()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 2`** (13 nodes): `getPastMonthKeys()`, `handleAddTransaction()`, `handleConfigAdd()`, `handleConfigDelete()`, `handleConfigEdit()`, `handleDeleteFixedExpenseOverride()`, `handleDeleteMonthlyIncomeOverride()`, `handleDeleteTransaction()`, `handleSetFixedExpenseOverride()`, `handleSetIncome()`, `handleSetMonthlyIncomeOverride()`, `onDown()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 4`** (9 nodes): `clearFilters()`, `fmt()`, `handleAdd()`, `handleDelete()`, `nextMonth()`, `onDown()`, `prevMonth()`, `todayISO()`, `TransactionsTab.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SheetsService` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `POST()` (e.g. with `currentMonthLabel()` and `monthKeyToLabel()`) actually correct?**
  _`POST()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._