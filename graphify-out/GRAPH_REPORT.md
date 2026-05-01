# Graph Report - /home/peter/Budget  (2026-05-01)

## Corpus Check
- Corpus is ~18,201 words - fits in a single context window. You may not need a graph.

## Summary
- 122 nodes · 118 edges · 8 communities detected
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.83)
- Token cost: 12,800 input · 2,100 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Google Sheets Service|Google Sheets Service]]
- [[_COMMUNITY_Dashboard Display|Dashboard Display]]
- [[_COMMUNITY_Dashboard Page Logic|Dashboard Page Logic]]
- [[_COMMUNITY_Sheet Selection Flow|Sheet Selection Flow]]
- [[_COMMUNITY_Transaction Filters|Transaction Filters]]
- [[_COMMUNITY_Build Config|Build Config]]
- [[_COMMUNITY_Amount List UI|Amount List UI]]
- [[_COMMUNITY_Root Layout Spec|Root Layout Spec]]

## God Nodes (most connected - your core abstractions)
1. `SheetsService` - 16 edges
2. `DashboardPage Component` - 11 edges
3. `Ledger App Specification` - 9 edges
4. `quoteSheet()` - 5 edges
5. `SettingsTab Component` - 5 edges
6. `SheetSelector Component` - 4 edges
7. `OverviewTab Component` - 4 edges
8. `TransactionsTab Component` - 4 edges
9. `Transaction Data Model` - 4 edges
10. `SheetSelectionPage Component` - 3 edges

## Surprising Connections (you probably didn't know these)
- `BudgetStore Zustand State Shape` --shares_data_with--> `DashboardPage Component`  [INFERRED]
  SPEC.md → src/app/dashboard/page.tsx
- `Config Data Model` --shares_data_with--> `SettingsTab Component`  [INFERRED]
  SPEC.md → src/components/dashboard/SettingsTab.tsx
- `Transaction Data Model` --shares_data_with--> `TransactionsTab Component`  [INFERRED]
  SPEC.md → src/components/dashboard/TransactionsTab.tsx
- `Transaction Data Model` --shares_data_with--> `OverviewTab Component`  [INFERRED]
  SPEC.md → src/components/dashboard/OverviewTab.tsx
- `savingGoalProgress Computed Value` --conceptually_related_to--> `Overspending Carry-Over Feature`  [INFERRED]
  src/components/dashboard/OverviewTab.tsx → SPEC.md

## Hyperedges (group relationships)
- **Dashboard Tab Rendering Flow** — dashboard_dashboardpage, overviewtab_overviewtab, transactionstab_transactionstab, settingstab_settingstab [EXTRACTED 1.00]
- **Carry-Over Overspend Mutation Flow** — dashboard_handleaddtransaction, dashboard_handledeletetransaction, dashboard_carryover, spec_carryover_feature [INFERRED 0.90]
- **Sheet Selection User Flow** — sheetselect_sheetselectionpage, sheetselector_sheetselector, sheetselect_handleselectsheet, sheetselect_handlecreatenew [EXTRACTED 1.00]

## Communities

### Community 0 - "Google Sheets Service"
Cohesion: 0.15
Nodes (4): getMonthLabel(), quoteSheet(), sectionDataEnd(), SheetsService

### Community 1 - "Dashboard Display"
Cohesion: 0.17
Nodes (15): categoryData Computed Value, OverviewTab Component, savingGoalProgress Computed Value, GoogleG SVG Icon Component, LandingPage Component, Ledger README, Client-Side OAuth Implicit Flow Design, BudgetStore Zustand State Shape (+7 more)

### Community 2 - "Dashboard Page Logic"
Cohesion: 0.19
Nodes (13): Carry Over Overspend Logic, DashboardPage Component, handleAddTransaction Function, handleConfigAdd Function, handleConfigDelete Function, handleDeleteTransaction Function, handleSetIncome Function, loadConfig Function (+5 more)

### Community 3 - "Sheet Selection Flow"
Cohesion: 0.2
Nodes (11): handleCreateNew Function, handleSelectSheet Function, SheetSelectionPage Component, loadSheets Function, MiniSheetPreview Component, OwnerFilter Type (all|mine|shared), SheetSelector Component, SheetsIcon SVG Component (+3 more)

### Community 4 - "Transaction Filters"
Cohesion: 0.25
Nodes (2): handleAdd(), todayISO()

### Community 25 - "Build Config"
Cohesion: 1.0
Nodes (1): PostCSS Config

### Community 26 - "Amount List UI"
Cohesion: 1.0
Nodes (1): AmountListSection Component

### Community 27 - "Root Layout Spec"
Cohesion: 1.0
Nodes (1): RootLayout Component

## Knowledge Gaps
- **13 isolated node(s):** `PostCSS Config`, `SheetsIcon SVG Component`, `MiniSheetPreview Component`, `NameListSection Component`, `AmountListSection Component` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Transaction Filters`** (9 nodes): `clearFilters()`, `CustomSelect()`, `fmt()`, `handleAdd()`, `handleDelete()`, `nextMonth()`, `prevMonth()`, `todayISO()`, `TransactionsTab.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Build Config`** (1 nodes): `PostCSS Config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Amount List UI`** (1 nodes): `AmountListSection Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Root Layout Spec`** (1 nodes): `RootLayout Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DashboardPage Component` connect `Dashboard Page Logic` to `Dashboard Display`, `Sheet Selection Flow`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `TransactionsTab Component` connect `Sheet Selection Flow` to `Dashboard Display`, `Dashboard Page Logic`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `PostCSS Config`, `SheetsIcon SVG Component`, `MiniSheetPreview Component` to the rest of the system?**
  _13 weakly-connected nodes found - possible documentation gaps or missing edges._