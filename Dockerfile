# Single-stage build — tsx runs TypeScript directly (no compile step needed)
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
# Install all deps including devDeps (tsx is needed to run TS)
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/

# Copy default data (Railway volume will overlay /app/data at runtime)
COPY data/ ./data/

EXPOSE 3002

CMD ["npx", "tsx", "src/main.ts"]
