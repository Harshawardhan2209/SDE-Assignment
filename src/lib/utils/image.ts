export const CLOUDINARY_FOLDER = "book-covers";

export function getBookImageKey(bookId: number | string): string {
  return `book-${String(bookId)}`;
}

export function getBookImageUrl(bookId: number | string): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
  const key = getBookImageKey(bookId);
  if (cloudName) {
    // No extension: Cloudinary will serve default format
    return `https://res.cloudinary.com/${cloudName}/image/upload/${CLOUDINARY_FOLDER}/${key}`;
  }
  // Fallback to local static uploads folder
  return `/uploads/${CLOUDINARY_FOLDER}/${key}.jpg`;
}


