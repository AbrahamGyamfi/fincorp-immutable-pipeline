# ── Stage 1: Build React dashboard ───────────────────────────────────────────
FROM node:20-alpine AS client-build


WORKDIR /build

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build
# Vite outDir: '../public' → output lands at /public in the build stage


# ── Stage 2: Production server ────────────────────────────────────────────────
# In ECS/EC2, combine with:
#   readonlyRootFilesystem: true  noNewPrivileges: true
FROM node:20-alpine AS final

# Apply OS-level security patches available at build time
RUN apk --no-cache upgrade

RUN addgroup -S fincorp && adduser -S fincorp -G fincorp

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY src/ ./src/
COPY --from=client-build /public ./public

RUN chown -R fincorp:fincorp /app

USER fincorp

# OCI image labels — used by scanners, registries, and audit tooling
LABEL org.opencontainers.image.title="fincorp-api" \
      org.opencontainers.image.description="FinCorp secure API + dashboard" \
      org.opencontainers.image.vendor="FinCorp" \
      org.opencontainers.image.licenses="UNLICENSED"

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Node-based healthcheck — no shell or wget required
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health',r=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

CMD ["node", "src/server.js"]
