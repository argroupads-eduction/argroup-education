# Next.js frontend — run multiple replicas behind Kubernetes Ingress / load balancer
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
RUN npm ci --workspace=ar-education-frontend --include-workspace-root
COPY apps/frontend ./apps/frontend
COPY apps/backend/prisma ./apps/backend/prisma
RUN npm run db:generate --workspace=ar-education-backend
WORKDIR /app/apps/frontend
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app/apps/frontend
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -S nextjs
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package-lock.json /app/
USER nextjs
EXPOSE 3000
CMD ["npm", "start"]
