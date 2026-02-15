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
    const { jobId, description, category } = body

    // Check if OpenAI API key is configured
    const openaiKey = process.env.OPENAI_API_KEY

    if (!openaiKey) {
      // Fallback response when OpenAI is not configured
      return NextResponse.json(getFallbackDiagnosis(category, description))
    }

    // Call OpenAI API
    try {
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
              content: `You are a helpful home repair diagnostic assistant specializing in ${category}. Analyze the problem and provide:
1. A brief diagnosis (2-3 sentences)
2. 3-4 DIY troubleshooting steps with estimated time
3. Safety warnings if applicable
4. When to call a professional

Format your response as JSON with this structure:
{
  "diagnosis": "Brief explanation of likely issue",
  "diySteps": [
    {"title": "Step name", "description": "What to do", "estimatedTime": "5-10 minutes"}
  ],
  "safetyWarnings": ["Warning 1", "Warning 2"]
}`,
            },
            {
              role: 'user',
              content: `Problem: ${description}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 800,
        }),
      })

      if (!openaiResponse.ok) {
        throw new Error('OpenAI API error')
      }

      const data = await openaiResponse.json()
      const aiResponse = data.choices[0]?.message?.content || '{}'

      // Try to parse JSON response
      try {
        const parsed = JSON.parse(aiResponse)
        return NextResponse.json(parsed)
      } catch {
        // If not valid JSON, return fallback
        return NextResponse.json(getFallbackDiagnosis(category, description))
      }
    } catch (openaiError) {
      console.error('OpenAI error:', openaiError)
      return NextResponse.json(getFallbackDiagnosis(category, description))
    }
  } catch (error: any) {
    console.error('AI diagnose error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to diagnose' },
      { status: 500 }
    )
  }
}

function getFallbackDiagnosis(category: string, description: string) {
  const categoryDiagnoses: Record<string, any> = {
    hvac: {
      diagnosis: "Based on your description, this could be related to airflow, refrigerant levels, or a component malfunction. A professional diagnostic visit will help identify the exact cause.",
      diySteps: [
        {
          title: "Check Air Filter",
          description: "Replace or clean your air filter if it's dirty. A clogged filter restricts airflow and reduces efficiency.",
          estimatedTime: "5 minutes"
        },
        {
          title: "Check Thermostat Settings",
          description: "Ensure your thermostat is set to the correct mode (heat/cool) and temperature. Try replacing batteries if applicable.",
          estimatedTime: "5 minutes"
        },
        {
          title: "Inspect Circuit Breaker",
          description: "Check if the circuit breaker for your HVAC system has tripped. Reset it if needed.",
          estimatedTime: "2 minutes"
        },
        {
          title: "Clear Outdoor Unit",
          description: "Remove any debris, leaves, or obstructions around your outdoor AC unit to ensure proper airflow.",
          estimatedTime: "10 minutes"
        }
      ],
      safetyWarnings: [
        "Never attempt to repair refrigerant leaks yourself - this requires EPA certification",
        "Turn off power at the breaker before inspecting any electrical components",
        "If you smell gas or burning, turn off the system immediately and call a professional"
      ]
    },
    plumbing: {
      diagnosis: "Plumbing issues can range from simple clogs to more complex pipe or fixture problems. A professional can properly diagnose and fix the issue to prevent water damage.",
      diySteps: [
        {
          title: "Check Water Shut-off Valves",
          description: "Locate and test your main water shut-off valve. Make sure you know how to turn it off in an emergency.",
          estimatedTime: "5 minutes"
        },
        {
          title: "Try a Plunger",
          description: "For clogs, use a plunger with a good seal. Plunge vigorously for 15-20 seconds, then check if water drains.",
          estimatedTime: "10 minutes"
        },
        {
          title: "Check for Visible Leaks",
          description: "Look under sinks and around fixtures for any visible water leaks or moisture. Place a bucket under any active leaks.",
          estimatedTime: "10 minutes"
        },
        {
          title: "Clean Drain Stoppers",
          description: "Remove and clean sink or tub stoppers to remove hair and debris that might be causing slow drains.",
          estimatedTime: "15 minutes"
        }
      ],
      safetyWarnings: [
        "Never use chemical drain cleaners if you've already tried a plunger - they can cause dangerous splashing",
        "Turn off water supply before attempting any repairs",
        "If you see mold or extensive water damage, call a professional immediately"
      ]
    },
    electrical: {
      diagnosis: "Electrical issues require careful attention to safety. While some problems are simple, many require professional expertise to ensure safety and code compliance.",
      diySteps: [
        {
          title: "Check Circuit Breakers",
          description: "Look at your electrical panel for any tripped breakers. Reset them by switching fully off, then back on.",
          estimatedTime: "5 minutes"
        },
        {
          title: "Test GFCI Outlets",
          description: "Press the 'test' button on GFCI outlets (usually in bathrooms/kitchens), then press 'reset' to restore power.",
          estimatedTime: "2 minutes"
        },
        {
          title: "Check Light Bulbs",
          description: "Replace any burnt-out bulbs and ensure they're the correct wattage for the fixture.",
          estimatedTime: "5 minutes"
        },
        {
          title: "Inspect Visible Wiring",
          description: "Look for any visible damage to cords, outlets, or switches. Do not touch damaged wiring.",
          estimatedTime: "10 minutes"
        }
      ],
      safetyWarnings: [
        "NEVER work on electrical systems with power on - always turn off the breaker first",
        "If you smell burning or see sparks, turn off power immediately and call a professional",
        "Electrical work often requires permits and inspections - hire a licensed electrician",
        "Water and electricity don't mix - never touch electrical components with wet hands"
      ]
    },
    general_maintenance: {
      diagnosis: "General maintenance issues can often be addressed with basic tools and knowledge. However, some repairs may require specialized skills or tools.",
      diySteps: [
        {
          title: "Gather Information",
          description: "Take photos of the issue from multiple angles. Note when the problem started and any changes you've noticed.",
          estimatedTime: "10 minutes"
        },
        {
          title: "Check for Simple Fixes",
          description: "Look for loose screws, worn parts, or obvious damage that might be causing the issue.",
          estimatedTime: "15 minutes"
        },
        {
          title: "Clean the Area",
          description: "Sometimes dirt, dust, or debris can cause problems. Clean the affected area thoroughly.",
          estimatedTime: "20 minutes"
        },
        {
          title: "Test Basic Functions",
          description: "Try operating the item normally to see if the problem is consistent or intermittent.",
          estimatedTime: "10 minutes"
        }
      ],
      safetyWarnings: [
        "Use proper safety equipment (gloves, goggles) when working with tools",
        "If the repair involves electricity, gas, or water, consider hiring a professional",
        "Don't attempt repairs beyond your skill level - it could make the problem worse"
      ]
    }
  }

  return categoryDiagnoses[category] || categoryDiagnoses.general_maintenance
}
