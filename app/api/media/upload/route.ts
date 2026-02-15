export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { mediaService } from '@/lib/media/media.service'
import { MediaContext } from '@prisma/client'
import { authService } from '@/lib/auth/auth.service'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await authService.validateSession(token)

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const context = (formData.get('context') as MediaContext) || MediaContext.job_request
    const jobRequestId = formData.get('jobRequestId') as string | undefined

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload file
    const mediaFile = await mediaService.uploadMedia(
      buffer,
      file.name,
      file.type,
      file.size,
      user.id,
      context,
      jobRequestId
    )

    return NextResponse.json({
      message: 'File uploaded successfully',
      mediaFile,
    })
  } catch (error: any) {
    console.error('Media upload error:', error)
    return NextResponse.json(
      { error: error.message || 'File upload failed' },
      { status: 400 }
    )
  }
}
