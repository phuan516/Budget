import { describe, it, expect } from 'vitest'
import {
  sectionDataEnd,
  quoteSheet,
  getMonthLabel,
  monthLabelToNum,
  monthLabelToKey,
  monthKeyToLabel,
  nextMonthKey,
} from '@/lib/google/sheets'

describe('quoteSheet', () => {
  it('wraps a normal name in single quotes', () => {
    expect(quoteSheet('Apr 2026')).toBe("'Apr 2026'")
  })

  it('escapes single quotes in the name', () => {
    expect(quoteSheet("Peter's Budget")).toBe("'Peter''s Budget'")
  })

  it('handles empty string', () => {
    expect(quoteSheet('')).toBe("''")
  })
})

describe('getMonthLabel', () => {
  it('returns Jan for month 01', () => {
    expect(getMonthLabel('2026-01-15')).toBe('Jan 2026')
  })

  it('returns Dec for month 12', () => {
    expect(getMonthLabel('2025-12-31')).toBe('Dec 2025')
  })

  it('returns correct label for mid-year', () => {
    expect(getMonthLabel('2024-07-04')).toBe('Jul 2024')
  })
})

describe('monthKeyToLabel / monthLabelToKey (round-trip)', () => {
  const cases = ['2026-01', '2026-12', '2025-04', '2024-07']

  it.each(cases)('round-trips %s', (key) => {
    expect(monthLabelToKey(monthKeyToLabel(key))).toBe(key)
  })

  it('converts key to label correctly', () => {
    expect(monthKeyToLabel('2026-04')).toBe('Apr 2026')
  })

  it('converts label to key correctly', () => {
    expect(monthLabelToKey('Apr 2026')).toBe('2026-04')
  })

  it('pads single-digit month with zero', () => {
    expect(monthLabelToKey('Jan 2026')).toBe('2026-01')
  })
})

describe('nextMonthKey', () => {
  it('increments mid-year month', () => {
    expect(nextMonthKey('2026-03')).toBe('2026-04')
  })

  it('rolls over from December to January of next year', () => {
    expect(nextMonthKey('2025-12')).toBe('2026-01')
  })

  it('increments November without rollover', () => {
    expect(nextMonthKey('2026-11')).toBe('2026-12')
  })
})

describe('monthLabelToNum', () => {
  it('Apr 2026 is greater than Mar 2026', () => {
    expect(monthLabelToNum('Apr 2026')).toBeGreaterThan(monthLabelToNum('Mar 2026'))
  })

  it('Jan 2027 is greater than Dec 2026', () => {
    expect(monthLabelToNum('Jan 2027')).toBeGreaterThan(monthLabelToNum('Dec 2026'))
  })

  it('same month same year returns same number', () => {
    expect(monthLabelToNum('Apr 2026')).toBe(monthLabelToNum('Apr 2026'))
  })
})

describe('sectionDataEnd', () => {
  it('stops at a blank row', () => {
    const rows = [['Groceries'], ['Rent'], [''], ['Gas']]
    expect(sectionDataEnd(rows, 0)).toBe(2)
  })

  it('stops at a CONFIG_SECTION_SET header', () => {
    const rows = [['Groceries'], ['Rent'], ['CATEGORIES'], ['Food']]
    expect(sectionDataEnd(rows, 0)).toBe(2)
  })

  it('stops at a lowercase section header (case-insensitive)', () => {
    const rows = [['Groceries'], ['cards'], ['Food']]
    expect(sectionDataEnd(rows, 0)).toBe(1)
  })

  it('runs to end of array when no stop condition', () => {
    const rows = [['Groceries'], ['Rent'], ['Gas']]
    expect(sectionDataEnd(rows, 0)).toBe(3)
  })

  it('respects the fromIdx offset', () => {
    const rows = [['INCOME'], ['5000'], [''], ['Rent']]
    expect(sectionDataEnd(rows, 1)).toBe(2)
  })

  it('returns fromIdx immediately when starting on a blank row', () => {
    const rows = [[''], ['Rent']]
    expect(sectionDataEnd(rows, 0)).toBe(0)
  })
})
