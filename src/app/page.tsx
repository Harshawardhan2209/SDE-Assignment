import { getBooks } from "@/lib/data";
import { Navbar } from "@/components/Navbar";
import { BooksExplorer } from "@/components/features/BooksExplorer";
import { IBook } from "@/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  try {
    const response = await getBooks();
    const books: IBook[] = response.data || [];

    return (
      <>
        <Navbar />
        <main className="flex-1 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                Explore Our Collection
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Discover amazing books from various genres and authors. Build your personal library and track your reading journey.
              </p>
            </div>

            <BooksExplorer books={books} />
          </div>
        </main>
      </>
    );
  } catch (error) {
    console.error('Error in Home component:', error);
    return (
      <>
        <Navbar />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Explore Our Collection
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover amazing books from various genres and authors. Build your personal library and track your reading journey.
            </p>
          </div>
          
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">
              Error loading books: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
          
          <BooksExplorer books={[]} />
        </main>
      </>
    );
  }
}