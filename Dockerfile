FROM node:22-bookworm-slim AS build
WORKDIR /app
ARG DATABASE_PROVIDER=sqlite
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN if [ "$DATABASE_PROVIDER" = "postgresql" ]; then \
      sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma; \
    fi
RUN npx prisma generate && npx next build
RUN cp -r public .next/standalone/public && cp -r .next/static .next/standalone/.next/static \
    && cp -r prisma .next/standalone/prisma

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3847
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
EXPOSE 3847
CMD ["node", "server.js"]
