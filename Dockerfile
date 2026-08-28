FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
COPY shared/package*.json ./shared/

# Install all dependencies (including devDependencies & workspace links)
RUN npm ci

# Copy source code and Prisma schema
COPY shared/ ./shared/
COPY src/ ./src/
COPY tsconfig.json ./
COPY prisma/ ./prisma/

# Build shared library
WORKDIR /app/shared
RUN npm run build

# Generate Prisma Client & compile TypeScript backend
WORKDIR /app
RUN npx prisma generate
RUN npm run build

# Production Runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY shared/package*.json ./shared/

# Install production dependencies only
RUN npm ci --omit=dev

# Copy compiled files and Prisma engines
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 5000

CMD ["node", "dist/index.js"]
