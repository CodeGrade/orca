FROM node:16.15.0-bullseye-slim

WORKDIR /usr

COPY package.json ./
COPY yarn.lock ./
COPY tsconfig.json ./

RUN yarn install

COPY . .

EXPOSE 4000

CMD ["yarn", "run", "dev"]
