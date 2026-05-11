import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { GET } from '@/app/api/transactions/route'
import { buildSheetsService } from '@/lib/api/auth'

vi.mock('@/lib/api/auth', () => ({ buildSheetsService: vi.fn() }))

const mockBuildSheetsService = vi.mocked(buildSheetsService)

const mockService = {
  readConfig: vi.fn(),
  ensurePastMonthTabs: vi.fn(),
  readTransactions: vi.fn(),
}

const FULL_CONFIG = {
  monthlyIncome: 5000,
  fixedExpenses: [{ name: 'Rent', amount: 2000 }],
  categories: [],
  cards: [],
  savingGoals: [],
  monthlyIncomeOverrides: {},
  monthlyIncomeOverrideNotes: {},
  fixedExpenseOverrides: {},
  fixedExpenseOverrideNotes: {},
  incomeRowIndex: 3,
}

function makeAuthReq(url: string) {
  return new NextRequest(url, { headers: { authorization: 'Bearer fake-token' } })
}

describe('GET /api/transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBuildSheetsService.mockReturnValue({ service: mockService as never })
    mockService.readConfig.mockResolvedValue(FULL_CONFIG)
    mockService.ensurePastMonthTabs.mockResolvedValue(undefined)
    mockService.readTransactions.mockResolvedValue({ transactions: [], monthTabKeys: [], monthConfigs: {} })
  })

  it('returns 401 when auth fails', async () => {
    mockBuildSheetsService.mockReturnValue({
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    })

    const req = new NextRequest('http://localhost/api/transactions?sheetId=abc')
    const response = await GET(req)
    expect(response.status).toBe(401)
  })

  it('returns 400 when sheetId is missing', async () => {
    const req = makeAuthReq('http://localhost/api/transactions')
    const response = await GET(req)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/sheetId/)
  })

  it('calls readConfig, ensurePastMonthTabs, and readTransactions with the sheetId', async () => {
    const txnResult = { transactions: [], monthTabKeys: ['2026-04'], monthConfigs: {} }
    mockService.readTransactions.mockResolvedValue(txnResult)

    const req = makeAuthReq('http://localhost/api/transactions?sheetId=sheet123')
    const response = await GET(req)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(txnResult)
    expect(mockService.readConfig).toHaveBeenCalledWith('sheet123')
    expect(mockService.ensurePastMonthTabs).toHaveBeenCalledWith(
      'sheet123',
      FULL_CONFIG.monthlyIncome,
      FULL_CONFIG.fixedExpenses,
    )
    expect(mockService.readTransactions).toHaveBeenCalledWith('sheet123')
  })

  it('returns 500 when the service throws', async () => {
    mockService.readConfig.mockRejectedValue(new Error('API error'))

    const req = makeAuthReq('http://localhost/api/transactions?sheetId=sheet123')
    const response = await GET(req)
    expect(response.status).toBe(500)
  })
})
