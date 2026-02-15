export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/auth.service'
import { prisma } from '@/lib/prisma'

// GET messages for a thread
export async function GET(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await authService.validateSession(token)

    // Get messages
    const messages = await prisma.message.findMany({
      where: {
        threadId: params.threadId,
      },
      orderBy: {
        timestamp: 'asc',
      },
    })

    // Mark messages as read by current user
    await prisma.message.updateMany({
      where: {
        threadId: params.threadId,
        senderId: {
          not: user.id,
        },
        readBy: {
          not: {
            has: user.id,
          },
        },
      },
      data: {
        readBy: {
          push: user.id,
        },
      },
    })

    return NextResponse.json({ messages })
  } catch (error: any) {
    console.error('Get messages error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST new message
export async function POST(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await authService.validateSession(token)

    const { content, mediaUrl } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        threadId: params.threadId,
        senderId: user.id,
        content: content.trim(),
        mediaUrl,
        readBy: [user.id], // Sender has read it
      },
    })

    // Update thread's lastMessageAt
    await prisma.messageThread.update({
      where: { id: params.threadId },
      data: { lastMessageAt: new Date() },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error: any) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    )
  }
}
