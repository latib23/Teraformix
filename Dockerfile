# ----------------------------
# Stage 1: Build (Backend + Frontend)
# ----------------------------
FROM public.ecr.aws/docker/library/node:20-slim AS builder

WORKDIR /app

ENV NODE_OPTIONS=--max-old-space-size=4096

# Install all dependencies (apt-get for native deps if needed)
RUN apt-get update -y && apt-get install -y openssl python3 make g++

COPY package*.json ./
RUN npm install

# Copy full source
COPY . .

# Build backend
RUN npm run build:server

# Debug: List what nest build produced
RUN echo "Contetns of dist after nest build:" && find dist -maxdepth 3

# Explicitly build data-source.js with ALL required flags
RUN npx tsc src/database/data-source.ts --outDir dist/database --target es2017 --module commonjs --moduleResolution node --esModuleInterop --skipLibCheck --experimentalDecorators --emitDecoratorMetadata

# Debug: Check if it exists now
RUN echo "Checking for data-source.js in dist/database:" && ls -la dist/database/data-source.js || echo "File not found in standard path"
RUN echo "Searching entire dist for data-source.js:" && find dist -name "data-source.js"

RUN npm run build:client

# ----------------------------
# Stage 2: Production Runner
# ----------------------------
FROM public.ecr.aws/docker/library/node:20-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies (tolerant to lock drift)
COPY package*.json ./
RUN npm install --omit=dev

# Copy backend dist files
COPY --from=builder /app/dist ./dist

# Copy frontend build output (Vite outDir 'dist-client') into runtime
COPY --from=builder /app/dist-client ./dist-client

EXPOSE 3000

# Healthcheck probing /health on the bound PORT
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "const http=require('http');const port=process.env.PORT||3000;http.get({host:'127.0.0.1',port,path:'/health'},r=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1));"

# Start NestJS App (migrations should run in CI/CD step or separate job)
CMD ["node", "dist/main.js"]
