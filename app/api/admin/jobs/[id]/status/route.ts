export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth/auth.middleware';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: authResult.userId },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { status, reason } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status is a valid JobStatus enum value
    const validStatuses = [
      'pending',
      'diagnostic_scheduled',
      'diagnostic_completed',
      'repair_pending_approval',
      'repair_approved',
      'in_progress',
      'completed',
      'cancelled'
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Update job status
    const job = await prisma.jobRequest.update({
      where: { id: params.id },
      data: { status },
      include: {
        homeowner: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                phoneNumber: true,
              },
            },
          },
        },
        assignedProvider: {
          select: {
            id: true,
            email: true,
            serviceProviderProfile: {
              select: {
                businessName: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });

    // Log admin action
    console.log(`[ADMIN ACTION] User ${authResult.userId} changed job ${params.id} status to ${status}. Reason: ${reason || 'Not provided'}`);

    return NextResponse.json({
      success: true,
      job,
      message: `Job status updated to ${status}`,
    });
  } catch (error) {
    console.error('Error updating job status:', error);
    return NextResponse.json(
      { error: 'Failed to update job status' },
      { status: 500 }
    );
  }
}
