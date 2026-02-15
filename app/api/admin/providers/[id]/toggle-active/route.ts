export const dynamic = 'force-dynamic'
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

    const { reason } = await request.json();

    // Get provider profile
    const provider = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        serviceProviderProfile: true,
      },
    });

    if (!provider || provider.role !== 'SERVICE_PROVIDER') {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    if (!provider.serviceProviderProfile) {
      return NextResponse.json(
        { error: 'Provider profile not found' },
        { status: 404 }
      );
    }

    // Toggle isActive status
    const currentStatus = provider.serviceProviderProfile.isActive ?? true;
    const newStatus = !currentStatus;

    const updatedProfile = await prisma.serviceProviderProfile.update({
      where: { userId: params.id },
      data: {
        isActive: newStatus,
        lastActiveAt: newStatus ? new Date() : provider.serviceProviderProfile.lastActiveAt,
      },
    });

    // Log admin action
    console.log(`[ADMIN ACTION] User ${authResult.userId} ${newStatus ? 'activated' : 'deactivated'} provider ${params.id}. Reason: ${reason || 'Not provided'}`);

    return NextResponse.json({
      success: true,
      provider: {
        id: provider.id,
        businessName: provider.serviceProviderProfile.businessName,
        isActive: newStatus,
      },
      message: `Provider ${newStatus ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    console.error('Error toggling provider status:', error);
    return NextResponse.json(
      { error: 'Failed to toggle provider status' },
      { status: 500 }
    );
  }
}
