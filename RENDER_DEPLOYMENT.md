# Render Deployment Guide for Payloow API

This guide will help you deploy your Payloow API to Render using the provided `render.yaml` configuration file.

## Prerequisites

1. A Render account (sign up at [render.com](https://render.com))
2. Your repository pushed to GitHub, GitLab, or Bitbucket
3. All necessary environment variables and secrets

## Deployment Steps

### 1. Connect Your Repository

1. Log into your Render dashboard
2. Click "New +" and select "Blueprint"
3. Connect your Git provider and select your repository
4. Render will automatically detect the `render.yaml` file

### 2. Configure Environment Variables

The `render.yaml` file includes placeholders for environment variables that you need to set in the Render dashboard. Navigate to your service settings and add the following **sensitive** environment variables:

#### Required Environment Variables

**Payment Gateway (Flutterwave):**

- `FLUTTERWAVE_PUBLIC_KEY` - Your Flutterwave public key
- `FLUTTERWAVE_SECRET_KEY` - Your Flutterwave secret key
- `FLUTTERWAVE_ENCRYPTION_KEY` - Your Flutterwave encryption key

**VTU Configuration:**

- `VTU_USERNAME` - Your VTU service username
- `VTU_PASSWORD` - Your VTU service password
- `VTU_BASE_URL` - Your VTU service base URL

**BingPay:**

- `BINGPAY_API_KEY` - Your BingPay API key

**Cloudinary (for file uploads):**

- `CLOUDNAME` - Your Cloudinary cloud name
- `API_KEY` - Your Cloudinary API key
- `API_SECRET` - Your Cloudinary API secret

**AWS Configuration:**

- `AWS_ACCESS_KEY_ID` - Your AWS access key
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret access key
- `AWS_REGION` - Your AWS region (e.g., us-east-1)
- `AWS_S3_BUCKET_NAME` - Your S3 bucket name

**Mail Configuration:**

- `MAIL_HOST` - Your SMTP host (e.g., smtp.gmail.com)
- `MAIL_USERNAME` - Your email username
- `MAIL_PASSWORD` - Your email password or app password
- `MAIL_FROM` - The email address to send from

**Security:**

- `JWT_SECRET` - A strong secret for JWT token signing (generate a random string)

**API Integrations:**

- `GONZO_CONCEPTS_SECRET` - Your Gonzo API token

#### Optional/Update Required Variables

**Frontend Configuration:**

- Update `FRONTEND_URL` in the render.yaml to match your actual frontend URL
- Update `ORIGIN` in the render.yaml to match your frontend domain

### 3. Services Created

The `render.yaml` will create the following services:

1. **Web Service** (`payloow-api`)

   - Node.js runtime
   - Automatically builds and starts your application
   - Health check endpoint: `/health`
   - Port: 10000 (Render's default)

2. **Redis Service** (`payloow-redis`)

   - Used for caching and session management
   - Starter plan
   - Automatically connected to your web service

3. **MongoDB Database** (`payloow-mongodb`)
   - Managed MongoDB database
   - Automatically connected to your web service
   - Database name: `payloow`
   - User: `payloow_user`

### 4. Build and Start Commands

The configuration uses:

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start:prod`

Make sure your `package.json` has these scripts properly configured.

### 5. Health Check

The application includes a health check endpoint at `/health` that returns:

```json
{
  "status": "ok"
}
```

### 6. Deployment Process

1. Push your code with the `render.yaml` file to your repository
2. In Render, create a new Blueprint deployment
3. Select your repository
4. Render will read the `render.yaml` and create all services
5. Add the required environment variables in each service's settings
6. Deploy!

## Important Notes

### Environment Variables Security

- All sensitive environment variables are marked with `sync: false` in the configuration
- This means they won't be synced between environments and must be set manually
- Never commit actual secret values to your repository

### Database Connection

- The MongoDB connection string is automatically provided via the `MONGO_URL` environment variable
- Your application should read from `process.env.MONGO_URL`

### Redis Connection

- Redis connection is automatically provided via the `REDIS_URL` environment variable
- Make sure your application can use this connection string

### Monitoring

- Use Render's built-in logs and metrics to monitor your application
- The health check endpoint helps Render determine if your service is running properly

## Troubleshooting

### Common Issues

1. **Build Failures**

   - Check that all dependencies are listed in `package.json`
   - Ensure TypeScript compilation succeeds locally

2. **Environment Variable Issues**

   - Verify all required environment variables are set
   - Check for typos in variable names

3. **Database Connection Issues**

   - Ensure your MongoDB service is running
   - Check the connection string format in your application

4. **Health Check Failures**
   - Make sure your `/health` endpoint is accessible
   - Verify your application starts on the correct port

### Support

- Check Render's documentation: https://render.com/docs
- Review application logs in the Render dashboard
- Ensure your local development environment works before deploying

## Cost Considerations

- **Starter Plan Web Service**: Free tier available (with limitations)
- **Starter Plan Redis**: Free tier available
- **Starter Plan MongoDB**: Free tier available

Review Render's pricing page for current rates and limitations.
