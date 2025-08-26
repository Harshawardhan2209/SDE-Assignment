'use client';

import { useState } from 'react';
import { IBook } from '@/types';
import { BookCoverUpload } from '@/components/BookCoverUpload';
import { Button } from '@/components/common/Button';

interface BookFormProps {
  book?: IBook;
  onSubmit: (book: IBook) => Promise<void>;
  onCancel?: () => void;
}

export default function BookForm({ book, onSubmit, onCancel }: BookFormProps) {
  const [formData, setFormData] = useState<Partial<IBook>>({
    title: book?.title || '',
    author: book?.author || '',
    price: book?.price || 0,
    description: book?.description || '',
    rating: book?.rating || 0,
    reviewCount: book?.reviewCount || 0,
    pages: book?.pages || 0,
    genre: book?.genre || '',
    isbn: book?.isbn || '',
    publishedDate: book?.publishedDate || '',
    publisher: book?.publisher || '',
    coverImage: book?.coverImage || '', // Include coverImage in form data
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  const handleInputChange = (field: keyof IBook, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (imageUrl: string) => {
    console.log('Image uploaded successfully:', imageUrl);
    // Store the Cloudinary URL in form data
    setFormData(prev => ({
      ...prev,
      coverImage: imageUrl
    }));
  };

  const handleImageUploadError = (error: string) => {
    setImageUploadError(error);
    console.error('Image upload error:', error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.author) {
      alert('Please fill in required fields: Title and Author');
      return;
    }

    setIsSubmitting(true);
    try {
      const bookData: IBook = {
        id: book?.id || Date.now(), // Use existing ID or generate new one
        title: formData.title!,
        author: formData.author!,
        price: formData.price || 0,
        description: formData.description || '',
        rating: formData.rating,
        reviewCount: formData.reviewCount,
        pages: formData.pages,
        genre: formData.genre,
        isbn: formData.isbn,
        publishedDate: formData.publishedDate,
        publisher: formData.publisher,
        coverImage: formData.coverImage, // Include coverImage in the book data
      };

      await onSubmit(bookData);
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Failed to save book. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        {book ? 'Edit Book' : 'Add New Book'}
      </h2>

      {/* Book Cover Image Upload */}
      <div className="space-y-2">
        <BookCoverUpload
          bookId={book?.id || Date.now()} // Use existing ID or temporary ID
          onImageUpload={handleImageUpload}
          onImageUploadError={handleImageUploadError}
          currentImage={formData.coverImage || null}
          className="max-w-xs"
        />
        {imageUploadError && (
          <p className="text-sm text-red-600">{imageUploadError}</p>
        )}
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Author *
          </label>
          <input
            type="text"
            value={formData.author}
            onChange={(e) => handleInputChange('author', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Price
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Genre
          </label>
          <input
            type="text"
            value={formData.genre}
            onChange={(e) => handleInputChange('genre', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Pages
          </label>
          <input
            type="number"
            value={formData.pages}
            onChange={(e) => handleInputChange('pages', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            ISBN
          </label>
          <input
            type="text"
            value={formData.isbn}
            onChange={(e) => handleInputChange('isbn', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? 'Saving...' : (book ? 'Update Book' : 'Add Book')}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
