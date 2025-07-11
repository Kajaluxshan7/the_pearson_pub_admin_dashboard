FROM node:22.16.0-bullseye-slim

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

EXPOSE 3002

CMD ["npm", "run", "dev", "--", "--port", "3002", "--host", "0.0.0.0"]
