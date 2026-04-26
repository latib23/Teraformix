# ----------------------------
# Stage 1: Build (Backend + Frontend)
# ----------------------------
FROM public.ecr.aws/docker/library/node:22-slim AS builder

WORKDIR /app

ENV NODE_OPTIONS=--max-old-space-size=4096

# Install all dependencies (apt-get for native deps if needed)
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

# Copy full source
COPY . .

RUN npm run build:server
RUN npm run build:client

# ----------------------------
# Stage 2: Production Runner
# ----------------------------
FROM public.ecr.aws/docker/library/node:22-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

RUN mkdir -p uploads && chown -R node:node /app

COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/dist-client ./dist-client

EXPOSE 3000
USER node

# Healthcheck probing /health on the bound PORT
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "const http=require('http');const port=process.env.PORT||3000;http.get({host:'127.0.0.1',port,path:'/health'},r=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1));"

# Start NestJS App (migrations should run in CI/CD step or separate job)
CMD ["node", "dist/main.js"]
