'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookGridNew } from '@/components/BookGridNew';
import { BookSearch, type FilterOptions } from '@/components/features/BookSearch';
import { IBook } from '@/types';

interface BooksExplorerProps {
	books: IBook[];
}

export function BooksExplorer({ books: initialBooks }: BooksExplorerProps) {
	const [query, setQuery] = useState('');
	const [filters, setFilters] = useState<FilterOptions>({});
	const [books, setBooks] = useState<IBook[]>(initialBooks);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const router = useRouter();

	// Update local state when props change (e.g., on page refresh)
	useEffect(() => {
		setBooks(initialBooks);
	}, [initialBooks]);

	const normalizedQuery = useMemo(() => query.trim().toLowerCase(), [query]);

	// Optimistic delete with revalidation
	const handleDeleteBook = async (id: number) => {
		// Optimistic update - immediately remove from UI
		const originalBooks = books;
		setBooks(prevBooks => prevBooks.filter(book => book.id !== id));

		try {
			// Call the delete action
			const { deleteBookAction } = await import('@/lib/actions/deleteBookAction');
			const result = await deleteBookAction(id);

			if (!result.success) {
				// Rollback on failure
				setBooks(originalBooks);
				throw new Error(result.error || 'Delete failed');
			}

			// Revalidate data from server to ensure consistency
			await revalidateBooks();
		} catch (error) {
			console.error('Delete failed:', error);
			// Rollback optimistic update
			setBooks(originalBooks);
			throw error;
		}
	};

	// Revalidate books from server
	const revalidateBooks = async () => {
		try {
			setIsRefreshing(true);
			// Force a fresh fetch from the server
			const response = await fetch('/api/books', {
				method: 'GET',
				cache: 'no-store',
				headers: {
					'Cache-Control': 'no-cache',
				},
			});
			
			if (response.ok) {
				const freshBooks = await response.json();
				setBooks(freshBooks.data || []);
			}
		} catch (error) {
			console.error('Failed to revalidate books:', error);
		} finally {
			setIsRefreshing(false);
		}
	};

	const filteredBooks = useMemo(() => {
		let result = books;

		// Search by title, author, isbn
		if (normalizedQuery) {
			result = result.filter((b) => {
				const haystack = `${b.title ?? ''} ${b.author ?? ''} ${b.isbn ?? ''}`.toLowerCase();
				return haystack.includes(normalizedQuery);
			});
		}

		// Genre filter
		if (filters.genre) {
			result = result.filter((b) => (b.genre ?? '').toLowerCase() === filters.genre!.toLowerCase());
		}

		// Price range
		if (filters.priceRange && (filters.priceRange[0] || filters.priceRange[1])) {
			const [min, max] = filters.priceRange;
			result = result.filter((b) => {
				const price = Number(b.price ?? 0);
				const meetsMin = typeof min === 'number' ? price >= min : true;
				const meetsMax = typeof max === 'number' ? price <= max : true;
				return meetsMin && meetsMax;
			});
		}

		// Rating filter
		if (filters.rating) {
			result = result.filter((b) => Number(b.rating ?? 0) >= Number(filters.rating));
		}

		// Sorting
		if (filters.sortBy) {
			const sortOrder = filters.sortOrder === 'desc' ? -1 : 1;
			result = [...result].sort((a, b) => {
				switch (filters.sortBy) {
					case 'author':
						return (a.author ?? '').localeCompare(b.author ?? '') * sortOrder;
					case 'price':
						return ((a.price ?? 0) - (b.price ?? 0)) * sortOrder;
					case 'rating':
						return ((a.rating ?? 0) - (b.rating ?? 0)) * sortOrder;
					case 'date': {
						const ad = a.publishedDate ? Date.parse(a.publishedDate) : 0;
						const bd = b.publishedDate ? Date.parse(b.publishedDate) : 0;
						return (ad - bd) * sortOrder;
					}
					case 'title':
					default:
						return (a.title ?? '').localeCompare(b.title ?? '') * sortOrder;
				}
			});
		}

		return result;
	}, [books, normalizedQuery, filters]);

	return (
		<div className="mb-8">
			<BookSearch
				onSearch={setQuery}
				onFilter={setFilters}
				totalResults={filteredBooks.length}
			/>
			<BookGridNew 
				books={filteredBooks} 
				loading={isRefreshing}
				onEdit={(b) => router.push(`/${b.id}`)}
				onDelete={handleDeleteBook}
			/>
		</div>
	);
}

export default BooksExplorer;
