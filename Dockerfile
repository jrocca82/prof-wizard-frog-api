# syntax=docker/dockerfile:1

# ---- Builder ----
FROM node:20-slim AS builder

WORKDIR /app

# Install deps
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source and build
COPY . .
RUN yarn build

# ---- Production ----
FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production \
    PORT=8000

# Install only prod deps
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

# Copy built code
COPY --from=builder /app/dist ./dist

EXPOSE 8000

CMD ["node", "dist/main.js"]
