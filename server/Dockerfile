# Production API image — expand with multi-stage build in DevOps step.
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev
COPY . .
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "src/index.js"]
