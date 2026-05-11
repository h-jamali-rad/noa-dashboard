import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

function calculateSusScore(q: number[]): number {
  // Brooke 1996: odd items (1,3,5,7,9) contribution = score-1; even items (2,4,6,8,10) contribution = 5-score
  let sum = 0
  for (let i = 0; i < 10; i++) {
    sum += i % 2 === 0 ? q[i] - 1 : 5 - q[i]
  }
  return sum * 2.5
}

export async function GET() {
  try {
    const evaluations = await prisma.susEvaluation.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ evaluations })
  } catch (error) {
    console.error('GET /api/sus-evaluation failed:', error)
    return NextResponse.json({ error: 'Unable to fetch evaluations.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const evaluatorName = String(body.evaluatorName ?? '').trim()
    const evaluatorEmail = String(body.evaluatorEmail ?? '').trim()
    const specialty = String(body.specialty ?? '').trim()
    const affiliation = String(body.affiliation ?? '').trim()
    const yearsExperience = parseInt(body.yearsExperience) || 0
    const evaluatorType = body.evaluatorType === 'agent' ? 'agent' : 'human'

    const qs = [body.q1, body.q2, body.q3, body.q4, body.q5, body.q6, body.q7, body.q8, body.q9, body.q10]
      .map((v: unknown) => parseInt(String(v)) || 0)

    if (!evaluatorName || !specialty || !affiliation) {
      return NextResponse.json(
        { error: 'evaluatorName, specialty, and affiliation are required.' },
        { status: 400 }
      )
    }

    for (let i = 0; i < 10; i++) {
      if (qs[i] < 1 || qs[i] > 5) {
        return NextResponse.json(
          { error: `q${i + 1} must be between 1 and 5.` },
          { status: 400 }
        )
      }
    }

    const susScore = calculateSusScore(qs)

    const evaluation = await prisma.susEvaluation.create({
      data: {
        evaluatorName,
        evaluatorEmail,
        specialty,
        affiliation,
        yearsExperience,
        evaluatorType,
        q1: qs[0], q2: qs[1], q3: qs[2], q4: qs[3], q5: qs[4],
        q6: qs[5], q7: qs[6], q8: qs[7], q9: qs[8], q10: qs[9],
        susScore,
        qualitativeStrengths: String(body.qualitativeStrengths ?? '').trim(),
        qualitativeWeaknesses: String(body.qualitativeWeaknesses ?? '').trim(),
        qualitativeRecommendations: String(body.qualitativeRecommendations ?? '').trim(),
      },
    })

    return NextResponse.json({ evaluation }, { status: 201 })
  } catch (error) {
    console.error('POST /api/sus-evaluation failed:', error)
    return NextResponse.json({ error: 'Unable to save evaluation.' }, { status: 500 })
  }
}
