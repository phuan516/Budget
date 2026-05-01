# Graph Report - .  (2026-05-01)

## Corpus Check
- Corpus is ~20,716 words - fits in a single context window. You may not need a graph.

## Summary
- 154 nodes · 159 edges · 19 communities detected
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Google Sheets Data Layer|Google Sheets Data Layer]]
- [[_COMMUNITY_Settings & Budget UI|Settings & Budget UI]]
- [[_COMMUNITY_App Routes & Pages|App Routes & Pages]]
- [[_COMMUNITY_Transaction Tab Utilities|Transaction Tab Utilities]]
- [[_COMMUNITY_Sheet Selection & Auth|Sheet Selection & Auth]]
- [[_COMMUNITY_Project Docs & Spec|Project Docs & Spec]]
- [[_COMMUNITY_Transaction Write Pipeline|Transaction Write Pipeline]]
- [[_COMMUNITY_Google Identity Types|Google Identity Types]]
- [[_COMMUNITY_Config Update Route|Config Update Route]]
- [[_COMMUNITY_Module 24|Module 24]]
- [[_COMMUNITY_Module 30|Module 30]]
- [[_COMMUNITY_Module 31|Module 31]]
- [[_COMMUNITY_Module 32|Module 32]]
- [[_COMMUNITY_Module 33|Module 33]]
- [[_COMMUNITY_Module 34|Module 34]]
- [[_COMMUNITY_Module 35|Module 35]]
- [[_COMMUNITY_Module 36|Module 36]]
- [[_COMMUNITY_Module 37|Module 37]]
- [[_COMMUNITY_Module 38|Module 38]]

## God Nodes (most connected - your core abstractions)
1. `SheetsService` - 19 edges
2. `Config Interface` - 7 edges
3. `DashboardPage Component` - 7 edges
4. `Transaction Interface` - 6 edges
5. `useStore Hook` - 6 edges
6. `useGoogleOAuth Hook` - 6 edges
7. `SettingsTab Component` - 6 edges
8. `quoteSheet()` - 5 edges
9. `SheetSelectionPage Component` - 5 edges
10. `POST /api/transactions/add Route` - 5 edges

## Surprising Connections (you probably didn't know these)
- `TransactionsTab Component` --shares_data_with--> `Config Tab Google Sheet Structure`  [INFERRED]
  src/components/dashboard/TransactionsTab.tsx → SPEC.md
- `Bearer Token Auth Pattern` --conceptually_related_to--> `GET /api/sheets/details`  [EXTRACTED]
  SPEC.md → src/app/api/sheets/details/route.ts
- `Bearer Token Auth Pattern` --conceptually_related_to--> `POST /api/sheets/select`  [EXTRACTED]
  SPEC.md → src/app/api/sheets/select/route.ts
- `Bearer Token Auth Pattern` --conceptually_related_to--> `POST /api/config/update`  [EXTRACTED]
  SPEC.md → src/app/api/config/update/route.ts
- `Bearer Token Auth Pattern` --conceptually_related_to--> `GET()`  [EXTRACTED]
  SPEC.md → src/app/api/config/route.ts

## Hyperedges (group relationships)
- **Google OAuth Authentication Flow** — usegoogleoauth_usegoogleoauth, page_landingpage, usestore_budgetstore [INFERRED 0.85]
- **Transaction CRUD Pipeline (UI to API to SheetsService)** — dashboard_dashboardpage, api_transactions_add, api_transactions_delete, api_transactions_get, sheets_sheetsservice [EXTRACTED 0.95]
- **Budget State Sync (Store and Google Sheets)** — usestore_budgetstore, sheets_readconfig, sheets_readtransactions, dashboard_dashboardpage [INFERRED 0.85]
- **All API Routes share SheetsService + OAuth2 instantiation pattern** — sheets_details_route_get, sheets_select_route_post, sheets_list_route_get, config_route_get, config_update_route_post, sheets_service_sheetsservice [INFERRED 0.90]
- **Dashboard tabs consume Config and Transaction data from Zustand store** — overviewtab_component, transactionstab_component, settingstab_component, usestore_config, usestore_transaction [INFERRED 0.88]
- **SettingsTab sub-sections implement add/edit/delete CRUD pattern against config types** — namelistsection_component, fixedexpensesection_component, savinggoalsection_component, config_update_route_post [INFERRED 0.85]

## Communities

### Community 0 - "Google Sheets Data Layer"
Cohesion: 0.13
Nodes (5): getMonthLabel(), monthLabelToNum(), quoteSheet(), sectionDataEnd(), SheetsService

### Community 1 - "Settings & Budget UI"
Cohesion: 0.21
Nodes (15): POST /api/config/update, CustomSelect Component (inline), FixedExpenseSection Component, NameListSection Component, OverviewTab Component, SavingGoalSection Component, SettingsTab Component, Carry-Over Budget Logic (+7 more)

### Community 2 - "App Routes & Pages"
Cohesion: 0.23
Nodes (15): POST /api/sheets/create Route, POST /api/transactions/add Route, POST /api/transactions/delete Route, GET /api/transactions Route, DashboardPage Component, LandingPage Component, SheetsService.createBudgetSheet, SheetsService.deleteTransaction (+7 more)

### Community 5 - "Transaction Tab Utilities"
Cohesion: 0.25
Nodes (2): handleAdd(), todayISO()

### Community 6 - "Sheet Selection & Auth"
Cohesion: 0.38
Nodes (6): Bearer Token Auth Pattern, GET(), GET /api/sheets/details, GET /api/sheets/list, POST /api/sheets/select, SheetSelector Component

### Community 7 - "Project Docs & Spec"
Cohesion: 0.5
Nodes (5): Config Tab Google Sheet Structure, Ledger App — Google Sheets Budget Tracker, Month Tab Google Sheet Structure, Ledger README, Ledger Project Specification

### Community 9 - "Transaction Write Pipeline"
Cohesion: 0.5
Nodes (4): SheetsService.addTransaction, SheetsService.createMonthSheet (private), SheetsService.readConfig, SheetsService.syncFixedExpensesToAllMonthSheets

### Community 10 - "Google Identity Types"
Cohesion: 0.5
Nodes (4): Google Identity Type Declarations, GoogleIdentity Interface, TokenClient Interface, TokenResponse Interface

### Community 12 - "Config Update Route"
Cohesion: 0.67
Nodes (2): currentMonthLabel(), POST()

### Community 24 - "Module 24"
Cohesion: 1.0
Nodes (2): SheetsService.deleteConfigItem, SheetsService.deleteMonthlyIncomeOverride

### Community 30 - "Module 30"
Cohesion: 1.0
Nodes (1): Next.js Config

### Community 31 - "Module 31"
Cohesion: 1.0
Nodes (1): PostCSS Tailwind CSS Config

### Community 32 - "Module 32"
Cohesion: 1.0
Nodes (1): SheetsService.listSheets

### Community 33 - "Module 33"
Cohesion: 1.0
Nodes (1): SheetsService.validateSheet

### Community 34 - "Module 34"
Cohesion: 1.0
Nodes (1): SheetsService.getSheetDetails

### Community 35 - "Module 35"
Cohesion: 1.0
Nodes (1): SheetsService.addConfigItem

### Community 36 - "Module 36"
Cohesion: 1.0
Nodes (1): SheetsService.updateConfigItem

### Community 37 - "Module 37"
Cohesion: 1.0
Nodes (1): SheetsService.setMonthlyIncomeOverride

### Community 38 - "Module 38"
Cohesion: 1.0
Nodes (1): RootLayout Component

## Knowledge Gaps
- **25 isolated node(s):** `Next.js Config`, `PostCSS Tailwind CSS Config`, `SelectedSheet Interface`, `DashboardTab Type`, `GoogleUser Interface` (+20 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Transaction Tab Utilities`** (9 nodes): `clearFilters()`, `CustomSelect()`, `fmt()`, `handleAdd()`, `handleDelete()`, `nextMonth()`, `prevMonth()`, `todayISO()`, `TransactionsTab.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Config Update Route`** (3 nodes): `currentMonthLabel()`, `route.ts`, `POST()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 24`** (2 nodes): `SheetsService.deleteConfigItem`, `SheetsService.deleteMonthlyIncomeOverride`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 30`** (1 nodes): `Next.js Config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 31`** (1 nodes): `PostCSS Tailwind CSS Config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 32`** (1 nodes): `SheetsService.listSheets`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 33`** (1 nodes): `SheetsService.validateSheet`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 34`** (1 nodes): `SheetsService.getSheetDetails`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 35`** (1 nodes): `SheetsService.addConfigItem`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 36`** (1 nodes): `SheetsService.updateConfigItem`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 37`** (1 nodes): `SheetsService.setMonthlyIncomeOverride`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 38`** (1 nodes): `RootLayout Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Config Interface` connect `Settings & Budget UI` to `Transaction Write Pipeline`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `DashboardPage Component` connect `App Routes & Pages` to `Settings & Budget UI`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Config Interface` (e.g. with `Transaction Interface` and `Carry-Over Budget Logic`) actually correct?**
  _`Config Interface` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `DashboardPage Component` (e.g. with `Carry-Over Budget Logic` and `SheetSelectionPage Component`) actually correct?**
  _`DashboardPage Component` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `Transaction Interface` (e.g. with `Config Interface` and `Carry-Over Budget Logic`) actually correct?**
  _`Transaction Interface` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Next.js Config`, `PostCSS Tailwind CSS Config`, `SelectedSheet Interface` to the rest of the system?**
  _25 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Google Sheets Data Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._