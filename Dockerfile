# Stage 1: Compile TypeScript to dist/
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Stage 2: Production MCP stdio Runtime
FROM node:20-alpine AS production

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV YUGIOH_API_BASE_URL=http://localhost:3001/api

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /usr/src/app/dist ./dist

USER node

ENTRYPOINT ["node", "dist/server.js"]

