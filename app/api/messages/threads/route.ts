export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/auth.service'
import { prisma } from '@/lib/prisma'

// GET all message threads for current user
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await authService.validateSession(token)

    let threads

    if (user.role === 'homeowner') {
      const profile = await prisma.homeownerProfile.findUnique({
        where: { userId: user.id },
      })

      console.log('Homeowner profile:', profile?.id, 'for user:', user.id)

      threads = await prisma.messageThread.findMany({
        where: {
          homeownerId: profile!.id,
          archived: false,
        },
        include: {
          jobRequest: {
            include: {
              serviceProvider: {
                include: {
                  user: {
                    select: {
                      email: true,
                    },
                  },
                },
              },
            },
          },
          messages: {
            orderBy: {
              timestamp: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          lastMessageAt: 'desc',
        },
      })

      console.log('Threads for user:', user.id, 'role:', user.role, 'count:', threads.length)
    } else {
      const profile = await prisma.serviceProviderProfile.findUnique({
        where: { userId: user.id },
      })

      threads = await prisma.messageThread.findMany({
        where: {
          serviceProviderId: profile!.id,
          archived: false,
        },
        include: {
          jobRequest: {
            include: {
              homeowner: {
                include: {
                  user: {
                    select: {
                      email: true,
                    },
                  },
                },
              },
            },
          },
          messages: {
            orderBy: {
              timestamp: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          lastMessageAt: 'desc',
        },
      })
    }

    // Count unread messages for each thread
    const threadsWithUnread = await Promise.all(
      threads.map(async (thread: any) => {
        const unreadCount = await prisma.message.count({
          where: {
            threadId: thread.id,
            senderId: {
              not: user.id,
            },
            NOT: {
              readBy: {
                has: user.id,
              },
            },
          },
        })

        return {
          ...thread,
          unreadCount,
        }
      })
    )

    console.log('Threads for user:', user.id, 'role:', user.role, 'count:', threadsWithUnread.length)

    return NextResponse.json({ threads: threadsWithUnread })
  } catch (error: any) {
    console.error('Get threads error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch threads' },
      { status: 500 }
    )
  }
}

// POST create new message thread
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await authService.validateSession(token)

    const { jobRequestId } = await request.json()

    // Check if thread already exists
    const existingThread = await prisma.messageThread.findUnique({
      where: { jobRequestId },
    })

    if (existingThread) {
      return NextResponse.json({ thread: existingThread })
    }

    // Get job request details
    const jobRequest = await prisma.jobRequest.findUnique({
      where: { id: jobRequestId },
      include: {
        homeowner: true,
        serviceProvider: true,
      },
    })

    if (!jobRequest) {
      return NextResponse.json({ error: 'Job request not found' }, { status: 404 })
    }

    if (!jobRequest.serviceProviderId) {
      return NextResponse.json({ error: 'Job has no assigned provider' }, { status: 400 })
    }

    // Create thread
    const thread = await prisma.messageThread.create({
      data: {
        jobRequestId,
        homeownerId: jobRequest.homeownerId,
        serviceProviderId: jobRequest.serviceProviderId,
      },
    })

    return NextResponse.json({ thread }, { status: 201 })
  } catch (error: any) {
    console.error('Create thread error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create thread' },
      { status: 500 }
    )
  }
}
