import { ServiceCategory } from '@prisma/client'
import OpenAI from 'openai'
import { prisma } from '../prisma'

// Check if API key is available
if (!process.env.OPENAI_API_KEY) {
  console.error('WARNING: OPENAI_API_KEY is not set in environment variables')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface DIYStep {
  stepNumber: number
  instruction: string
  safetyWarning?: string
  estimatedTime: string
}

export interface DiagnosticResponse {
  conversationId: string
  diagnosis: string
  diySteps: DIYStep[]
  confidence: number
  requiresProfessional: boolean
}

export interface ChatMessage {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export class ChatbotService {
  /**
   * Get system prompt for home repair diagnostics
   * Requirements: 2.4, 2.5
   */
  private getSystemPrompt(category: ServiceCategory): string {
    return `You are an expert home repair diagnostic assistant specializing in ${category} issues. Your role is to:

1. Analyze the problem description and any provided images
2. Provide a clear diagnosis of the issue
3. Suggest DIY solutions ONLY if they are safe for a homeowner to attempt
4. Include detailed safety warnings for any potentially dangerous steps
5. Recommend professional help if the issue is complex, dangerous, or requires specialized tools/knowledge

SAFETY GUIDELINES:
- NEVER suggest DIY solutions for gas line issues, electrical panel work, or structural repairs
- ALWAYS include safety warnings for tasks involving electricity, water, heights, or heavy lifting
- If in doubt about safety, recommend professional help
- Emphasize the importance of turning off power/water before repairs

FORMAT YOUR RESPONSE AS JSON:
{
  "diagnosis": "Clear explanation of the problem",
  "diySteps": [
    {
      "stepNumber": 1,
      "instruction": "Detailed step instruction",
      "safetyWarning": "Safety warning if applicable",
      "estimatedTime": "Estimated time for this step"
    }
  ],
  "confidence": 0.0-1.0,
  "requiresProfessional": true/false
}

If confidence < 0.7 or the issue is complex/dangerous, set requiresProfessional to true.`
  }

  /**
   * Analyze problem and provide diagnostic response
   * Requirements: 2.4, 2.5
   */
  async analyzeProblem(
    description: string,
    category: ServiceCategory,
    mediaUrls: string[]
  ): Promise<DiagnosticResponse> {
    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: this.getSystemPrompt(category),
        },
        {
          role: 'user',
          content: description,
        },
      ]

      // Add image analysis if media URLs provided
      if (mediaUrls.length > 0) {
        messages.push({
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Here are images of the problem:',
            },
            ...mediaUrls.slice(0, 3).map(url => ({
              type: 'image_url' as const,
              image_url: { url },
            })),
          ],
        })
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.7,
      })

      const responseContent = completion.choices[0].message.content || '{}'
      const parsedResponse = JSON.parse(responseContent)

      // Return the diagnostic response without saving to database for now
      // (conversation will be created when user continues chatting)
      return {
        conversationId: '', // Will be created if user continues chat
        diagnosis: parsedResponse.diagnosis || 'Unable to diagnose',
        diySteps: parsedResponse.diySteps || [],
        confidence: parsedResponse.confidence || 0,
        requiresProfessional: parsedResponse.requiresProfessional || true,
      }
    } catch (error) {
      console.error('AI analysis error:', error)
      // Return safe default response
      return {
        conversationId: '',
        diagnosis: 'Unable to analyze the problem. Please consult a professional.',
        diySteps: [],
        confidence: 0,
        requiresProfessional: true,
      }
    }
  }

  /**
   * Get chat response for follow-up questions
   * Requirements: 2.4
   */
  async getChatResponse(
    conversationId: string,
    userMessage: string
  ): Promise<ChatMessage> {
    try {
      // Get conversation history
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { timestamp: 'asc' },
          },
          jobRequest: true,
        },
      })

      if (!conversation) {
        throw new Error('Conversation not found')
      }

      // Build message history
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: this.getSystemPrompt(conversation.jobRequest.category),
        },
        ...conversation.messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        {
          role: 'user',
          content: userMessage,
        },
      ]

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
      })

      const responseContent = completion.choices[0].message.content || ''

      // Store messages
      await prisma.chatMessage.create({
        data: {
          conversationId,
          role: 'user',
          content: userMessage,
        },
      })

      const assistantMessage = await prisma.chatMessage.create({
        data: {
          conversationId,
          role: 'assistant',
          content: responseContent,
        },
      })

      return {
        id: assistantMessage.id,
        conversationId,
        role: 'assistant',
        content: responseContent,
        timestamp: assistantMessage.timestamp,
      }
    } catch (error) {
      console.error('Chat response error:', error)
      throw new Error('Failed to get chat response')
    }
  }

  /**
   * Create conversation for job request
   * Requirements: 2.4
   */
  async createConversation(jobRequestId: string): Promise<string> {
    const conversation = await prisma.conversation.create({
      data: {
        jobRequestId,
        resolved: false,
      },
    })

    return conversation.id
  }

  /**
   * End conversation
   * Requirements: 2.6, 2.7
   */
  async endConversation(conversationId: string, resolved: boolean): Promise<void> {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { resolved },
    })
  }
}

export const chatbotService = new ChatbotService()
