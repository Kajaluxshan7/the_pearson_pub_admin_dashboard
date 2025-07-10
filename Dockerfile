FROM node:22.16.0-alpine

WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* ./

RUN npm install -g pnpm

RUN pnpm install

COPY . .

EXPOSE 3002

CMD ["pnpm", "run", "dev"]
