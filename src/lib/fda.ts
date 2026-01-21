import { prisma } from './prisma'

const OPENFDA_API = 'https://api.fda.gov/drug'

type DrugApproval = {
  application_number: string
  sponsor_name: string
  products: Array<{
    brand_name: string
    active_ingredients: Array<{
      name: string
    }>
  }>
  submissions: Array<{
    submission_type: string
    submission_status: string
    submission_status_date: string
  }>
}

type OpenFDAResponse = {
  results: DrugApproval[]
  meta: {
    results: {
      total: number
    }
  }
}

/**
 * Search openFDA for drug approvals
 */
export async function searchDrugApprovals(
  drugName: string,
  sponsor?: string
): Promise<DrugApproval[]> {
  const searchTerms = [`products.brand_name:"${drugName}"`]

  if (sponsor) {
    searchTerms.push(`sponsor_name:"${sponsor}"`)
  }

  const params = new URLSearchParams({
    search: searchTerms.join('+AND+'),
    limit: '10'
  })

  const response = await fetch(`${OPENFDA_API}/drugsfda.json?${params}`)

  if (!response.ok) {
    if (response.status === 404) return []
    throw new Error(`openFDA API error: ${response.status}`)
  }

  const data: OpenFDAResponse = await response.json()
  return data.results || []
}

/**
 * Check if a drug has been approved
 */
export async function checkDrugApproval(
  drugName: string,
  sponsor?: string
): Promise<{ approved: boolean; approvalDate?: Date }> {
  const approvals = await searchDrugApprovals(drugName, sponsor)

  for (const approval of approvals) {
    for (const submission of approval.submissions) {
      if (
        submission.submission_type === 'ORIG' &&
        submission.submission_status === 'AP'
      ) {
        return {
          approved: true,
          approvalDate: new Date(submission.submission_status_date)
        }
      }
    }
  }

  return { approved: false }
}

/**
 * Check for recent FDA approvals and auto-resolve markets
 */
export async function checkAndResolveMarkets(): Promise<{
  checked: number
  resolved: number
}> {
  let checked = 0
  let resolved = 0

  const openMarkets = await prisma.market.findMany({
    where: { status: 'OPEN' },
    include: { trial: true }
  })

  for (const market of openMarkets) {
    checked++

    const trial = market.trial
    const interventions = trial.interventions
    if (!interventions.length) continue

    for (const intervention of interventions) {
      try {
        const result = await checkDrugApproval(intervention, trial.sponsor || undefined)

        if (result.approved) {
          await prisma.$transaction(async (tx) => {
            const positions = await tx.position.findMany({
              where: { marketId: market.id }
            })

            for (const position of positions) {
              if (position.yesShares > 0) {
                await tx.user.update({
                  where: { id: position.userId },
                  data: { balance: { increment: position.yesShares } }
                })
              }
            }

            await tx.market.update({
              where: { id: market.id },
              data: {
                status: 'RESOLVED',
                resolvedOutcome: 'YES',
                resolvedAt: result.approvalDate || new Date()
              }
            })
          })

          resolved++
          break
        }
      } catch (error) {
        console.error(`Error checking approval for ${intervention}:`, error)
      }

      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  return { checked, resolved }
}

/**
 * Get recent FDA drug approvals
 */
export async function getRecentApprovals(limit: number = 20): Promise<DrugApproval[]> {
  const params = new URLSearchParams({
    search: 'submissions.submission_type:ORIG+AND+submissions.submission_status:AP',
    sort: 'submissions.submission_status_date:desc',
    limit: String(limit)
  })

  const response = await fetch(`${OPENFDA_API}/drugsfda.json?${params}`)

  if (!response.ok) {
    throw new Error(`openFDA API error: ${response.status}`)
  }

  const data: OpenFDAResponse = await response.json()
  return data.results || []
}
