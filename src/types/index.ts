export interface IBook {
  id: number;
  title: string;
  author: string;
  price: number;
  description: string;
  rating?: number;
  reviewCount?: number;
  pages?: number;
  genre?: string;
  isbn?: string;
  publishedDate?: string;
  publisher?: string;
  coverImage?: string;
}
