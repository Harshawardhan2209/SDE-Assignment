import { NextResponse } from 'next/server';
import { getBooks } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const response = await getBooks();
    return NextResponse.json(response);
  } catch (error) {
    console.error('API Error fetching books:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch books', data: [] },
      { status: 500 }
    );
  }
}
