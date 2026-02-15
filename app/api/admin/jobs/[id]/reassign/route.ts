import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth/auth.middleware';

export async function POST(
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

    const { newProviderId, reason } = await request.json();

    if (!newProviderId) {
      return NextResponse.json(
        { error: 'New provider ID is required' },
        { status: 400 }
      );
    }

    // Verify new provider exists and is a service provider
    const newProvider = await prisma.user.findUnique({
      where: { id: newProviderId },
      include: {
        serviceProviderProfile: true,
      },
    });

    if (!newProvider || newProvider.role !== 'SERVICE_PROVIDER') {
      return NextResponse.json(
        { error: 'Invalid provider ID' },
        { status: 400 }
      );
    }

    if (!newProvider.serviceProviderProfile) {
      return NextResponse.json(
        { error: 'Provider does not have a complete profile' },
        { status: 400 }
      );
    }

    // Get current job
    const job = await prisma.jobRequest.findUnique({
      where: { id: params.id },
      include: {
        assignedProvider: {
          select: {
            id: true,
            email: true,
            serviceProviderProfile: {
              select: { businessName: true },
            },
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const oldProviderId = job.assignedProviderId;

    // Reassign job
    const updatedJob = await prisma.jobRequest.update({
      where: { id: params.id },
      data: {
        assignedProviderId: newProviderId,
      },
      include: {
        assignedProvider: {
          select: {
            id: true,
            email: true,
            serviceProviderProfile: {
              select: { businessName: true, phoneNumber: true },
            },
          },
        },
      },
    });

    // Log admin action
    console.log(`[ADMIN ACTION] User ${authResult.userId} reassigned job ${params.id} from provider ${oldProviderId} to ${newProviderId}. Reason: ${reason || 'Not provided'}`);

    return NextResponse.json({
      success: true,
      job: updatedJob,
      message: `Job reassigned to ${newProvider.serviceProviderProfile.businessName}`,
    });
  } catch (error) {
    console.error('Error reassigning job:', error);
    return NextResponse.json(
      { error: 'Failed to reassign job' },
      { status: 500 }
    );
  }
}
