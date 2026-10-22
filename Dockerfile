FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY . .

RUN npm install --no-audit --no-fund
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
