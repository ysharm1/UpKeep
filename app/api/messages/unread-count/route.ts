export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/auth.service'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await authService.validateSession(token)

    // Get all message threads for the user
    let threadIds: string[] = []

    if (user.role === 'homeowner') {
      const profile = await prisma.homeownerProfile.findUnique({
        where: { userId: user.id },
      })

      const threads = await prisma.messageThread.findMany({
        where: {
          homeownerId: profile!.id,
          archived: false,
        },
        select: { id: true },
      })

      threadIds = threads.map(t => t.id)
    } else {
      const profile = await prisma.serviceProviderProfile.findUnique({
        where: { userId: user.id },
      })

      const threads = await prisma.messageThread.findMany({
        where: {
          serviceProviderId: profile!.id,
          archived: false,
        },
        select: { id: true },
      })

      threadIds = threads.map(t => t.id)
    }

    // Count unread messages across all threads
    const unreadCount = await prisma.message.count({
      where: {
        threadId: { in: threadIds },
        senderId: { not: user.id },
        readBy: {
          not: {
            has: user.id,
          },
        },
      },
    })

    return NextResponse.json({ unreadCount })
  } catch (error: any) {
    console.error('Get unread count error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch unread count' },
      { status: 500 }
    )
  }
}
