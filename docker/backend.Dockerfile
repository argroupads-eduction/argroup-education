FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/backend ./apps/backend
RUN npm ci --workspace=ar-education-backend --include-workspace-root
RUN npm run build --workspace=ar-education-backend

FROM node:20-alpine AS runner
WORKDIR /app/apps/backend
ENV NODE_ENV=production
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/prisma ./prisma
COPY --from=builder /app/apps/backend/package.json ./
COPY --from=builder /app/node_modules /app/node_modules
EXPOSE 3001
CMD ["node", "dist/index.js"]
