"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Upload, X, Image as ImageIcon, AlertCircle, Loader2, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface BookCoverUploadProps {
  onImageUpload: (imageUrl: string) => void
  onImageUploadError?: (error: string) => void
  bookId: number | string // Required for naming convention
  currentImage?: string | null
  className?: string
  disabled?: boolean
}

export function BookCoverUpload({ 
  onImageUpload, 
  onImageUploadError,
  bookId,
  currentImage, 
  className,
  disabled = false
}: BookCoverUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update preview when currentImage changes
  const updatePreview = useCallback((url: string | null) => {
    console.log('Updating preview URL:', url)
    setPreviewUrl(url)
    if (url) {
      setUploadError(null)
    }
  }, [])

  // Sync with currentImage prop
  useEffect(() => {
    if (currentImage && currentImage !== previewUrl) {
      console.log('Syncing with currentImage prop:', currentImage)
      updatePreview(currentImage)
    }
  }, [currentImage, previewUrl, updatePreview])

  // Handle file validation
  const validateFile = useCallback((file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!allowedTypes.includes(file.type)) {
      return 'Please select an image file (JPG, PNG, WebP)'
    }

    if (file.size > maxSize) {
      return 'File size must be less than 5MB'
    }

    return null
  }, [])

  // Handle file upload process with Cloudinary
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
    console.log('🚀 Starting Cloudinary upload for book:', bookId)
    
    try {
      // Create preview immediately for better UX
      const preview = URL.createObjectURL(file)
      updatePreview(preview)

      // Upload to Cloudinary via our API
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bookId', String(bookId))

      console.log('📤 Sending upload request...')
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      console.log('📥 Response received:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Upload failed:', errorData)
        throw new Error(errorData.error || errorData.details || `Upload failed: ${response.status}`)
      }

      const { imageUrl } = await response.json()
      console.log('✅ Cloudinary upload completed! URL:', imageUrl)
      
      // Replace preview with Cloudinary URL
      updatePreview(imageUrl)
      onImageUpload(imageUrl)
      
    } catch (error) {
      console.error('Upload error:', error)
      
      let errorMsg = 'Failed to upload image. Please try again.'
      
      if (error instanceof Error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          errorMsg = 'Network error: Unable to connect to Cloudinary.'
        } else {
          errorMsg = error.message
        }
      }
      
      setUploadError(errorMsg)
      onImageUploadError?.(errorMsg)
      updatePreview(currentImage || null)
    } finally {
      setIsUploading(false)
    }
  }, [bookId, currentImage, onImageUpload, onImageUploadError, updatePreview, validateFile])

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    if (disabled || isUploading) return
    handleFileUpload(file)
  }, [disabled, isUploading, handleFileUpload])

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    if (disabled || isUploading) return
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [disabled, isUploading, handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled && !isUploading) {
      setDragActive(true)
    }
  }, [disabled, isUploading])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }, [])

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  // Remove image - clear preview and notify parent
  const removeImage = useCallback(() => {
    if (disabled) return
    
    console.log('🔄 Removing image preview')
    
    // Revoke object URL if it's a blob URL (local preview)
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
      console.log('🗑️ Revoked blob URL')
    }
    
    // Clear preview and reset state
    updatePreview(null)
    setUploadError(null)
    onImageUpload('') // Clear the image URL from parent
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    console.log('✅ Image preview cleared successfully')
  }, [disabled, previewUrl, updatePreview, onImageUpload])

  // Handle click to select file
  const handleClick = useCallback(() => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [disabled, isUploading])

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-primary" />
        <label className="block text-sm font-medium text-foreground">
          Book Cover Image
        </label>
      </div>
      
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
      
      {/* Book Cover Preview */}
      {previewUrl ? (
        <Card className="relative overflow-hidden border-2 border-primary/20">
          <div className="aspect-[3/4] relative group">
            <img
              src={previewUrl}
              alt="Book cover preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Failed to load image preview:', previewUrl)
                console.error('Image error event:', e)
                // Don't set error for blob URLs as they might be blocked by CSP
                if (!previewUrl.startsWith('blob:')) {
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
                  <p className="text-sm font-medium">
                    Uploading to Cloudinary...
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Cover Info */}
          <div className="p-3 bg-green-50 border-t border-green-200">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-xs text-green-700 font-medium">
                Cover image uploaded successfully
              </p>
            </div>
          </div>
        </Card>
      ) : (
        /* Upload Area - Book Cover Specific */
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
                <p className="text-sm font-medium mb-2">Uploading to Cloudinary...</p>
                <p className="text-xs text-muted-foreground">Please wait</p>
              </>
            ) : (
              <>
                <div className="relative mb-4">
                  <BookOpen className="h-12 w-12 text-muted-foreground" />
                  <ImageIcon className="h-6 w-6 text-primary absolute -bottom-1 -right-1" />
                </div>
                <p className="text-sm font-medium mb-2">Upload book cover</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Drag and drop or click to select a cover image
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Upload className="h-3 w-3" />
                  <span>JPG, PNG, WebP up to 5MB</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Recommended: 3:4 aspect ratio for best display
                </p>
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
