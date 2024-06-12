FROM node:21-alpine

WORKDIR /app

EXPOSE 9001

COPY . .

RUN ["yarn", "install"]
CMD ["yarn", "start"]

