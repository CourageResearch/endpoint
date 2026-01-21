import { NextResponse } from 'next/server'
import { syncTrials } from '@/lib/clinicaltrials'
import { checkAndResolveMarkets } from '@/lib/fda'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const syncResult = await syncTrials(2)
    const resolveResult = await checkAndResolveMarkets()

    return NextResponse.json({
      success: true,
      sync: syncResult,
      resolve: resolveResult
    })
  } catch (error) {
    console.error('Cron sync error:', error)
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    )
  }
}
