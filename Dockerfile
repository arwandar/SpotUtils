FROM node:current-slim AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY config.json ./
RUN npm ci
COPY src ./src
RUN npm run build

FROM node:current-slim
ENV NODE_ENV="production"
WORKDIR /app

COPY package*.json ./
COPY config.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist

USER node
EXPOSE 3000
CMD ["npm", "start"]