import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { POST } from '@/app/api/transactions/add/route'
import { buildSheetsService } from '@/lib/api/auth'

vi.mock('@/lib/api/auth', () => ({ buildSheetsService: vi.fn() }))

const mockBuildSheetsService = vi.mocked(buildSheetsService)

const mockService = {
  addTransaction: vi.fn(),
}

function makeReq(body: object) {
  return new NextRequest('http://localhost/api/transactions/add', {
    method: 'POST',
    headers: { authorization: 'Bearer fake-token', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/transactions/add', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBuildSheetsService.mockReturnValue({ service: mockService as never })
    mockService.addTransaction.mockResolvedValue(undefined)
  })

  it('returns 401 when auth fails', async () => {
    mockBuildSheetsService.mockReturnValue({
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    })

    const req = makeReq({ sheetId: 'abc', date: '2026-05-10', amount: 50 })
    const response = await POST(req)
    expect(response.status).toBe(401)
  })

  it('returns 400 when sheetId is missing', async () => {
    const req = makeReq({ date: '2026-05-10', amount: 50 })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('returns 400 when date is missing', async () => {
    const req = makeReq({ sheetId: 'abc', amount: 50 })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('returns 400 when amount is missing', async () => {
    const req = makeReq({ sheetId: 'abc', date: '2026-05-10' })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('calls addTransaction with all fields and returns 200', async () => {
    const req = makeReq({
      sheetId: 'sheet123',
      date: '2026-05-10',
      amount: 50.5,
      category: 'Groceries',
      card: 'Visa',
      note: 'lunch',
    })
    const response = await POST(req)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(mockService.addTransaction).toHaveBeenCalledWith(
      'sheet123', '2026-05-10', 50.5, 'Groceries', 'Visa', 'lunch'
    )
  })

  it('defaults optional fields to empty strings when not provided', async () => {
    const req = makeReq({ sheetId: 'sheet123', date: '2026-05-10', amount: 50 })
    await POST(req)

    expect(mockService.addTransaction).toHaveBeenCalledWith(
      'sheet123', '2026-05-10', 50, '', '', ''
    )
  })

  it('returns 500 when the service throws', async () => {
    mockService.addTransaction.mockRejectedValue(new Error('Sheets API error'))

    const req = makeReq({ sheetId: 'sheet123', date: '2026-05-10', amount: 50 })
    const response = await POST(req)
    expect(response.status).toBe(500)
  })
})
