import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Debug: Log Cloudinary configuration (without secrets)
console.log('🔧 Cloudinary Config:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? 'set' : 'not set',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'set' : 'not set',
})

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const CLOUDINARY_FOLDER = 'book-covers'

// Small helper to keep error responses consistent
function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

// Validate file presence, type, and size
function validateFile(file: File | null) {
  if (!file) return 'No file provided'
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return 'Invalid file type. Only JPG, PNG, and WebP are allowed.'
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'File size must be less than 5MB.'
  }
  return null
}

// Promise-wrapped Cloudinary upload
function uploadToCloudinary(dataUri: string, bookId: string) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      dataUri,
      {
        folder: CLOUDINARY_FOLDER,
        public_id: `book-${bookId}`,
        resource_type: 'image',
        transformation: [
          { width: 400, height: 600, crop: 'fill', gravity: 'auto' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary upload error:', error)
          reject(error)
        } else {
          console.log('✅ Cloudinary upload success:', result)
          resolve(result)
        }
      }
    )
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting upload request...')

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const bookId = formData.get('bookId') as string | null

    console.log('📋 Form data received:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      bookId
    })

    if (!file) {
      console.log('❌ No file provided')
      return jsonError('No file provided', 400)
    }

    if (!bookId) {
      console.log('❌ No bookId provided')
      return jsonError('No bookId provided', 400)
    }

    // Validate file type and size
    const validationError = validateFile(file)
    if (validationError) {
      console.log(`❌ ${validationError}`, { type: file?.type, size: file?.size })
      return jsonError(validationError, 400)
    }

    console.log('✅ File validation passed, converting to buffer...')

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log('✅ Buffer created, size:', buffer.length, 'bytes')

    console.log('🔄 Starting Cloudinary upload with base64...')

    // Upload to Cloudinary using base64 encoding (more reliable than streams)
    const dataUri = `data:${file.type};base64,${buffer.toString('base64')}`
    const uploadResult: any = await uploadToCloudinary(dataUri, bookId)

    const imageUrl = uploadResult.secure_url

    console.log('✅ Cloudinary upload successful!')
    console.log('   Book ID:', bookId)
    console.log('   Image URL:', imageUrl)

    return NextResponse.json({
      imageUrl,
      publicId: uploadResult.public_id,
    })
  } catch (error) {
    console.error('❌ Upload route error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    })

    return NextResponse.json(
      { error: 'Failed to upload file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}