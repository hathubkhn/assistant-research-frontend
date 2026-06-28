# Stage 1: Build the Next.js application
FROM node:20-alpine AS builder

WORKDIR /app

# Baked at build time for browser calls (override via docker compose build.args)
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ARG NEXT_PUBLIC_RESEARCH_API_URL=http://localhost:8001
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_MICROSOFT_CLIENT_ID=
ARG NEXT_PUBLIC_MICROSOFT_TENANT_ID=common
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_RESEARCH_API_URL=$NEXT_PUBLIC_RESEARCH_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_MICROSOFT_CLIENT_ID=$NEXT_PUBLIC_MICROSOFT_CLIENT_ID
ENV NEXT_PUBLIC_MICROSOFT_TENANT_ID=$NEXT_PUBLIC_MICROSOFT_TENANT_ID

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the Next.js application
RUN npm run build

# Stage 2: Run the application
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production

# Copy necessary files from the builder stage
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose the port the app will run on
EXPOSE 3000

# Start the Next.js application
CMD ["npm", "start"]