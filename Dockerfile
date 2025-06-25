# Build stage
FROM node:20.11.1-alpine AS builder

# Install necessary build dependencies (added more dependencies for native modules)
RUN apk add --no-cache git python3 make g++ build-base

WORKDIR /usr/src/app

# Copy only files needed for installation
COPY package.json yarn.lock tsconfig.json ./

# Enhanced yarn install with better error logging
RUN yarn config set network-timeout 300000 && \
    yarn config set unsafe-perm true && \
    yarn install --frozen-lockfile --production=false --verbose || \
    (echo "Yarn install failed, showing yarn log:" && cat ~/.npm/_logs/*.log && exit 1)


# Copy source files
COPY . .

# Build the application
RUN yarn run build

# Production stage
FROM node:20.11.1-alpine AS runner

# Install runtime dependencies only
RUN apk add --no-cache dumb-init curl wget

WORKDIR /usr/src/app

# Copy necessary files from builder
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/yarn.lock ./
COPY --from=builder /usr/src/app/tsconfig.json ./
COPY --from=builder /usr/src/app/swagger.yaml ./

# Install only production dependencies
RUN yarn install --frozen-lockfile --production=true

ENV NODE_ENV=production \
    PORT=4000

EXPOSE 4000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

# Start the application
CMD ["yarn", "start:prod"]