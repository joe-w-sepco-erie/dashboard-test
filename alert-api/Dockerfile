FROM node:latest

RUN apt update

# Set timezone to NYC
RUN ln -sf /usr/share/zoneinfo/America/New_York /etc/localtime
RUN echo "America/New_York" > /etc/timezone

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3003
CMD ["node", "index.js"]
