import { NextRequest, NextResponse } from 'next/server'
import { mediaService } from '@/lib/media/media.service'
import { authService } from '@/lib/auth/auth.service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const url = await mediaService.getMediaUrl(params.id)

    return NextResponse.json({ url })
  } catch (error: any) {
    console.error('Get media URL error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get media URL' },
      { status: 404 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await authService.validateSession(token)

    await mediaService.deleteMedia(params.id, user.id)

    return NextResponse.json({ message: 'Media file deleted successfully' })
  } catch (error: any) {
    console.error('Delete media error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete media file' },
      { status: 400 }
    )
  }
}
