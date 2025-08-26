"use client"

import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import { Upload, X, Image as ImageIcon, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { getBookImageKey, getBookImageUrl } from "@/lib/utils/image"  

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void
  onImageUploadError?: (error: string) => void
  bookId: number | string // Required for naming convention
  currentImage?: string
  className?: string
  disabled?: boolean
}

// Extracted constants to avoid re-allocations inside callbacks
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const HEAD_CHECK_DELAY_MS = 500
const POST_UPLOAD_PROPAGATION_DELAY_MS = 1000

export function ImageUpload({ 
  onImageUpload, 
  onImageUploadError,
  bookId,
  currentImage, 
  className,
  disabled = false
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<number | null>(null)

  // Derived flags to avoid repeating complex conditions
  const isBusy = disabled || isUploading

  // Generate the expected image URL for this book (memoized)
  const expectedImageUrl = useMemo(() => getBookImageUrl(bookId), [bookId])

  // Safe revoke helper to prevent memory leaks when replacing blob previews
  const safeRevokeObjectURL = useCallback((url?: string | null) => {
    if (url && url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url)
        console.log('🗑️ Revoked blob URL')
      } catch {
        // ignore
      }
    }
  }, [])

  // Update preview when currentImage changes
  const updatePreview = useCallback((url: string | null) => {
    console.log('Updating preview URL:', url)
    setPreviewUrl(prev => {
      // Revoke previous blob URL if we are replacing it with a new one
      if (prev && prev !== url) {
        safeRevokeObjectURL(prev)
      }
      return url
    })
    if (url) {
      setUploadError(null)
    }
  }, [safeRevokeObjectURL])

  // Check if image exists and set initial preview
  useEffect(() => {
    if (!bookId) return

    const controller = new AbortController()
    const { signal } = controller

    const checkImageExists = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, HEAD_CHECK_DELAY_MS))

        const response = await fetch(expectedImageUrl, { 
          method: 'HEAD',
          mode: 'cors',
          signal
        })
        if (response.ok) {
          console.log('✅ Image exists at expected URL:', expectedImageUrl)
          updatePreview(expectedImageUrl)
        } else {
          console.log('❌ No image found at expected URL:', expectedImageUrl)
          updatePreview(null)
        }
      } catch (error) {
        if ((error as any)?.name === 'AbortError') return
        console.log('⚠️ Failed to check image existence:', error)
        // Still try to show the image - it might exist but CORS is blocking HEAD request
        updatePreview(expectedImageUrl)
      }
    }

    checkImageExists()

    return () => {
      controller.abort()
    }
  }, [bookId, expectedImageUrl, updatePreview])

  // Handle file validation
  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Please select an image file (JPG, PNG, WebP)'
    }
    if (file.size > MAX_SIZE) {
      return 'File size must be less than 5MB'
    }
    return null
  }, [])

  // Handle file upload process - simplified to use server-side upload only
  const handleFileUpload = useCallback(async (file: File) => {
    // Reset error state
    setUploadError(null)
    
    // Validate file
    const validationError = validateFile(file)
    if (validationError) {
      setUploadError(validationError)
      onImageUploadError?.(validationError)
      return
    }

    setIsUploading(true)
    console.log('🚀 Starting upload process for book:', bookId)
    
    try {
      // Create preview immediately for better UX
      const preview = URL.createObjectURL(file)
      console.log('📸 Created local preview URL')
      updatePreview(preview)

      // Upload directly to server with book naming convention
      const imageKey = getBookImageKey(bookId)
      console.log('Uploading with naming convention:', imageKey)
      
      const makeFormData = (f: File) => {
        const fd = new FormData()
        fd.append('file', f)
        // Original code used 'filename' key; keep it to preserve backend expectations
        fd.append('filename', imageKey)
        return fd
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: makeFormData(file),
      })

      if (!response.ok) {
        // Try local storage as fallback
        console.log('Server upload failed, trying local storage...')
        
        const localResponse = await fetch('/api/upload-local', {
          method: 'POST',
          body: makeFormData(file),
        })

        if (!localResponse.ok) {
          const errorData = await localResponse.json().catch(() => ({}))
          throw new Error((errorData as any).error || 'Upload failed')
        }

        const { message } = await localResponse.json()
        console.log(`✅ ${message}`)
      } else {
        console.log('✅ Server upload successful!')
      }
      
      // After successful upload, wait a moment then use the expected URL
      console.log('🎉 Upload completed! Using expected URL:', expectedImageUrl)
      
      // Wait a bit for S3 to propagate the file
      timeoutRef.current = window.setTimeout(() => {
        updatePreview(expectedImageUrl)
        onImageUpload(expectedImageUrl)
      }, POST_UPLOAD_PROPAGATION_DELAY_MS)
      
    } catch (error) {
      console.error('Upload error:', error)
      
      let errorMsg = 'Failed to upload image. Please try again.'
      
      if (error instanceof Error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          errorMsg = 'Network error: Unable to connect to storage service.'
        } else {
          errorMsg = error.message
        }
      }
      
      setUploadError(errorMsg)
      onImageUploadError?.(errorMsg)
      updatePreview(null)
    } finally {
      setIsUploading(false)
    }
  }, [bookId, expectedImageUrl, onImageUpload, onImageUploadError, updatePreview, validateFile])

  // Clean up any pending timeout and blob URLs on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      safeRevokeObjectURL(previewUrl)
    }
  }, [previewUrl, safeRevokeObjectURL])

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    if (isBusy) return
    handleFileUpload(file)
  }, [isBusy, handleFileUpload])

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    if (isBusy) return
    
    const dropped = e.dataTransfer?.files?.[0]
    if (dropped) {
      handleFileSelect(dropped)
    }
  }, [isBusy, handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!isBusy) {
      setDragActive(true)
    }
  }, [isBusy])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }, [])

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      handleFileSelect(f)
    }
  }, [handleFileSelect])

  // Remove image - FIXED: Should NOT delete from storage, only clear preview
  const removeImage = useCallback(() => {
    if (disabled) return
    
    console.log('🔄 Removing image preview (not deleting from storage)')
    
    // If currently uploading, cancel the upload
    if (isUploading) {
      console.log('⚠️ Canceling ongoing upload')
      // The upload will be canceled by clearing the state
    }
    
    // Revoke object URL if it's a blob URL (local preview)
    safeRevokeObjectURL(previewUrl)
    
    // Clear preview and reset state - DO NOT delete from Tigris storage
    updatePreview(null)
    setUploadError(null)
    onImageUpload('') // Clear the image URL from parent
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    console.log('✅ Image preview cleared successfully')
  }, [disabled, isUploading, previewUrl, updatePreview, onImageUpload, safeRevokeObjectURL])

  // Handle click to select file
  const handleClick = useCallback(() => {
    if (!isBusy && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [isBusy])

  return (
    <div className={cn("space-y-4", className)}>
      <label className="block text-sm font-medium text-foreground">
        Book Cover Image
      </label>
      
      {/* Error Display */}
      {uploadError && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{uploadError}</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Image Preview */}
      {previewUrl ? (
        <Card className="relative overflow-hidden border-2">
          <div className="aspect-[3/4] relative group">
            <img
              src={previewUrl}
              alt="Book cover preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('❌ Failed to load image preview:', previewUrl)
                console.error('Image error event:', e)
                
                // More specific error handling
                if (previewUrl.startsWith('blob:')) {
                  setUploadError('Failed to load local preview. Please try uploading again.')
                } else if (previewUrl.includes('t3.storage.dev')) {
                  setUploadError('Failed to load image from Tigris. The image may not be publicly accessible.')
                } else {
                  setUploadError(`Failed to load image preview: ${previewUrl}`)
                }
              }}
              onLoad={() => {
                console.log('✅ Image loaded successfully:', previewUrl)
                setUploadError(null)
              }}
            />
            
            {/* Remove Button */}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={removeImage}
              disabled={disabled || isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
            
            {/* Uploading Overlay */}
            {isUploading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-sm font-medium">Uploading...</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      ) : (
        /* Upload Area */
        <Card
          className={cn(
            "border-2 border-dashed transition-all duration-200 cursor-pointer",
            dragActive 
              ? "border-primary bg-primary/5 scale-[1.02]" 
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
            (isUploading || disabled) && "opacity-50 cursor-not-allowed"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
            {isUploading ? (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-sm font-medium mb-2">Uploading image...</p>
                <p className="text-xs text-muted-foreground">Please wait</p>
              </>
            ) : (
              <>
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm font-medium mb-2">Upload book cover</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Drag and drop or click to select
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Upload className="h-3 w-3" />
                  <span>JPG, PNG, WebP up to 5MB</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
    </div>
  )
}