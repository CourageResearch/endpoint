import { prisma } from './prisma'

const CLINICAL_TRIALS_API = 'https://clinicaltrials.gov/api/v2'

type ClinicalTrialStudy = {
  protocolSection: {
    identificationModule: {
      nctId: string
      briefTitle: string
      officialTitle?: string
    }
    statusModule: {
      overallStatus: string
      startDateStruct?: { date: string }
      completionDateStruct?: { date: string }
    }
    sponsorCollaboratorsModule?: {
      leadSponsor?: { name: string }
    }
    conditionsModule?: {
      conditions?: string[]
    }
    armsInterventionsModule?: {
      interventions?: Array<{ name: string }>
    }
    designModule?: {
      phases?: string[]
    }
  }
}

type SearchResponse = {
  studies: ClinicalTrialStudy[]
  nextPageToken?: string
}

/**
 * Fetch Phase 3 clinical trials from ClinicalTrials.gov
 */
export async function fetchPhase3Trials(
  pageToken?: string
): Promise<SearchResponse> {
  const params = new URLSearchParams({
    'query.term': 'AREA[Phase]Phase 3',
    'filter.overallStatus': 'RECRUITING,ACTIVE_NOT_RECRUITING,ENROLLING_BY_INVITATION,NOT_YET_RECRUITING',
    'pageSize': '50',
    'fields': 'NCTId,BriefTitle,OfficialTitle,OverallStatus,StartDate,CompletionDate,LeadSponsorName,Condition,InterventionName,Phase'
  })

  if (pageToken) {
    params.set('pageToken', pageToken)
  }

  const response = await fetch(`${CLINICAL_TRIALS_API}/studies?${params}`)

  if (!response.ok) {
    throw new Error(`ClinicalTrials.gov API error: ${response.status}`)
  }

  return response.json()
}

/**
 * Parse a date string from the API
 */
function parseDate(dateStr?: string): Date | null {
  if (!dateStr) return null
  try {
    return new Date(dateStr)
  } catch {
    return null
  }
}

/**
 * Sync trials from ClinicalTrials.gov to database
 */
export async function syncTrials(maxPages: number = 5): Promise<{
  created: number
  updated: number
  marketsCreated: number
  marketsClosed: number
}> {
  let created = 0
  let updated = 0
  let marketsCreated = 0
  let marketsClosed = 0
  let pageToken: string | undefined

  for (let page = 0; page < maxPages; page++) {
    const data = await fetchPhase3Trials(pageToken)

    for (const study of data.studies) {
      const protocol = study.protocolSection
      const nctId = protocol.identificationModule.nctId
      const title = protocol.identificationModule.briefTitle

      const conditions = protocol.conditionsModule?.conditions || []
      const interventions = protocol.armsInterventionsModule?.interventions?.map(i => i.name) || []

      const trialData = {
        nctId,
        title,
        phase: protocol.designModule?.phases?.[0] || 'Phase 3',
        status: protocol.statusModule.overallStatus,
        sponsor: protocol.sponsorCollaboratorsModule?.leadSponsor?.name || null,
        conditions,
        interventions,
        startDate: parseDate(protocol.statusModule.startDateStruct?.date),
        estimatedCompletionDate: parseDate(protocol.statusModule.completionDateStruct?.date)
      }

      const existing = await prisma.trial.findUnique({
        where: { nctId },
        include: { market: true }
      })

      if (existing) {
        await prisma.trial.update({
          where: { nctId },
          data: trialData
        })

        // If trial completed/terminated/withdrawn, close the market for trading
        const closedStatuses = ['COMPLETED', 'TERMINATED', 'WITHDRAWN', 'SUSPENDED']
        if (closedStatuses.includes(trialData.status || '') && existing.market?.status === 'OPEN') {
          await prisma.market.update({
            where: { id: existing.market.id },
            data: { status: 'CLOSED' }
          })
          marketsClosed++
        }

        updated++
      } else {
        const trial = await prisma.trial.create({
          data: trialData
        })
        created++

        await prisma.market.create({
          data: {
            trialId: trial.id,
            question: `Will ${title} receive FDA approval?`,
            yesPool: 1000,
            noPool: 1000
          }
        })
        marketsCreated++
      }
    }

    pageToken = data.nextPageToken
    if (!pageToken) break

    await new Promise(resolve => setTimeout(resolve, 500))
  }

  return { created, updated, marketsCreated, marketsClosed }
}

/**
 * Search for specific trial by NCT ID
 */
export async function fetchTrialByNctId(nctId: string): Promise<ClinicalTrialStudy | null> {
  const response = await fetch(`${CLINICAL_TRIALS_API}/studies/${nctId}`)

  if (!response.ok) {
    if (response.status === 404) return null
    throw new Error(`ClinicalTrials.gov API error: ${response.status}`)
  }

  return response.json()
}
