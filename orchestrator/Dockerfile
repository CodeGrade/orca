FROM node:20.11.0-bullseye-slim

WORKDIR /usr

COPY . .

RUN yarn install
RUN yarn workspaces run build

EXPOSE 4000

CMD ["yarn", "start"]
