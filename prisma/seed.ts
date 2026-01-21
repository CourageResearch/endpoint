import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create sample trials and markets
  const trials = [
    {
      nctId: 'NCT04368728',
      title: 'Study of Drug X for Treatment of Advanced Lung Cancer',
      phase: 'Phase 3',
      status: 'RECRUITING',
      sponsor: 'Pharma Inc.',
      conditions: ['Non-Small Cell Lung Cancer', 'Lung Neoplasms'],
      interventions: ['Drug X', 'Placebo']
    },
    {
      nctId: 'NCT05123456',
      title: 'Efficacy of Treatment Y in Type 2 Diabetes',
      phase: 'Phase 3',
      status: 'ACTIVE_NOT_RECRUITING',
      sponsor: 'BioHealth Corp',
      conditions: ['Type 2 Diabetes Mellitus'],
      interventions: ['Treatment Y']
    },
    {
      nctId: 'NCT04987654',
      title: 'Novel Therapy Z for Alzheimer\'s Disease',
      phase: 'Phase 3',
      status: 'RECRUITING',
      sponsor: 'NeuroScience Ltd',
      conditions: ['Alzheimer Disease', 'Dementia'],
      interventions: ['Therapy Z', 'Standard Care']
    },
    {
      nctId: 'NCT05111222',
      title: 'Immunotherapy A for Melanoma',
      phase: 'Phase 3',
      status: 'COMPLETED',
      sponsor: 'OncoPharm',
      conditions: ['Melanoma', 'Skin Cancer'],
      interventions: ['Immunotherapy A']
    },
    {
      nctId: 'NCT05333444',
      title: 'Cardiovascular Outcomes with Drug B',
      phase: 'Phase 3',
      status: 'RECRUITING',
      sponsor: 'HeartHealth Inc',
      conditions: ['Coronary Artery Disease', 'Heart Failure'],
      interventions: ['Drug B', 'Placebo']
    }
  ]

  for (const trialData of trials) {
    const existingTrial = await prisma.trial.findUnique({
      where: { nctId: trialData.nctId }
    })

    if (!existingTrial) {
      const trial = await prisma.trial.create({
        data: trialData
      })

      await prisma.market.create({
        data: {
          trialId: trial.id,
          question: `Will ${trialData.title} receive FDA approval?`,
          yesPool: 1000,
          noPool: 1000,
          status: 'OPEN'
        }
      })

      console.log(`Created trial and market for ${trialData.nctId}`)
    } else {
      console.log(`Trial ${trialData.nctId} already exists`)
    }
  }

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
