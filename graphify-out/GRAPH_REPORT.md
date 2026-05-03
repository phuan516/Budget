# Graph Report - Budget  (2026-05-02)

## Corpus Check
- 25 files · ~21,965 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 114 nodes · 116 edges · 4 communities detected
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 4|Community 4]]

## God Nodes (most connected - your core abstractions)
1. `SheetsService` - 23 edges
2. `sectionDataEnd()` - 8 edges
3. `quoteSheet()` - 5 edges
4. `getPastMonthKeys()` - 4 edges
5. `getMonthLabel()` - 2 edges
6. `monthLabelToNum()` - 2 edges
7. `currentMonthLabel()` - 2 edges
8. `handleConfigAdd()` - 2 edges
9. `handleConfigEdit()` - 2 edges
10. `handleSetIncome()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `currentMonthLabel()` --calls--> `POST()`  [INFERRED]
  src/lib/google/sheets.ts → src/app/api/config/update/route.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.19
Nodes (2): sectionDataEnd(), SheetsService

### Community 1 - "Community 1"
Cohesion: 0.19
Nodes (5): currentMonthLabel(), getMonthLabel(), monthLabelToNum(), quoteSheet(), POST()

### Community 2 - "Community 2"
Cohesion: 0.19
Nodes (4): getPastMonthKeys(), handleConfigAdd(), handleConfigEdit(), handleSetIncome()

### Community 4 - "Community 4"
Cohesion: 0.25
Nodes (2): handleAdd(), todayISO()

## Knowledge Gaps
- **Thin community `Community 0`** (18 nodes): `sectionDataEnd()`, `SheetsService`, `.addConfigItem()`, `.constructor()`, `.createBudgetSheet()`, `.deleteConfigItem()`, `.deleteFixedExpenseOverride()`, `.deleteMonthlyIncomeOverride()`, `.deleteTransaction()`, `.getConfigSheetNumericId()`, `.getSheetDetails()`, `.listSheets()`, `.setFixedExpenseOverride()`, `.setManyFixedExpenseOverrides()`, `.setManyMonthlyIncomeOverrides()`, `.setMonthlyIncomeOverride()`, `.updateConfigItem()`, `.validateSheet()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 4`** (9 nodes): `clearFilters()`, `fmt()`, `handleAdd()`, `handleDelete()`, `nextMonth()`, `onDown()`, `prevMonth()`, `todayISO()`, `TransactionsTab.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SheetsService` connect `Community 0` to `Community 1`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `sectionDataEnd()` connect `Community 0` to `Community 1`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._