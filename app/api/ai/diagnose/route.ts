import { NextRequest, NextResponse } from 'next/server'
import { chatbotService } from '@/lib/ai/chatbot.service'
import { authService } from '@/lib/auth/auth.service'
import { ServiceCategory } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await authService.validateSession(token)

    const body = await request.json()
    const { jobId, description, category } = body

    if (!description || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: description, category' },
        { status: 400 }
      )
    }

    // Get AI diagnosis
    const diagnosis = await chatbotService.analyzeProblem(
      description,
      category as ServiceCategory,
      [] // mediaUrls - empty for now
    )

    // Format response for frontend
    return NextResponse.json({
      diySteps: diagnosis.diySteps.map(step => ({
        title: `Step ${step.stepNumber}`,
        description: step.instruction,
        safetyWarning: step.safetyWarning,
        estimatedTime: step.estimatedTime,
      })),
      safetyWarnings: diagnosis.diySteps
        .filter(step => step.safetyWarning)
        .map(step => step.safetyWarning),
      diagnosis: diagnosis.diagnosis,
      requiresProfessional: diagnosis.requiresProfessional,
      confidence: diagnosis.confidence,
    })
  } catch (error: any) {
    console.error('AI diagnosis error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get AI diagnosis' },
      { status: 500 }
    )
  }
}
