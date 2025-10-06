# Kyaari OMS Backend

A comprehensive Order Management System (OMS) backend built with Node.js, Express, TypeScript, Prisma ORM, and PostgreSQL.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Order Management**: Complete order lifecycle from creation to fulfillment
- **Vendor Management**: Vendor registration, approval, and assignment tracking
- **Dispatch Management**: Create dispatches with AWB tracking and S3 file uploads
- **Goods Receipt Notes (GRN)**: Automatic discrepancy detection and verification
- **Audit Logging**: Complete audit trail for all critical operations
- **File Storage**: AWS S3 integration for dispatch proof uploads

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.x or higher ([Download](https://nodejs.org/))
- **npm**: v9.x or higher (comes with Node.js)
- **PostgreSQL**: v14.x or higher ([Download](https://www.postgresql.org/download/))
- **AWS Account**: For S3 file storage (optional for initial development)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Dev07-Harsh/Kyari.git
cd Kyari/kyaari-oms/backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/kyaari_oms"

# Server
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-with-at-least-32-characters-for-hs256-algorithm-security"
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d

# Initial Admin User
INIT_ADMIN_NAME="Admin"
INIT_ADMIN_PASSWORD="Admin@123"
INIT_ADMIN_EMAIL="admin@kyaari.com"

# Security
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# AWS S3 Configuration (Required for dispatch proof uploads)
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=kyaari-dispatch-proofs
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
S3_PRESIGNED_URL_EXPIRY=900
```

### 4. Database Setup

#### Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE kyaari_oms;

# Exit psql
\q
```

#### Run Prisma Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Optional: Seed initial data
npm run seed
```

**Note**: If you encounter enum-related migration errors, see the [Troubleshooting](#troubleshooting) section below.

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

The server will start on `http://localhost:3000` with hot-reload enabled.

### Production Mode

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

### Available Scripts

```bash
npm run dev          # Start development server with hot-reload
npm run build        # Compile TypeScript to JavaScript
npm start            # Start production server
npm run seed         # Seed database with initial data
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

## 📊 Database Management

### Prisma Commands

```bash
# Generate Prisma Client (after schema changes)
npx prisma generate

# Create a new migration
npx prisma migrate dev --name description_of_changes

# Apply migrations in production
npx prisma migrate deploy

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Open Prisma Studio (Database GUI)
npx prisma studio

# Check migration status
npx prisma migrate status

# Resolve failed migrations
npx prisma migrate resolve --rolled-back migration_name
```

### Database Schema

The database includes the following main models:

- **User**: Authentication and user management
- **VendorProfile**: Vendor-specific information
- **Order**: Order lifecycle management
- **OrderItem**: Individual order items
- **AssignedOrderItem**: Assignment tracking with vendor confirmations
- **Dispatch**: Dispatch records with AWB tracking
- **DispatchItem**: Items in each dispatch
- **GoodsReceiptNote**: Store verification records
- **GoodsReceiptItem**: Item-level verification details
- **Attachment**: S3 file metadata
- **AuditLog**: Complete audit trail

## 🔐 Authentication & Roles

The system supports multiple user roles:

- **ADMIN**: Full system access
- **VENDOR**: Vendor-specific operations
- **ACCOUNTS**: Financial operations
- **OPS**: Operations and verification

### Default Admin Credentials

After running migrations and seed:
- **Email**: `admin@kyaari.com`
- **Password**: `Admin@123`

### JWT Tokens

- **Access Token**: 15-minute expiry
- **Refresh Token**: 7-day expiry
- Algorithm: HS256

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts               # Database seeding
│   └── migrations/           # Migration files
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.ts      # Prisma client
│   │   ├── env.ts          # Environment variables
│   │   ├── s3.config.ts    # AWS S3 configuration
│   │   └── constants.ts    # Application constants
│   ├── controllers/         # Route controllers
│   │   ├── dispatch.controller.ts
│   │   └── grn.controller.ts
│   ├── middlewares/         # Express middlewares
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── upload.middleware.ts
│   ├── modules/            # Feature modules
│   │   ├── auth/          # Authentication
│   │   ├── admin/         # Admin operations
│   │   ├── orders/        # Order management
│   │   ├── assignments/   # Assignment tracking
│   │   ├── dispatch/      # Dispatch management
│   │   └── grn/          # Goods receipt notes
│   ├── routes/            # Route definitions
│   ├── services/          # Business logic
│   │   ├── dispatch.service.ts
│   │   ├── grn.service.ts
│   │   └── s3.service.ts
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── app.ts            # Express app setup
│   └── server.ts         # Server entry point
├── .env                  # Environment variables
├── .env.example         # Environment template
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript configuration
```

## 🔧 API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication (`/api/auth`)
- `POST /api/auth/login` - User login
- `POST /api/auth/register/vendor` - Vendor registration
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Current user details
- `POST /api/auth/logout` - Logout

### Admin Operations (`/api/admin`)
- `POST /api/admin/users` - Create user
- `GET /api/admin/users` - List users
- `GET /api/admin/users/:userId` - User details
- `PUT /api/admin/vendors/:userId/approve` - Approve vendor
- `PUT /api/admin/vendors/:userId/suspend` - Suspend vendor

### Order Management (`/api/orders`)
- `POST /api/orders` - Create order
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Order details
- `PUT /api/orders/:id/status` - Update status
- `PUT /api/orders/:id/cancel` - Cancel order

### Vendor Assignments (`/api/assignments`)
- `GET /api/assignments/my` - Vendor's assignments
- `GET /api/assignments/:id` - Assignment details
- `PATCH /api/assignments/:id/status` - Update assignment status

### Dispatch Management (`/api/dispatches`)
- `POST /api/dispatches` - Create dispatch
- `GET /api/dispatches/my` - List dispatches
- `GET /api/dispatches/:id` - Dispatch details
- `POST /api/dispatches/:id/upload-proof` - Upload dispatch proof

### Goods Receipt Notes (`/api/grn`)
- `POST /api/grn` - Create GRN
- `GET /api/grn/:id` - GRN details
- `GET /api/grn` - List GRNs

For detailed API documentation, see [POSTMAN_README.md](./POSTMAN_README.md).

## 🧪 Testing

### Using Postman

1. Import the Postman collection: `Kyaari_OMS_API.postman_collection.json`
2. Import the environment: `Kyaari_OMS_Environment.postman_environment.json`
3. Login to get authentication tokens
4. Test endpoints as documented in [POSTMAN_README.md](./POSTMAN_README.md)

### Manual Testing with cURL

```bash
# Health check
curl http://localhost:3000/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@kyaari.com",
    "password": "Admin@123"
  }'

# Use the token in subsequent requests
curl -X GET http://localhost:3000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## ☁️ AWS S3 Setup

For dispatch proof uploads, configure AWS S3:

### 1. Create S3 Bucket

```bash
# Using AWS CLI
aws s3 mb s3://kyaari-dispatch-proofs --region us-east-1
```

### 2. Set Bucket Policy (Private)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::kyaari-dispatch-proofs/*",
      "Condition": {
        "StringNotEquals": {
          "aws:PrincipalAccount": "YOUR_AWS_ACCOUNT_ID"
        }
      }
    }
  ]
}
```

### 3. Create IAM User

Create an IAM user with the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::kyaari-dispatch-proofs/*"
    }
  ]
}
```

### 4. Add Credentials to .env

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

## 🐛 Troubleshooting

### Database Migration Errors

**Issue**: Enum-related migration errors with PostgreSQL

```
ERROR: unsafe use of new value "PENDING" of enum type "DispatchStatus"
```

**Solution**: PostgreSQL requires enum modifications to be in separate transactions.

```bash
# Mark failed migration as rolled back
npx prisma migrate resolve --rolled-back migration_name

# Delete failed migration folder
rm -rf prisma/migrations/migration_name

# Create new migration
npx prisma migrate dev --name fix_enum_values
```

### Port Already in Use

**Issue**: Port 3000 is already in use

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 PID

# Or change PORT in .env file
PORT=3001
```

### PostgreSQL Connection Error

**Issue**: Cannot connect to PostgreSQL

**Solution**:
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql@14

# Start PostgreSQL (Linux)
sudo systemctl start postgresql

# Verify DATABASE_URL in .env is correct
```

### Prisma Client Not Generated

**Issue**: `@prisma/client` not found

**Solution**:
```bash
# Generate Prisma Client
npx prisma generate

# Reinstall dependencies
npm install
```

### AWS S3 Upload Errors

**Issue**: File upload to S3 fails

**Solution**:
1. Verify AWS credentials in `.env`
2. Check bucket exists and has correct permissions
3. Verify IAM user has `s3:PutObject` permission
4. Check file size (max 10MB)
5. Verify MIME type is allowed

