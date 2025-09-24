FROM node:latest

RUN apt update

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3003
CMD ["node", "index.js"]
