FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
# Runtime starts the TypeScript Express server directly, so the loader is a runtime dependency.
RUN npm install --no-save tsx@^4.21.0 --no-audit --no-fund

COPY --from=build /app/dist ./dist
COPY --from=build /app/server.ts ./server.ts
COPY --from=build /app/src ./src
COPY --from=build /app/backend ./backend
COPY --from=build /app/drizzle ./drizzle

EXPOSE 3000
CMD ["node", "--import", "tsx", "server.ts"]
