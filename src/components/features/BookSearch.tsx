'use client';

import { useEffect, useState } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';

export interface BookSearchProps {
  onSearch?: (query: string) => void;
  onFilter?: (filters: FilterOptions) => void;
  totalResults?: number;
}

export interface FilterOptions {
  genre?: string;
  priceRange?: [number, number];
  rating?: number;
  sortBy?: 'title' | 'author' | 'price' | 'rating' | 'date';
  sortOrder?: 'asc' | 'desc';
}

const GENRES = [
  'Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy',
  'Mystery', 'Thriller', 'Romance', 'Biography',
  'History', 'Science', 'Self-Help', 'Business',
];

export function BookSearch({ onSearch, onFilter, totalResults }: BookSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({});
  
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Trigger search when debounced value changes
  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedSearch);
    }
  }, [debouncedSearch, onSearch]);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (onFilter) {
      onFilter(newFilters);
    }
  };

  const clearFilters = () => {
    setFilters({});
    if (onFilter) {
      onFilter({});
    }
  };

  const activeFilterCount = Object.keys(filters).length;

  return (
    <div className="space-y-4 mb-6 md:mb-8">
      {/* Header: Search + Results + Filters */}
      <div className="pr-5">{/* ensure ~20px right padding inside container */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Left cluster: Search and results count */}
          <div className="flex-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search books, authors, or ISBN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
                aria-label="Search books"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
            {totalResults !== undefined && (
              <p className="text-sm text-gray-600 dark:text-gray-400 shrink-0">
                Found <strong>{totalResults}</strong> book{totalResults !== 1 && 's'}
                {searchQuery && ` for "${searchQuery}"`}
              </p>
            )}
          </div>

          {/* Right: Filters button */}
          <div className="flex justify-end">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="secondary"
              className="whitespace-nowrap"
              aria-expanded={showFilters}
              aria-controls="filters-panel"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="primary" size="sm" className="ml-2">
                  {activeFilterCount}
                </Badge>
              )}
              <ChevronDown
                className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`}
              />
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mt-6" // ensure separation from header
            id="filters-panel"
          >
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Genre Filter */}
                <Select
                  label="Genre"
                  value={filters.genre || ''}
                  onChange={(e) => handleFilterChange('genre', e.target.value || undefined)}
                >
                  <option value="">All Genres</option>
                  {GENRES.map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </Select>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price Range
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      min="0"
                      value={filters.priceRange?.[0] || ''}
                      onChange={(e) => {
                        const min = Number(e.target.value);
                        const max = filters.priceRange?.[1] || 999;
                        handleFilterChange('priceRange', min ? [min, max] : undefined);
                      }}
                      className="w-24"
                    />
                    <span className="text-gray-500">-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      min="0"
                      value={filters.priceRange?.[1] || ''}
                      onChange={(e) => {
                        const max = Number(e.target.value);
                        const min = filters.priceRange?.[0] || 0;
                        handleFilterChange('priceRange', max ? [min, max] : undefined);
                      }}
                      className="w-24"
                    />
                  </div>
                </div>

                {/* Rating Filter */}
                <Select
                  label="Minimum Rating"
                  value={filters.rating || ''}
                  onChange={(e) => handleFilterChange('rating', Number(e.target.value) || undefined)}
                >
                  <option value="">Any Rating</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                  <option value="1">1+ Stars</option>
                </Select>

                {/* Sort Options */}
                <Select
                  label="Sort By"
                  value={`${filters.sortBy || 'title'}-${filters.sortOrder || 'asc'}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-');
                    handleFilterChange('sortBy', sortBy as any);
                    handleFilterChange('sortOrder', sortOrder as any);
                  }}
                >
                  <option value="title-asc">Title (A-Z)</option>
                  <option value="title-desc">Title (Z-A)</option>
                  <option value="author-asc">Author (A-Z)</option>
                  <option value="author-desc">Author (Z-A)</option>
                  <option value="price-asc">Price (Low to High)</option>
                  <option value="price-desc">Price (High to Low)</option>
                  <option value="rating-desc">Rating (High to Low)</option>
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                </Select>
              </div>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {activeFilterCount} filter{activeFilterCount !== 1 && 's'} applied
                  </span>
                  <Button
                    onClick={clearFilters}
                    variant="ghost"
                    size="sm"
                  >
                    Clear All
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Count moved into header above */}
    </div>
  );
}