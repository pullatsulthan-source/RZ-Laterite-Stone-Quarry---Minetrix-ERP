FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json bun.lock ./
RUN npm install --no-package-lock

COPY . .

ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ENV VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY} \
    VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN} \
    VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID} \
    VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET} \
    VITE_FIREBASE_MESSAGING_SENDER_ID=${VITE_FIREBASE_MESSAGING_SENDER_ID} \
    VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID}

RUN npm run lint && npm run build
RUN npx esbuild server.ts --bundle --platform=node --target=node22 --format=esm --packages=external --outfile=build/server.js

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev --no-package-lock && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/build/server.js ./build/server.js
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/scripts ./scripts

ENV PORT=8080
EXPOSE 8080
CMD ["node", "build/server.js"]
