import type { Transaction, Config } from './store/useStore';

type MonthConfig = { income?: number; fixedExpenses: { name: string; amount: number }[] };

const CLAIM_RE = /\[←\d{4}-\d{2}\]/;

// Returns a map of monthKey → overspend carried INTO that month from all prior months.
// Chains forward: if March was $50 over, April starts $50 in debt; if April then goes $30 over,
// May starts $80 in debt, etc.
export function computeCarryOvers(
  monthKeys: string[],
  transactions: Transaction[],
  config: Config,
  monthConfigs: Record<string, MonthConfig>,
): Record<string, number> {
  const sorted = [...monthKeys].sort();
  const result: Record<string, number> = {};
  let running = 0;

  for (const key of sorted) {
    result[key] = running;

    const income = monthConfigs[key]?.income ?? config.monthlyIncome;
    if (income <= 0) { running = 0; continue; }

    const monthFEs = monthConfigs[key]?.fixedExpenses ?? [];
    const totalFixed = config.fixedExpenses.reduce((sum, fe) => {
      const ov = monthFEs.find(mfe => mfe.name === fe.name);
      return sum + (ov?.amount ?? fe.amount);
    }, 0);
    const totalSpent = transactions
      .filter(t => t.date.startsWith(key) && t.category !== 'Carry Over' && !CLAIM_RE.test(t.note ?? ''))
      .reduce((sum, t) => sum + t.amount, 0);

    running = Math.max(0, totalFixed + totalSpent + running - income);
  }

  return result;
}
