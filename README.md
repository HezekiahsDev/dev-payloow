Payloow Backend
This is the backend service for the Payloow application, a comprehensive platform that provides services for e-learning, investments, and online shopping. This document provides all the necessary information to get the project running on your local machine.

Table of Contents
Getting Started

Prerequisites

Installation

Environment Variables

Running the Application

Development

Production

API Documentation

Available Scripts

Project Structure

Key Dependencies

Getting Started
Follow these instructions to set up the development environment.

Prerequisites
Ensure you have the following software installed on your system:

Node.js (v16 or later recommended)

npm (usually comes with Node.js)

Docker and Docker Compose

Installation
Clone the repository:

git clone <repository-url>
cd backend

Install project dependencies:

npm install

Set up environment variables:
Create a new file named .env in the backend directory. Copy the contents of .env.example (if it exists) or use the template in the Environment Variables section below.

Start the local Redis instance:
The application requires a Redis instance for caching and session management. A Docker Compose file is provided to easily start one.

docker-compose -f docker-compose.dev.yaml up

If you encounter a permission error, you may need to run this command with sudo or add your user to the docker group.

Environment Variables
The application requires several environment variables for configuration. Create a .env file in the project root and populate it with the following keys. For local development, you can use the default database URLs if MongoDB and Redis are running locally on their default ports.

# General Application Settings

NODE_ENV=development
PORT=5000
ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Security

JWT_SECRET=your_super_secret_jwt_key

# Email Service (e.g., SendGrid, Mailgun)

MAIL_HOST=your_mail_host
MAIL_PORT=your_mail_port
MAIL_USERNAME=your_mail_username
MAIL_PASSWORD=your_mail_password
SECURE=false
DEFAULT_EMAIL_FROM=noreply@yourdomain.com

# AWS Services

AWS_S3_BUCKET_NAME=your_aws_s3_bucket_name
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=your_aws_region
AWS_CLOUDFRONT_DISTRIBUTION_DOMAIN_NAME=your_aws_cloudfront_distribution_domain_name
AWS_CLOUDFRONT_KEY_PAIR_ID=your_aws_cloudfront_key_pair_id
AWS_CLOUDFRONT_PRIVATE_KEY=your_aws_cloudfront_private_key
AWS_S3_SIGNED_URL_EXPIRY_DURATION=1d

# Payment Gateway (Paystack)

PAYSTACK_BASE_URL=https://api.paystack.co
PAYSTACK_SECRET_KEY=your_paystack_secret_key

# VTU Service

VTU_USERNAME=your_vtu_username
VTU_PASSWORD=your_vtu_password
VTU_BASE_URL=https://www.vtpass.com/api

# Database Connections

MONGO_URL=mongodb://127.0.0.1:27017/payloow
REDIS_URL=redis://127.0.0.1:6379

Running the Application
Development
To run the server in development mode with live-reloading enabled via nodemon:

npm run start:dev

The server will start on the PORT specified in your .env file (e.g., http://localhost:5000).

Production
To build the application for production and start the server:

# 1. Build the TypeScript source code

npm run build

# 2. Start the production server

npm start

API Documentation
This project uses Swagger for API documentation. While the server is running, you can access the interactive API documentation by navigating to:

http://localhost:5000/docs

Available Scripts
Here are the main scripts available in the package.json:

npm start: Starts the production server from the dist directory.

npm run start:dev: Starts the development server with nodemon.

npm run build: Transpiles TypeScript code to JavaScript in the dist directory.

npm test: Runs the test suite (if configured).

Project Structure
The project follows a standard layered architecture to separate concerns.

.
├── dist/ # Compiled JavaScript output
├── src/ # TypeScript source code
│ ├── authMiddleware/ # Authentication and authorization middleware
│ ├── config/ # Environment variables and configuration
│ ├── controller/ # Request handlers and business logic
│ ├── database/ # Database connection logic
│ ├── http/ # HTTP client for external requests
│ ├── libraries/ # Wrappers for external libraries (AWS, Mailer)
│ ├── models/ # Mongoose schemas and data models
│ ├── router/ # API routes and endpoints
│ ├── service/ # Core business logic services
│ ├── types/ # TypeScript type definitions
│ └── utils/ # Utility functions
├── docker-compose.dev.yaml # Docker Compose for Redis
├── nodemon.json # Nodemon configuration
├── package.json # Project dependencies and scripts
├── swagger.yaml # OpenAPI (Swagger) specification
└── tsconfig.json # TypeScript compiler options

Key Dependencies
Express: Fast, unopinionated, minimalist web framework for Node.js.

Mongoose: Elegant MongoDB object modeling for Node.js.

jsonwebtoken: For generating and verifying JSON Web Tokens.

Nodemailer: For sending emails from Node.js.

AWS-SDK: The official AWS SDK for JavaScript.

Swagger-UI-Express: For serving auto-generated Swagger UI documentation.

Redis: In-memory data structure store, used as a database, cache, and message broker.
