# Dependencies
FROM node:20-alpine3.18 AS deps
WORKDIR /app

# Set npm config to handle network issues
RUN npm config set registry https://registry.npmjs.org/ \
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000

# Copy package files
COPY package*.json ./

# Install dependencies with retry logic
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit || \
    (npm cache clean --force && npm ci --prefer-offline --no-audit)

# Builder
FROM node:20-alpine3.18 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
ENV NEXT_FORCE_SWCPACKAGE=1
RUN npm run build

# Runner
FROM node:20-alpine3.18 AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"] 