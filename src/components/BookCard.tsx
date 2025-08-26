'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Book, Edit, Trash2, Star, Clock } from 'lucide-react';
import { IBook } from '@/types';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { formatCurrency } from '@/lib/utils/format';

interface BookCardProps {
  book: IBook;
  onDelete?: (id: string) => void;
  variant?: 'grid' | 'list';
}

export default function BookCard({ book, onDelete, variant = 'grid' }: BookCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Use coverImage from book data, fallback to placeholder
  const bookImageUrl = book.coverImage;
  
  // Debug logging
  console.log('BookCard Debug:', {
    bookId: book.id,
    coverImage: book.coverImage,
    hasImage: !!bookImageUrl,
    imageError
  });

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(book.id.toString());
    } catch (error) {
      console.error('Delete failed:', error);
      setIsDeleting(false);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -2 }}
      className={`
        relative bg-white dark:bg-gray-800 rounded-lg shadow-sm
        hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700
        ${variant === 'list' ? 'flex gap-4 p-4' : 'flex flex-col h-full'}
        ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      {/* Book Cover */}
      <div className={`
        relative overflow-hidden rounded-t-lg
        ${variant === 'list' ? 'w-24 h-32 flex-shrink-0' : 'aspect-[3/4] w-full'}
      `}>
        {bookImageUrl && !imageError ? (
          <Image
            src={bookImageUrl}
            alt={`Cover of ${book.title}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => {
              console.log('❌ Image failed to load:', bookImageUrl)
              setImageError(true)
            }}
            onLoad={() => {
              console.log('✅ Image loaded successfully:', bookImageUrl)
            }}
            priority={false}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 
                          dark:from-blue-800 dark:to-blue-900 flex items-center justify-center">
            <Book className="w-12 h-12 text-blue-600 dark:text-blue-300" />
          </div>
        )}
        
        {/* Price Badge */}
        <Badge className="absolute top-2 right-2" variant="primary">
          {formatCurrency(book.price)}
        </Badge>
      </div>

      {/* Book Details */}
      <div className={`${variant === 'grid' ? 'p-4 flex-1' : 'flex-1'} space-y-3`}>
        <div className="space-y-1">
          <h3 className="font-semibold text-base text-gray-900 dark:text-white 
                         line-clamp-2 hover:text-blue-600 transition-colors">
            <Link href={`/${book.id}`} className="block">
              {book.title}
            </Link>
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
            by {book.author}
          </p>
        </div>

        {/* Rating */}
        {book.rating && (
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(book.rating!)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
            <span className="text-sm text-gray-600 ml-1">
              ({book.reviewCount || 0})
            </span>
          </div>
        )}

        {/* Description */}
        {book.description && book.description.trim() && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
            {book.description}
          </p>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {book.pages && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {book.pages} pages
            </span>
          )}
          {book.genre && (
            <Badge variant="secondary" size="sm">
              {book.genre}
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 mt-auto">
          <Button
            as={Link}
            href={`/${book.id}`}
            variant="primary"
            size="sm"
            className="flex-1 text-xs"
          >
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </Button>
          {onDelete && (
            <Button
              onClick={handleDelete}
              variant="danger"
              size="sm"
              disabled={isDeleting}
              className="flex-1 text-xs"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
