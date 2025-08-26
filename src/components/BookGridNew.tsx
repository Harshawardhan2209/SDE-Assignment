"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { IBook } from "@/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookOpen, ImageOff, Loader2, Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";

interface BookGridProps {
  books: IBook[];
  loading?: boolean;
  onEdit?: (book: IBook) => void;
  onDelete?: (id: number) => Promise<void>;
}

function BookCard({ book, onEdit, onDelete }: { book: IBook; onEdit?: (b: IBook) => void; onDelete?: (id: number) => Promise<void>; }) {
  const [imgError, setImgError] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = useCallback(async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete(book.id);
    } finally {
      setDeleting(false);
    }
  }, [book.id, onDelete]);

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-lg focus-within:shadow-lg">
      <CardHeader className="p-0">
        {book.coverImage && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverImage}
            alt={book.title}
            onError={() => setImgError(true)}
            className="h-56 w-full object-cover"
          />
        ) : (
          <div className="h-56 w-full grid place-items-center bg-accent/30 text-muted-foreground">
            <ImageOff className="h-10 w-10" aria-hidden="true" />
            <span className="sr-only">Cover image not available</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2 p-4">
        <h3 className="text-base font-semibold line-clamp-1" title={book.title}>{book.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-1" aria-label={`Author ${book.author}`}>{book.author}</p>
        <p className="text-sm text-muted-foreground line-clamp-2" title={book.description}>{book.description}</p>
      </CardContent>
      <Separator />
      <CardFooter className="p-4 flex items-center justify-between gap-2">
        <Badge variant="secondary" className="text-xs">{formatCurrency(book.price)}</Badge>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit?.(book)}
            aria-label={`Edit ${book.title}`}
          >
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              aria-label={`Delete ${book.title}`}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Delete
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

export function BookGridNew({ books, loading, onEdit, onDelete }: BookGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="h-56 w-full bg-muted animate-pulse" />
            <CardContent className="space-y-2 p-4">
              <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
            </CardContent>
            <CardFooter className="p-4 flex items-center justify-between">
              <div className="h-6 w-20 bg-muted rounded animate-pulse" />
              <div className="flex gap-2">
                <div className="h-9 w-16 bg-muted rounded animate-pulse" />
                <div className="h-9 w-20 bg-muted rounded animate-pulse" />
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-[320px]"
      >
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="text-muted-foreground mb-4">
              <BookOpen className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No books yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Get started by adding your first book to the collection.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6"
    >
      {books.map((book, idx) => (
        <motion.div
          key={book.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(idx * 0.04, 0.4) }}
        >
          <BookCard book={book} onEdit={onEdit} onDelete={onDelete} />
        </motion.div>
      ))}
    </motion.div>
  );
}