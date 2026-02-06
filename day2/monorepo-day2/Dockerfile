# Use a minimal Node.js image
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@latest

# Copy package.json, pnpm-workspace.yaml and pnpm-lock.yaml to leverage Docker cache
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/backend/package.json ./packages/backend/

# Install dependencies for all packages (lockfile optional for first build)
RUN pnpm install

# Copy the rest of the application code
COPY . .

# Build all packages
RUN pnpm build:all

# Expose ports if services were actual servers
# EXPOSE 3000
# EXPOSE 3001

# Command to run both services
CMD ["pnpm", "start:all"]
