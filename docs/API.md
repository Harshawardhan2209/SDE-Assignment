# API Documentation

This document outlines the AWS Lambda API endpoints required for the Book Library application.

## Base URL

```
https://your-api-gateway-url.amazonaws.com/prod
```

## Authentication

Currently, this API does not require authentication. For production use, consider implementing:
- AWS Cognito
- API Keys
- JWT tokens

## Endpoints

### 1. Get All Books

**Endpoint:** `GET /books`

**Description:** Retrieves all books from the DynamoDB table.

**Request:**
```http
GET /books
Content-Type: application/json
```

**Response:**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": 1234,
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "price": 12.99,
      "description": "A classic American novel about the Jazz Age."
    },
    {
      "id": 5678,
      "title": "To Kill a Mockingbird",
      "author": "Harper Lee",
      "price": 14.99,
      "description": "A gripping tale of racial injustice and childhood innocence."
    }
  ]
}
```

**Error Response:**
```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "Failed to retrieve books"
}
```

---

### 2. Get Book by ID

**Endpoint:** `GET /books/{id}`

**Description:** Retrieves a specific book by its ID.

**Path Parameters:**
- `id` (number, required): The unique identifier of the book

**Request:**
```http
GET /books/1234
Content-Type: application/json
```

**Success Response:**
```json
{
  "statusCode": 200,
  "data": {
    "id": 1234,
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "price": 12.99,
    "description": "A classic American novel about the Jazz Age."
  }
}
```

**Not Found Response:**
```json
{
  "statusCode": 404,
  "message": "not found"
}
```

**Error Response:**
```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "Failed to retrieve book"
}
```

---

### 3. Create or Update Book

**Endpoint:** `PUT /books`

**Description:** Creates a new book or updates an existing one. If a book with the same ID exists, it will be updated; otherwise, a new book will be created.

**Request Body:**
```json
{
  "id": 1234,
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "price": 12.99,
  "description": "A classic American novel about the Jazz Age."
}
```

**Request:**
```http
PUT /books
Content-Type: application/json

{
  "id": 1234,
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "price": 12.99,
  "description": "A classic American novel about the Jazz Age."
}
```

**Success Response:**
```json
{
  "statusCode": 200,
  "message": "Book created/updated successfully",
  "data": {
    "id": 1234,
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "price": 12.99,
    "description": "A classic American novel about the Jazz Age."
  }
}
```

**Validation Error Response:**
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Missing required fields: title, author, price, description"
}
```

**Error Response:**
```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "Failed to create/update book"
}
```

---

### 4. Delete Book

**Endpoint:** `DELETE /books/{id}`

**Description:** Deletes a specific book by its ID.

**Path Parameters:**
- `id` (number, required): The unique identifier of the book to delete

**Request:**
```http
DELETE /books/1234
Content-Type: application/json
```

**Success Response:**
```json
{
  "statusCode": 200,
  "message": "Book deleted successfully"
}
```

**Not Found Response:**
```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Book not found"
}
```

**Error Response:**
```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "Failed to delete book"
}
```

## Data Model

### Book Schema

```typescript
interface IBook {
  id: number;          // Unique identifier (auto-generated in frontend)
  title: string;       // Book title (required)
  author: string;      // Author name (required)
  price: number;       // Book price in decimal format (required)
  description: string; // Book description (required)
}
```

### Field Validation

- **id**: Must be a positive integer
- **title**: String, max 255 characters, cannot be empty
- **author**: String, max 255 characters, cannot be empty
- **price**: Number, must be positive, supports decimal places
- **description**: String, max 1000 characters, cannot be empty

## CORS Configuration

Ensure your API Gateway has CORS configured for your domain:

```json
{
  "Access-Control-Allow-Origin": "https://your-domain.com",
  "Access-Control-Allow-Methods": "GET,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token"
}
```

For development, you may use `*` for the origin, but this is not recommended for production.

## Rate Limiting

Consider implementing rate limiting in API Gateway to prevent abuse:
- **Burst limit**: 100 requests per second
- **Rate limit**: 1000 requests per day per IP

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "statusCode": number,
  "error": "Error Type",
  "message": "Detailed error message"
}
```

Common HTTP status codes used:
- `200`: Success
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `500`: Internal Server Error

## Testing the API

### Using curl

```bash
# Get all books
curl -X GET "https://your-api-gateway-url.amazonaws.com/prod/books"

# Get specific book
curl -X GET "https://your-api-gateway-url.amazonaws.com/prod/books/1234"

# Create/Update book
curl -X PUT "https://your-api-gateway-url.amazonaws.com/prod/books" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1234,
    "title": "Test Book",
    "author": "Test Author",
    "price": 19.99,
    "description": "A test book description"
  }'

# Delete book
curl -X DELETE "https://your-api-gateway-url.amazonaws.com/prod/books/1234"
```

### Using Postman

Import the following collection to test all endpoints:

1. Create a new collection named "Book Library API"
2. Add the base URL as a collection variable
3. Create requests for each endpoint as documented above
4. Add environment variables for easy testing

## Performance Considerations

- **DynamoDB**: Configure appropriate read/write capacity units
- **Lambda**: Set memory allocation based on payload size
- **API Gateway**: Enable caching for GET requests
- **Connection Pooling**: Reuse DynamoDB client instances in Lambda

## Security Best Practices

1. **Input Validation**: Always validate input data
2. **SQL Injection**: Not applicable for DynamoDB, but validate data types
3. **Authentication**: Implement API keys or JWT for production
4. **HTTPS Only**: Ensure all API calls use HTTPS
5. **Logging**: Log all API requests for monitoring and debugging
