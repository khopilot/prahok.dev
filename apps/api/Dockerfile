FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling and OpenSSL
RUN apk add --no-cache dumb-init openssl

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Install all dependencies including devDependencies for tsx
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY src ./src
COPY .env* ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 5000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application with tsx
CMD ["npx", "tsx", "src/server.ts"]