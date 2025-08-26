import { NextResponse } from 'next/server';
import { PutBucketCorsCommand } from '@aws-sdk/client-s3';
import { S3 } from '@/lib/S3Client';

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

export async function POST() {
  console.log('Attempting to set CORS policy for bucket:', BUCKET_NAME);

  if (!BUCKET_NAME) {
    return NextResponse.json(
      { error: 'S3_BUCKET_NAME environment variable is not set.' },
      { status: 500 }
    );
  }

  const corsParams = {
    Bucket: BUCKET_NAME,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'HEAD'],
          AllowedOrigins: [
            'http://localhost:3000',
            'https://*.vercel.app' // Allow previews and production from Vercel
          ],
          ExposeHeaders: [],
          MaxAgeSeconds: 3000,
        },
      ],
    },
  };

  try {
    const command = new PutBucketCorsCommand(corsParams);
    await S3.send(command);
    console.log('✅ Successfully set CORS policy for bucket:', BUCKET_NAME);
    return NextResponse.json({ success: true, message: 'CORS policy updated successfully.' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error setting CORS policy:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to set CORS policy.', details: errorMessage },
      { status: 500 }
    );
  }
}
