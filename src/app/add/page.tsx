"use client";

import { useState } from "react";
import { IBook } from "@/types";
import { Navbar } from "@/components/Navbar";
import { BookCoverUpload } from "@/components/BookCoverUpload";
import { useRouter } from "next/navigation";
import { putBookInDB } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, BookOpen } from "lucide-react";

function AddBookPage() {
  // Generate a unique ID for new books
  const [bookId] = useState<number>(() => Date.now());
  const [book, setBook] = useState<IBook>({
    id: bookId,
    title: "",
    author: "",
    price: 0,
    description: "",
    coverImage: "", // Initialize coverImage field
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setBook((prev) => ({
      ...prev,
      [name]: name === "price" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleImageUpload = (imageUrl: string) => {
    console.log('Image uploaded successfully:', imageUrl);
    // Store the Cloudinary URL in the book object
    setBook((prev) => ({
      ...prev,
      coverImage: imageUrl,
    }));
    setIsImageUploading(false);
  };

  const handleImageUploadError = (error: string) => {
    console.error('Image upload failed:', error);
    setError(`Image upload failed: ${error}`);
    setIsImageUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const newBook: IBook = {
        ...book,
        // Ensure a unique numeric id; Dynamo key can be number or string. If you prefer string, change type accordingly.
        id: Date.now(),
        // coverImage is already included from the book state
      };
      console.log('Submitting new book:', newBook);
      const result = await putBookInDB(newBook);
      // Optimistically reset form
      setBook({ id: 0, title: "", author: "", price: 0, description: "", coverImage: "" });
      console.log('Book added successfully:', result);
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error('Error adding book:', error);
      setError(`Failed to add book: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prevent form submission during image upload
  const isFormDisabled = isImageUploading || isSubmitting;

  return (
    <>
      <Navbar />
      
      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <CardTitle>Add New Book</CardTitle>
                </div>
              </div>
              <CardDescription>
                Add a new book to your personal library collection.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Book Cover Upload Section */}
                <BookCoverUpload
                  bookId={bookId}
                  onImageUpload={handleImageUpload}
                  onImageUploadError={handleImageUploadError}
                  currentImage={book.coverImage || null}
                  disabled={isFormDisabled}
                />

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={book.title}
                    onChange={handleChange}
                    placeholder="Enter book title"
                    required
                    disabled={isFormDisabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    name="author"
                    value={book.author}
                    onChange={handleChange}
                    placeholder="Enter author name"
                    required
                    disabled={isFormDisabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={book.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                    disabled={isFormDisabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={book.description}
                    onChange={handleChange}
                    placeholder="Enter book description (optional)"
                    rows={4}
                    disabled={isFormDisabled}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="flex-1"
                    disabled={isFormDisabled}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isFormDisabled}
                    className="flex-1"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          </div>
        </div>
      </main>
    </>
  );
}

export default AddBookPage;
