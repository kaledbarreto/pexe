FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S bot && adduser -S bot -G bot

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY config.json ./
COPY src ./src

USER bot
CMD ["node", "src/index.js"]
