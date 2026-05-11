import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { GET } from '@/app/api/config/route'
import { buildSheetsService } from '@/lib/api/auth'

vi.mock('@/lib/api/auth', () => ({ buildSheetsService: vi.fn() }))

const mockBuildSheetsService = vi.mocked(buildSheetsService)

const mockService = {
  readConfig: vi.fn(),
}

const FULL_CONFIG = {
  categories: [{ id: '18', name: 'Groceries' }],
  cards: [{ id: '23', name: 'Visa' }],
  fixedExpenses: [{ id: '27', name: 'Rent', amount: 2000 }],
  monthlyIncome: 5000,
  monthlyIncomeOverrides: {},
  monthlyIncomeOverrideNotes: {},
  fixedExpenseOverrides: {},
  fixedExpenseOverrideNotes: {},
  savingGoals: [],
  incomeRowIndex: 3,
}

function makeAuthReq(url: string) {
  return new NextRequest(url, { headers: { authorization: 'Bearer fake-token' } })
}

describe('GET /api/config', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBuildSheetsService.mockReturnValue({ service: mockService as never })
  })

  it('returns 401 when auth fails', async () => {
    mockBuildSheetsService.mockReturnValue({
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    })

    const req = new NextRequest('http://localhost/api/config?sheetId=abc')
    const response = await GET(req)
    expect(response.status).toBe(401)
  })

  it('returns 400 when sheetId is missing', async () => {
    const req = makeAuthReq('http://localhost/api/config')
    const response = await GET(req)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/sheetId/)
  })

  it('returns config data without incomeRowIndex', async () => {
    mockService.readConfig.mockResolvedValue(FULL_CONFIG)

    const req = makeAuthReq('http://localhost/api/config?sheetId=sheet123')
    const response = await GET(req)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).not.toHaveProperty('incomeRowIndex')
    expect(body.monthlyIncome).toBe(5000)
    expect(body.categories).toEqual([{ id: '18', name: 'Groceries' }])
    expect(mockService.readConfig).toHaveBeenCalledWith('sheet123')
  })

  it('returns 500 when the service throws', async () => {
    mockService.readConfig.mockRejectedValue(new Error('Sheet API error'))

    const req = makeAuthReq('http://localhost/api/config?sheetId=sheet123')
    const response = await GET(req)
    expect(response.status).toBe(500)
  })
})
