export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/auth.service'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    await authService.validateSession(token)

    const body = await request.json()
    const { category, description, chatHistory, question } = body

    // Check if OpenAI API key is configured
    const openaiKey = process.env.OPENAI_API_KEY

    console.log('OpenAI Key present:', !!openaiKey)
    console.log('OpenAI Key length:', openaiKey?.length || 0)

    if (!openaiKey) {
      console.log('Using fallback - no OpenAI key')
      // Fallback response when OpenAI is not configured
      return NextResponse.json({
        response: getFallbackResponse(question, category),
      })
    }

    // Call OpenAI API
    try {
      console.log('Calling OpenAI API with model: gpt-4o-mini')
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a helpful home repair assistant specializing in ${category} issues. Provide practical, safe advice for homeowners. Always prioritize safety and recommend professional help when needed.`,
            },
            ...chatHistory.map((msg: any) => ({
              role: msg.role,
              content: msg.content,
            })),
            {
              role: 'user',
              content: question,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      })

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json()
        console.error('OpenAI API error:', openaiResponse.status, errorData)
        throw new Error('OpenAI API error')
      }

      const data = await openaiResponse.json()
      console.log('OpenAI response received successfully')
      const aiResponse = data.choices[0]?.message?.content || 'I apologize, but I could not generate a response.'

      return NextResponse.json({
        response: aiResponse,
      })
    } catch (openaiError) {
      console.error('OpenAI error:', openaiError)
      // Fallback to generic response if OpenAI fails
      return NextResponse.json({
        response: getFallbackResponse(question, category),
      })
    }
  } catch (error: any) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process chat' },
      { status: 500 }
    )
  }
}

function getFallbackResponse(question: string, category: string): string {
  const lowerQuestion = question.toLowerCase()

  // Common troubleshooting responses
  if (lowerQuestion.includes('not working') || lowerQuestion.includes('broken')) {
    return `For ${category} issues that aren't working properly, here are some general steps:

1. Check if the power is on and circuit breakers haven't tripped
2. Look for any visible damage or loose connections
3. Check if there are any error codes or warning lights
4. Try resetting the system if applicable

If these basic checks don't help, I recommend booking a professional diagnostic visit. Our verified ${category} specialists can properly diagnose and fix the issue safely.

Would you like me to help you find a professional in your area?`
  }

  if (lowerQuestion.includes('cost') || lowerQuestion.includes('price') || lowerQuestion.includes('expensive')) {
    return `Repair costs for ${category} issues can vary widely depending on:

- The specific problem and its severity
- Parts needed for the repair
- Labor time required
- Your location

The best way to get an accurate estimate is to book a diagnostic visit with one of our professionals. They'll assess the issue and provide a detailed quote before starting any work.

Our diagnostic visits typically range from $75-$150, and you'll know the exact repair cost before committing to anything.

Would you like to schedule a diagnostic visit?`
  }

  if (lowerQuestion.includes('diy') || lowerQuestion.includes('myself') || lowerQuestion.includes('do it')) {
    return `While some ${category} tasks can be DIY-friendly, many require professional expertise for safety and code compliance.

**Safe for DIY:**
- Changing air filters
- Cleaning vents and registers
- Basic maintenance tasks

**Requires Professional:**
- Electrical work
- Gas line work
- Major repairs or replacements
- Anything involving permits

For your specific issue, I recommend getting a professional assessment to ensure it's done safely and correctly. Our diagnostic visits are affordable and give you peace of mind.

Would you like to book a professional to take a look?`
  }

  // Generic helpful response
  return `I understand you're asking about "${question}".

For ${category} issues, the safest and most reliable approach is to have a professional assess the situation. They can:

- Properly diagnose the root cause
- Provide an accurate repair estimate
- Fix the issue safely and correctly
- Ensure everything meets code requirements

You can book a diagnostic visit with one of our verified ${category} professionals. They'll come to your location, assess the problem, and provide a detailed quote.

Would you like help finding a professional in your area?`
}
