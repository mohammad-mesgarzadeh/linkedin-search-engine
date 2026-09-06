FROM node:20-alpine AS build

WORKDIR /app
COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./
RUN npx prisma generate && npm run build

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src ./src
COPY ["dataset/linkedin_profiles.json", "./dataset/linkedin_profiles.json"]
COPY backend/docker-entrypoint.sh ./

RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

EXPOSE 4000
ENTRYPOINT ["./docker-entrypoint.sh"]
