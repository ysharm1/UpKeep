'use client'

import { useState, useRef } from 'react'

interface PhotoUploadProps {
  onPhotosChange: (photoUrls: string[]) => void
  maxPhotos?: number
  existingPhotos?: string[]
  context?: string
  jobRequestId?: string
}

export default function PhotoUpload({ 
  onPhotosChange, 
  maxPhotos = 5, 
  existingPhotos = [],
  context = 'job_request',
  jobRequestId
}: PhotoUploadProps) {
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>(existingPhotos)
  const [uploadedUrls, setUploadedUrls] = useState<string[]>(existingPhotos)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('context', context)
    if (jobRequestId) {
      formData.append('jobRequestId', jobRequestId)
    }

    const token = localStorage.getItem('accessToken')
    const response = await fetch('/api/media/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Upload failed')
    }

    const data = await response.json()
    return data.mediaFile.url
  }

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || uploading) return

    const newFiles = Array.from(files).slice(0, maxPhotos - photos.length)
    const validFiles = newFiles.filter(file => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`)
        return false
      }
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is too large (max 10MB)`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setUploading(true)

    try {
      // Create previews immediately
      const newPreviews: string[] = []
      for (const file of validFiles) {
        const reader = new FileReader()
        const preview = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
        newPreviews.push(preview)
      }

      // Update previews immediately for better UX
      setPreviews([...previews, ...newPreviews])

      // Upload files to server
      const uploadPromises = validFiles.map(file => uploadFile(file))
      const urls = await Promise.all(uploadPromises)

      // Update state with uploaded URLs
      const updatedPhotos = [...photos, ...validFiles]
      const updatedUrls = [...uploadedUrls, ...urls]
      
      setPhotos(updatedPhotos)
      setUploadedUrls(updatedUrls)
      onPhotosChange(updatedUrls)
    } catch (error: any) {
      alert(`Upload failed: ${error.message}`)
      // Revert previews on error
      setPreviews(previews)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = () => {
    setDragging(false)
  }

  const removePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index)
    const updatedPreviews = previews.filter((_, i) => i !== index)
    const updatedUrls = uploadedUrls.filter((_, i) => i !== index)
    setPhotos(updatedPhotos)
    setPreviews(updatedPreviews)
    setUploadedUrls(updatedUrls)
    onPhotosChange(updatedUrls)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={uploading ? undefined : openFileDialog}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          uploading
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : dragging
            ? 'border-blue-500 bg-blue-50 cursor-pointer'
            : 'border-gray-300 hover:border-gray-400 cursor-pointer'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        {uploading ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Uploading photos...</p>
          </>
        ) : (
          <>
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG up to 10MB ({maxPhotos - photos.length} remaining)
            </p>
          </>
        )}
      </div>

      {/* Photo Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removePhoto(index)
                }}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
