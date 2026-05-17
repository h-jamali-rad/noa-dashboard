import { prisma } from '@/lib/db'
import HomeContent from './home-content'

async function getPhases() {
  try {
    return await prisma.agentPhase.findMany({ orderBy: { id: 'asc' } })
  } catch {
    return []
  }
}

async function getCounts() {
  try {
    const [imgs] = await Promise.all([prisma.imageAsset.count()])
    return { imgs }
  } catch {
    return { imgs: 0 }
  }
}

export default async function HomePage() {
  const [phases, counts] = await Promise.all([getPhases(), getCounts()])

  return <HomeContent phases={phases} counts={counts} />
}
