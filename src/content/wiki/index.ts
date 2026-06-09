export interface NavItem {
  title: string;
  slug: string;
  section: string;
  order: number;
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    group: 'Getting started',
    items: [
      { title: 'What is Ledger',   slug: 'what-is-ledger',   section: 'getting-started', order: 1 },
      { title: 'Creating a sheet', slug: 'creating-a-sheet', section: 'getting-started', order: 2 },
      { title: 'Your first entry', slug: 'your-first-entry', section: 'getting-started', order: 3 },
    ],
  },
  {
    group: 'Tracking',
    items: [
      { title: 'Adding transactions',  slug: 'adding-transactions',  section: 'tracking', order: 1 },
      { title: 'Categories',           slug: 'smart-parse',          section: 'tracking', order: 2 },
      { title: 'Editing transactions', slug: 'editing-transactions', section: 'tracking', order: 3 },
    ],
  },
  {
    group: 'Money',
    items: [
      { title: 'Income controls', slug: 'income-controls', section: 'money', order: 1 },
      { title: 'Budgets & caps',  slug: 'budgets-caps',    section: 'money', order: 2 },
    ],
  },
  {
    group: 'Sharing',
    items: [
      { title: 'Share cards',     slug: 'share-cards',   section: 'sharing', order: 1 },
      { title: 'Export & backup', slug: 'export-backup', section: 'sharing', order: 2 },
    ],
  },
];

// Flat list for search indexing and slug lookups
export const ALL_ARTICLES: NavItem[] = NAV.flatMap((g) => g.items);

export function findArticle(section: string, slug: string): NavItem | undefined {
  return ALL_ARTICLES.find((a) => a.section === section && a.slug === slug);
}
