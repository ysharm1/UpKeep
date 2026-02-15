import { MessageThread, Message } from '@prisma/client'
import { prisma } from '../prisma'

export class MessagingService {
  /**
   * Create message thread when job is accepted
   * Requirements: 7.1
   */
  async createThread(
    jobRequestId: string,
    homeownerId: string,
    serviceProviderId: string
  ): Promise<MessageThread> {
    const thread = await prisma.messageThread.create({
      data: {
        jobRequestId,
        homeownerId,
        serviceProviderId,
        archived: false,
      },
      include: {
        jobRequest: true,
        messages: true,
      },
    })

    return thread
  }

  /**
   * Send message
   * Requirements: 7.2, 7.4
   */
  async sendMessage(
    threadId: string,
    senderId: string,
    content: string,
    mediaUrl?: string
  ): Promise<Message> {
    const message = await prisma.message.create({
      data: {
        threadId,
        senderId,
        content,
        mediaUrl,
        readBy: [senderId],
      },
    })

    // Update thread's lastMessageAt
    await prisma.messageThread.update({
      where: { id: threadId },
      data: { lastMessageAt: new Date() },
    })

    return message
  }

  /**
   * Get thread
   * Requirements: 7.4
   */
  async getThread(threadId: string): Promise<MessageThread | null> {
    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
      include: {
        jobRequest: true,
        messages: {
          orderBy: { timestamp: 'asc' },
        },
      },
    })

    return thread
  }

  /**
   * Get threads for user
   * Requirements: 7.4
   */
  async getThreadsByUser(userId: string): Promise<MessageThread[]> {
    const threads = await prisma.messageThread.findMany({
      where: {
        OR: [{ homeownerId: userId }, { serviceProviderId: userId }],
        archived: false,
      },
      include: {
        jobRequest: true,
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    })

    return threads
  }

  /**
   * Mark messages as read
   * Requirements: 7.3
   */
  async markAsRead(threadId: string, userId: string): Promise<void> {
    const messages = await prisma.message.findMany({
      where: {
        threadId,
        NOT: {
          readBy: {
            has: userId,
          },
        },
      },
    })

    for (const message of messages) {
      await prisma.message.update({
        where: { id: message.id },
        data: {
          readBy: {
            push: userId,
          },
        },
      })
    }
  }

  /**
   * Archive thread
   * Requirements: 7.7
   */
  async archiveThread(threadId: string): Promise<void> {
    await prisma.messageThread.update({
      where: { id: threadId },
      data: { archived: true },
    })
  }
}

export const messagingService = new MessagingService()
