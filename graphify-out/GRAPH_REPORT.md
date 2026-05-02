# Graph Report - Budget  (2026-05-02)

## Corpus Check
- 25 files · ~23,435 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 108 nodes · 103 edges · 3 communities detected
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 4|Community 4]]

## God Nodes (most connected - your core abstractions)
1. `SheetsService` - 21 edges
2. `sectionDataEnd()` - 6 edges
3. `quoteSheet()` - 5 edges
4. `todayISO()` - 2 edges
5. `handleAdd()` - 2 edges
6. `getMonthLabel()` - 2 edges
7. `monthLabelToNum()` - 2 edges
8. `currentMonthLabel()` - 2 edges
9. `POST()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `currentMonthLabel()` --calls--> `POST()`  [INFERRED]
  /home/peterhuang/Budget/src/lib/google/sheets.ts → /home/peterhuang/Budget/src/app/api/config/update/route.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.19
Nodes (2): sectionDataEnd(), SheetsService

### Community 1 - "Community 1"
Cohesion: 0.19
Nodes (5): currentMonthLabel(), getMonthLabel(), monthLabelToNum(), quoteSheet(), POST()

### Community 4 - "Community 4"
Cohesion: 0.25
Nodes (2): handleAdd(), todayISO()

## Knowledge Gaps
- **Thin community `Community 0`** (16 nodes): `sectionDataEnd()`, `SheetsService`, `.addConfigItem()`, `.constructor()`, `.createBudgetSheet()`, `.deleteConfigItem()`, `.deleteFixedExpenseOverride()`, `.deleteMonthlyIncomeOverride()`, `.deleteTransaction()`, `.getConfigSheetNumericId()`, `.getSheetDetails()`, `.listSheets()`, `.setFixedExpenseOverride()`, `.setMonthlyIncomeOverride()`, `.updateConfigItem()`, `.validateSheet()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 4`** (9 nodes): `clearFilters()`, `CustomSelect()`, `fmt()`, `handleAdd()`, `handleDelete()`, `nextMonth()`, `prevMonth()`, `todayISO()`, `TransactionsTab.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SheetsService` connect `Community 0` to `Community 1`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._