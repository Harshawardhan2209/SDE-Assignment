import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const filename = formData.get('filename') as string
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB.' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Use provided filename or generate unique one
    const finalFilename = filename ? filename.replace('books/', '').replace('/', '-') : `${uuidv4()}.jpg`
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'book-covers')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }
    
    // Write file to local storage
    const filePath = path.join(uploadsDir, finalFilename)
    await writeFile(filePath, buffer)

    // Return the public URL
    const imageUrl = `/uploads/book-covers/${finalFilename}`

    console.log(`✅ Local upload successful: ${imageUrl}`)

    return NextResponse.json({
      imageUrl,
      key: `book-covers/${finalFilename}`,
      message: 'File uploaded successfully (local storage)'
    })
  } catch (error) {
    console.error('Local upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file locally' },
      { status: 500 }
    )
  }
}
