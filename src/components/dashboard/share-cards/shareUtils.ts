import { Transaction } from '@/lib/store/useStore';

export interface CategoryTotal {
  name: string;
  amount: number;
}

export interface YearStats {
  topCategory: string;
  topAmount: number;
  topPct: number;
  biggestDay: number;
  biggestDayLabel: string;
  noSpendDays: number;
  totalTransactions: number;
  avgPerDay: number;
}

const CLAIM_TAG_RE = /\[←(\d{4}-\d{2})\]/;

function isExpense(t: Transaction) {
  return t.amount > 0 && !CLAIM_TAG_RE.test(t.note ?? '');
}

export function getCategoryTotals(transactions: Transaction[]): CategoryTotal[] {
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (!isExpense(t)) continue;
    const key = t.category || 'Other';
    map.set(key, (map.get(key) ?? 0) + t.amount);
  }
  return Array.from(map.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function getYearStats(transactions: Transaction[], year: number): YearStats {
  const yearTxns = transactions.filter((t) => {
    const y = Number(t.date.split('-')[0]);
    return y === year && isExpense(t);
  });

  const catMap = new Map<string, number>();
  const dayMap = new Map<string, number>();

  for (const t of yearTxns) {
    const key = t.category || 'Other';
    catMap.set(key, (catMap.get(key) ?? 0) + t.amount);
    dayMap.set(t.date, (dayMap.get(t.date) ?? 0) + t.amount);
  }

  const totalSpend = yearTxns.reduce((s, t) => s + t.amount, 0);

  let topCategory = '';
  let topAmount = 0;
  catMap.forEach((amt, cat) => {
    if (amt > topAmount) { topAmount = amt; topCategory = cat; }
  });

  let biggestDay = 0;
  let biggestDayDate = '';
  dayMap.forEach((amt, date) => {
    if (amt > biggestDay) { biggestDay = amt; biggestDayDate = date; }
  });

  let biggestDayLabel = '';
  if (biggestDayDate) {
    const d = new Date(biggestDayDate + 'T00:00:00');
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });
    biggestDayLabel = `${dayName} · ${monthName}`;
  }

  // Count days in the year with no spend transactions
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31);
  const today = new Date();
  const end = today < endOfYear ? today : endOfYear;
  let totalDays = 0;
  let noSpendDays = 0;
  const cur = new Date(startOfYear);
  while (cur <= end) {
    totalDays++;
    const iso = cur.toISOString().slice(0, 10);
    if (!dayMap.has(iso)) noSpendDays++;
    cur.setDate(cur.getDate() + 1);
  }

  const avgPerDay = totalDays > 0 ? totalSpend / totalDays : 0;

  return {
    topCategory,
    topAmount,
    topPct: totalSpend > 0 ? Math.round((topAmount / totalSpend) * 100) : 0,
    biggestDay,
    biggestDayLabel,
    noSpendDays,
    totalTransactions: yearTxns.length,
    avgPerDay,
  };
}

export interface YtdStats {
  totalSpend: number;
  monthlyAvg: number;
  topCategory: string;
  topAmount: number;
  totalTransactions: number;
  monthsTracked: number;
  bestMonth: string;
  bestMonthAmount: number;
}

export function getYtdStats(transactions: Transaction[], year: number, throughMonth: number): YtdStats {
  const txns = transactions.filter((t) => {
    const [y, m] = t.date.split('-').map(Number);
    return y === year && m - 1 <= throughMonth && isExpense(t);
  });

  const totalSpend = txns.reduce((s, t) => s + t.amount, 0);
  const monthsTracked = throughMonth + 1;
  const monthlyAvg = monthsTracked > 0 ? totalSpend / monthsTracked : 0;

  const catMap = new Map<string, number>();
  const monthMap = new Map<number, number>();
  for (const t of txns) {
    const cat = t.category || 'Other';
    catMap.set(cat, (catMap.get(cat) ?? 0) + t.amount);
    const m = Number(t.date.split('-')[1]) - 1;
    monthMap.set(m, (monthMap.get(m) ?? 0) + t.amount);
  }

  let topCategory = '';
  let topAmount = 0;
  catMap.forEach((amt, cat) => { if (amt > topAmount) { topAmount = amt; topCategory = cat; } });

  let bestMonth = '';
  let bestMonthAmount = Infinity;
  monthMap.forEach((amt, m) => {
    if (amt < bestMonthAmount) {
      bestMonthAmount = amt;
      bestMonth = new Date(year, m, 1).toLocaleString('default', { month: 'short' });
    }
  });
  if (bestMonthAmount === Infinity) bestMonthAmount = 0;

  return { totalSpend, monthlyAvg, topCategory, topAmount, totalTransactions: txns.length, monthsTracked, bestMonth, bestMonthAmount };
}

export function getNoSpendStreak(transactions: Transaction[]): number {
  const spendDays = new Set(
    transactions.filter(isExpense).map((t) => t.date)
  );

  const today = new Date();
  let streak = 0;
  const cur = new Date(today);
  // Start from yesterday (today might still be in progress)
  cur.setDate(cur.getDate() - 1);

  for (let i = 0; i < 365; i++) {
    const iso = cur.toISOString().slice(0, 10);
    if (spendDays.has(iso)) break;
    streak++;
    cur.setDate(cur.getDate() - 1);
  }

  return streak;
}

export function getDailySpend(
  transactions: Transaction[],
  year: number,
  month: number
): Record<number, number> {
  const result: Record<number, number> = {};
  for (const t of transactions) {
    if (!isExpense(t)) continue;
    const [y, m, d] = t.date.split('-').map(Number);
    if (y === year && m - 1 === month) {
      result[d] = (result[d] ?? 0) + t.amount;
    }
  }
  return result;
}
