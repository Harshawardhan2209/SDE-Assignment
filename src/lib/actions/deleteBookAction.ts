'use server';

import { deleteBook } from '@/lib/data';

export async function deleteBookAction(id: number) {
  try {
    await deleteBook(id);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete book:', error);
    return { success: false, error: 'Failed to delete book' };
  }
}