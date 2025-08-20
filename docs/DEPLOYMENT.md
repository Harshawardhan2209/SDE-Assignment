# Deployment Guide

This comprehensive guide covers setting up AWS infrastructure and deploying the Book Library application.

## Table of Contents

- [AWS Infrastructure Setup](#aws-infrastructure-setup)
- [DynamoDB Configuration](#dynamodb-configuration)
- [Lambda Functions](#lambda-functions)
- [API Gateway Setup](#api-gateway-setup)
- [Environment Configuration](#environment-configuration)
- [Frontend Deployment](#frontend-deployment)
- [Production Considerations](#production-considerations)
- [Monitoring and Logging](#monitoring-and-logging)
- [Troubleshooting](#troubleshooting)

## AWS Infrastructure Setup

### Prerequisites

1. **AWS Account**: Active AWS account with appropriate permissions
2. **AWS CLI**: Installed and configured (optional but recommended)
3. **IAM Permissions**: Admin access or specific permissions for:
   - DynamoDB
   - Lambda
   - API Gateway
   - IAM
   - CloudWatch

### AWS CLI Configuration (Optional)

```bash
# Install AWS CLI
# macOS: brew install awscli
# Windows: Download from AWS website
# Linux: pip install awscli

# Configure AWS CLI
aws configure
# Enter your Access Key ID
# Enter your Secret Access Key
# Enter your region (e.g., us-east-1)
# Enter output format (json)
```

## DynamoDB Configuration

### 1. Create DynamoDB Table

**Using AWS Console:**

1. Navigate to DynamoDB service
2. Click "Create Table"
3. Configure table settings:
   - **Table name**: `Books`
   - **Primary key**: `id` (Number)
   - **Settings**: Use default settings for development
   - **Capacity**: On-demand billing mode (recommended for development)

**Using AWS CLI:**

```bash
aws dynamodb create-table \
    --table-name Books \
    --attribute-definitions \
        AttributeName=id,AttributeType=N \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
```

### 2. Table Schema

```json
{
  "TableName": "Books",
  "AttributeDefinitions": [
    {
      "AttributeName": "id",
      "AttributeType": "N"
    }
  ],
  "KeySchema": [
    {
      "AttributeName": "id",
      "KeyType": "HASH"
    }
  ],
  "BillingMode": "PAY_PER_REQUEST"
}
```

### 3. Sample Data (Optional)

Add test data using AWS Console or CLI:

```bash
aws dynamodb put-item \
    --table-name Books \
    --item '{
        "id": {"N": "1"},
        "title": {"S": "The Great Gatsby"},
        "author": {"S": "F. Scott Fitzgerald"},
        "price": {"N": "12.99"},
        "description": {"S": "A classic American novel."}
    }'
```

## Lambda Functions

### 1. IAM Role for Lambda

Create an IAM role with DynamoDB permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Scan",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:REGION:ACCOUNT:table/Books"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

### 2. Lambda Function Code

Create four Lambda functions for CRUD operations:

#### Get All Books Function

```javascript
// getAllBooks.js
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,OPTIONS'
    };
    
    try {
        const params = {
            TableName: 'Books'
        };
        
        const result = await dynamodb.scan(params).promise();
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                data: result.Items
            })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Failed to retrieve books',
                message: error.message
            })
        };
    }
};
```

#### Get Single Book Function

```javascript
// getBook.js
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,OPTIONS'
    };
    
    try {
        const bookId = parseInt(event.pathParameters.id);
        
        const params = {
            TableName: 'Books',
            Key: { id: bookId }
        };
        
        const result = await dynamodb.get(params).promise();
        
        if (!result.Item) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    message: 'not found'
                })
            };
        }
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                data: result.Item
            })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Failed to retrieve book',
                message: error.message
            })
        };
    }
};
```

#### Create/Update Book Function

```javascript
// putBook.js
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'PUT,OPTIONS'
    };
    
    try {
        const book = JSON.parse(event.body);
        
        // Validate required fields
        if (!book.title || !book.author || !book.price || !book.description) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Missing required fields',
                    message: 'title, author, price, and description are required'
                })
            };
        }
        
        const params = {
            TableName: 'Books',
            Item: {
                id: book.id,
                title: book.title,
                author: book.author,
                price: book.price,
                description: book.description
            }
        };
        
        await dynamodb.put(params).promise();
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'Book created/updated successfully',
                data: book
            })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Failed to create/update book',
                message: error.message
            })
        };
    }
};
```

#### Delete Book Function

```javascript
// deleteBook.js
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'DELETE,OPTIONS'
    };
    
    try {
        const bookId = parseInt(event.pathParameters.id);
        
        const params = {
            TableName: 'Books',
            Key: { id: bookId }
        };
        
        await dynamodb.delete(params).promise();
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'Book deleted successfully'
            })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Failed to delete book',
                message: error.message
            })
        };
    }
};
```

### 3. Deploy Lambda Functions

**Using AWS Console:**

1. Navigate to Lambda service
2. Create function for each operation
3. Copy the respective code
4. Set runtime to Node.js 18.x or later
5. Configure environment variables if needed
6. Attach the IAM role created earlier

**Using AWS CLI:**

```bash
# Create deployment package
zip -r getAllBooks.zip getAllBooks.js

# Create function
aws lambda create-function \
    --function-name getAllBooks \
    --runtime nodejs18.x \
    --role arn:aws:iam::ACCOUNT:role/lambda-dynamodb-role \
    --handler getAllBooks.handler \
    --zip-file fileb://getAllBooks.zip

# Repeat for other functions
```

## API Gateway Setup

### 1. Create REST API

1. Navigate to API Gateway service
2. Create new REST API
3. Choose "REST API" (not private)
4. API name: `BookLibraryAPI`

### 2. Create Resources and Methods

**Resource Structure:**
```
/
├── books (Resource)
│   ├── GET (Get all books)
│   ├── PUT (Create/update book)
│   └── {id} (Resource)
│       ├── GET (Get single book)
│       └── DELETE (Delete book)
```

**Method Configuration:**

1. **GET /books**
   - Integration type: Lambda Function
   - Function: getAllBooks
   - Enable CORS

2. **PUT /books**
   - Integration type: Lambda Function
   - Function: putBook
   - Enable CORS

3. **GET /books/{id}**
   - Integration type: Lambda Function
   - Function: getBook
   - Enable CORS
   - Path parameter: id

4. **DELETE /books/{id}**
   - Integration type: Lambda Function
   - Function: deleteBook
   - Enable CORS
   - Path parameter: id

### 3. Configure CORS

For each method, enable CORS with these settings:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token
Access-Control-Allow-Methods: GET,PUT,DELETE,OPTIONS
```

### 4. Deploy API

1. Click "Deploy API"
2. Create new deployment stage: `prod`
3. Deploy
4. Note the Invoke URL (e.g., `https://abc123.execute-api.us-east-1.amazonaws.com/prod`)

## Environment Configuration

### 1. Configure Environment Variables

Create `.env.local` in your Next.js project:

```env
AWS_API_URL=https://your-api-gateway-url.execute-api.region.amazonaws.com/prod
```

### 2. Update API URL

Replace `your-api-gateway-url` with the actual API Gateway invoke URL from the previous step.

## Frontend Deployment

### 1. Vercel Deployment (Recommended)

**Step-by-step:**

1. **Prepare Repository**
   ```bash
   git add .
   git commit -m "feat: add AWS backend integration"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Connect your GitHub repository
   - Import the project
   - Configure environment variables:
     - `AWS_API_URL`: Your API Gateway URL

3. **Automatic Deployments**
   - Vercel automatically deploys on every push to main
   - Preview deployments for pull requests

### 2. Alternative Deployment Options

#### Netlify

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy to Netlify:
   - Drag and drop the `.next` folder
   - Or connect GitHub repository
   - Add environment variables in Netlify dashboard

#### AWS Amplify

1. Connect GitHub repository
2. Configure build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm install
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

## Production Considerations

### 1. Security

#### API Gateway Security

```json
{
  "apiKeyRequired": true,
  "authorizationType": "AWS_IAM"
}
```

#### Environment Variables

- Never commit `.env.local` to version control
- Use platform-specific secret management
- Rotate API keys regularly

### 2. Performance Optimization

#### Lambda Optimization

```javascript
// Keep connections alive
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient({
  maxRetries: 3,
  retryDelayOptions: {
    customBackoff: function(retryCount) {
      return Math.pow(2, retryCount) * 100;
    }
  }
});
```

#### API Gateway Caching

Enable caching for GET requests:
- Cache TTL: 300 seconds (5 minutes)
- Cache key parameters: path parameters

#### DynamoDB Optimization

- Use on-demand billing for variable workloads
- Configure auto-scaling for predictable workloads
- Add Global Secondary Indexes for query patterns

### 3. Monitoring and Alerting

#### CloudWatch Metrics

Monitor these metrics:
- Lambda invocation count and duration
- API Gateway 4xx/5xx errors
- DynamoDB throttling and consumed capacity

#### CloudWatch Alarms

```bash
# Create alarm for Lambda errors
aws cloudwatch put-metric-alarm \
    --alarm-name "Lambda-Errors-BookLibrary" \
    --alarm-description "Lambda function errors" \
    --metric-name Errors \
    --namespace AWS/Lambda \
    --statistic Sum \
    --period 300 \
    --threshold 5 \
    --comparison-operator GreaterThanThreshold
```

## Monitoring and Logging

### 1. CloudWatch Logs

Lambda functions automatically log to CloudWatch. Access logs:

1. Navigate to CloudWatch service
2. Go to Log Groups
3. Find `/aws/lambda/FUNCTION_NAME`
4. View log streams for debugging

### 2. API Gateway Logging

Enable access and execution logs:

1. In API Gateway console
2. Go to Stages → prod
3. Enable CloudWatch Logs
4. Set log level to INFO or ERROR

### 3. Custom Logging

Add structured logging to Lambda functions:

```javascript
const log = (level, message, data = {}) => {
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message,
        ...data
    }));
};

// Usage
log('INFO', 'Book created successfully', { bookId: book.id });
log('ERROR', 'Database error', { error: error.message });
```

## Troubleshooting

### Common Issues

#### 1. CORS Errors

**Problem**: Browser blocks API requests
**Solution**: 
- Verify CORS is enabled on API Gateway
- Check preflight OPTIONS requests
- Ensure correct headers are set

#### 2. Lambda Timeout

**Problem**: Functions timeout after 3 seconds (default)
**Solution**:
```bash
aws lambda update-function-configuration \
    --function-name FUNCTION_NAME \
    --timeout 30
```

#### 3. DynamoDB Access Denied

**Problem**: Lambda can't access DynamoDB
**Solution**: 
- Check IAM role permissions
- Verify resource ARNs in policy
- Ensure role is attached to Lambda function

#### 4. API Gateway 502 Errors

**Problem**: Bad Gateway errors
**Solution**:
- Check Lambda function logs
- Verify response format matches API Gateway requirements
- Ensure Lambda function returns proper HTTP response

### Debugging Steps

1. **Check CloudWatch Logs**
   - Lambda execution logs
   - API Gateway access logs

2. **Test Lambda Functions Directly**
   ```bash
   aws lambda invoke \
       --function-name getAllBooks \
       --payload '{}' \
       response.json
   ```

3. **Test API Gateway**
   ```bash
   curl -X GET https://your-api-url/prod/books
   ```

4. **Monitor Metrics**
   - Lambda invocations and errors
   - API Gateway request count and latency


## Cost Optimization

### 1. DynamoDB

- Use on-demand billing for unpredictable workloads
- Monitor consumed capacity units
- Use TTL for temporary data

### 2. Lambda

- Right-size memory allocation
- Minimize cold starts with provisioned concurrency (if needed)
- Use ARM-based Graviton2 processors for cost savings

### 3. API Gateway

- Monitor request volume
- Consider caching for frequently accessed data
- Use WebSocket API for real-time features if needed

## Backup and Disaster Recovery

### 1. DynamoDB Backups

Enable point-in-time recovery:

```bash
aws dynamodb update-continuous-backups \
    --table-name Books \
    --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

### 2. Code Backups

- Maintain code in version control (Git)
- Tag releases for rollback capability
- Document deployment procedures

This completes the comprehensive deployment guide. Follow these steps carefully, and you'll have a fully functional Book Library application running on AWS infrastructure.
