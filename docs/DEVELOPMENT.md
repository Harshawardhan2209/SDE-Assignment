# Development Guide

This guide provides detailed information for developers working on the Book Library application.

## Table of Contents

- [Getting Started](#getting-started)
- [Project Architecture](#project-architecture)
- [Code Organization](#code-organization)
- [Development Workflow](#development-workflow)
- [Component Guide](#component-guide)
- [State Management](#state-management)
- [Styling Guide](#styling-guide)
- [Testing](#testing)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Development Environment Setup

1. **Node.js Requirements**
   - Node.js 18.x or later
   - npm 8.x or later (or yarn 1.22.x+)

2. **IDE Recommendations**
   - Visual Studio Code with extensions:
     - TypeScript and JavaScript Language Features
     - Tailwind CSS IntelliSense
     - ESLint
     - Prettier
     - Next.js snippets

3. **Browser Development Tools**
   - Chrome DevTools
   - React Developer Tools extension

### Local Development Setup

```bash
# Clone and navigate
git clone //
cd //

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev
```

## Project Architecture

### Next.js 14 App Router

This project uses the new Next.js 14 App Router with the following conventions:

- **File-based routing**: Routes are defined by the file structure in the `app` directory
- **Server Components**: Components render on the server by default
- **Client Components**: Marked with `"use client"` directive when needed
- **Server Actions**: Functions marked with `"use server"` for backend operations

### Directory Structure Explained

```
app/
├── [id]/           # Dynamic route for individual book pages
├── add/            # Static route for adding books
├── fonts/          # Font assets
├── globals.css     # Global CSS styles
├── layout.tsx      # Root layout (wraps all pages)
└── page.tsx        # Home page component

actions/
├── actions.ts      # Server action wrappers
└── data.ts         # API integration functions

components/
├── BookCard.tsx    # Book display component
└── Header.tsx      # Navigation component

docs/               # Documentation files
└── ...
```

### Data Flow Architecture

```
Frontend (Next.js) → Server Actions → AWS API Gateway → Lambda Functions → DynamoDB
```

## Code Organization

### TypeScript Configuration

The project uses strict TypeScript configuration:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Import Order Convention

```typescript
// 1. React and Next.js imports
import React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

// 2. Third-party libraries
import clsx from 'clsx';

// 3. Local imports (actions, components, types)
import { getBooks } from '@/actions/data';
import BookCard from '@/components/BookCard';
import { IBook } from '@/types';
```

### File Naming Conventions

- **Components**: PascalCase (e.g., `BookCard.tsx`)
- **Pages**: lowercase (e.g., `page.tsx`)
- **Actions**: camelCase (e.g., `actions.ts`)
- **Types**: PascalCase with interface prefix (e.g., `IBook`)

## Development Workflow

### Feature Development Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/book-search
   ```

2. **Development Cycle**
   - Make changes
   - Test locally
   - Run linting: `npm run lint`
   - Build check: `npm run build`

3. **Code Review**
   - Create pull request
   - Ensure tests pass
   - Get team review

4. **Merge and Deploy**
   - Merge to main branch
   - Deploy to staging/production

### Development Scripts

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint issues automatically
```

## Component Guide

### Component Architecture

All components follow these principles:
- **Single Responsibility**: Each component has one clear purpose
- **Prop Typing**: All props are strictly typed with TypeScript
- **Error Boundaries**: Components handle errors gracefully
- **Accessibility**: ARIA labels and semantic HTML

### BookCard Component

**Purpose**: Display individual book information with navigation

```typescript
interface BookCardProps {
  book: IBook;
}

// Usage
<BookCard book={bookData} />
```

**Key Features**:
- Displays book title, author, and price
- Navigation to book detail page
- Responsive design with Tailwind CSS

### Header Component

**Purpose**: Application navigation and branding

**Key Features**:
- Home navigation link
- "Add Book" call-to-action button
- Responsive navigation menu

### Creating New Components

1. **Component Template**:
```typescript
import { FC } from 'react';

interface ComponentNameProps {
  // Define props here
}

const ComponentName: FC<ComponentNameProps> = ({ prop1, prop2 }) => {
  return (
    <div className="component-container">
      {/* Component content */}
    </div>
  );
};

export default ComponentName;
```

2. **Add to exports** (if creating an index file):
```typescript
export { default as ComponentName } from './ComponentName';
```

## State Management

### React Hooks Pattern

The application uses React hooks for state management:

```typescript
// Local component state
const [book, setBook] = useState<IBook | null>(null);
const [error, setError] = useState<string | null>(null);
const [loading, setLoading] = useState(false);

// Effects for data fetching
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await getData();
      setBook(result);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
}, []);
```

### Server State Management

Server actions handle backend communication:

```typescript
// Server action pattern
"use server";

export const createBook = async (data: IBook) => {
  try {
    const result = await putBook(data);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### Form State Patterns

```typescript
// Form handling pattern
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setBook(prev => ({
    ...prev,
    [name]: name === 'price' ? parseFloat(value) : value
  }));
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    await submitAction(book);
    router.push('/');
  } catch (error) {
    setError('Submission failed');
  }
};
```

## Styling Guide

### Tailwind CSS Usage

The project uses Tailwind CSS with custom color palette:

```typescript
// Custom colors (tailwind.config.ts)
colors: {
  "text-color": "#0f212a",
  "text-hover": "#162832",
  "btn-color": "#023047",
}
```

### Component Styling Patterns

```typescript
// Button styling pattern
<button className="py-2 px-4 bg-btn-color text-white rounded hover:bg-text-hover transition duration-200">
  Button Text
</button>

// Form input pattern
<input 
  className="w-full p-2 mt-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-text-color"
  type="text"
  {...props}
/>

// Card styling pattern
<div className="p-6 bg-slate-100 rounded-lg shadow-lg">
  Card Content
</div>
```

### Responsive Design

```typescript
// Grid responsive pattern
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
  {items.map(item => <Card key={item.id} item={item} />)}
</div>

// Text responsive pattern
<h2 className="text-xl md:text-2xl lg:text-4xl font-semibold">
  Responsive Heading
</h2>
```

### CSS Organization

1. **Global Styles**: Defined in `app/globals.css`
2. **Component Styles**: Use Tailwind classes inline
3. **Custom Utilities**: Add to Tailwind config if needed

## Testing

### Testing Strategy

Currently, the project focuses on:
1. **Manual Testing**: Development server testing
2. **TypeScript Validation**: Compile-time error checking
3. **ESLint**: Code quality validation

### Future Testing Implementation

```typescript
// Component testing with Jest and React Testing Library
import { render, screen } from '@testing-library/react';
import BookCard from '../BookCard';

test('renders book information', () => {
  const mockBook = {
    id: 1,
    title: 'Test Book',
    author: 'Test Author',
    price: 19.99,
    description: 'Test description'
  };
  
  render(<BookCard book={mockBook} />);
  
  expect(screen.getByText('Test Book')).toBeInTheDocument();
  expect(screen.getByText('by Test Author')).toBeInTheDocument();
});
```

### Testing Commands (Future)

```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run test:e2e      # Run end-to-end tests
```

## Best Practices

### Code Quality

1. **TypeScript First**: Always use proper typing
2. **Error Handling**: Implement try-catch blocks
3. **Loading States**: Show loading indicators
4. **Validation**: Validate all user inputs
5. **Accessibility**: Use semantic HTML and ARIA labels

### Performance Optimization

```typescript
// Dynamic imports for code splitting
const LazyComponent = dynamic(() => import('./LazyComponent'), {
  loading: () => <p>Loading...</p>
});

// Image optimization
import Image from 'next/image';
<Image src="/book-cover.jpg" alt="Book cover" width={300} height={400} />

// Server component optimization
export const dynamic = 'force-dynamic'; // Only when necessary
```

### Security Practices

1. **Environment Variables**: Never commit secrets
2. **Input Sanitization**: Validate all inputs
3. **HTTPS Only**: Ensure secure connections
4. **Error Messages**: Don't expose internal details

### Git Workflow

```bash
# Commit message format
git commit -m "feat: add book search functionality"
git commit -m "fix: resolve pagination bug"
git commit -m "docs: update development guide"

# Types: feat, fix, docs, style, refactor, test, chore
```

## Troubleshooting

### Common Development Issues

1. **TypeScript Errors**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   npm run dev
   ```

2. **Environment Variables Not Loading**
   ```bash
   # Check file name (.env.local)
   # Restart development server
   # Ensure variables start with NEXT_PUBLIC_ for client-side access
   ```

3. **Styling Issues**
   ```bash
   # Clear Tailwind cache
   npx tailwindcss -i ./app/globals.css -o ./output.css --watch
   ```

4. **API Connection Issues**
   - Verify `AWS_API_URL` environment variable
   - Check API Gateway CORS configuration
   - Validate Lambda function deployment

### Debug Workflow

1. **Console Logging**:
   ```typescript
   console.log('Debug data:', data);
   console.error('Error occurred:', error);
   ```

2. **React DevTools**:
   - Install React DevTools browser extension
   - Inspect component state and props

3. **Network Tab**:
   - Monitor API requests and responses
   - Check for CORS errors

4. **Next.js Debug Mode**:
   ```bash
   DEBUG=* npm run dev
   ```

### Performance Debugging

```typescript
// Profile component rendering
import { Profiler } from 'react';

<Profiler id="BookList" onRender={(id, phase, actualDuration) => {
  console.log('Profiling:', id, phase, actualDuration);
}}>
  <BookList />
</Profiler>
```

### Getting Help

1. **Check Documentation**: Review README and API docs
2. **Search Issues**: Look for similar problems in GitHub issues
3. **Debug Steps**: Follow systematic debugging approach
4. **Community**: Ask questions in appropriate forums

Remember to always test changes thoroughly and follow the established patterns for consistency across the codebase.
