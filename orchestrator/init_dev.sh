#!/bin/bash
prisma_migration () {
  docker pull postgres:10
  docker run -p 5432:5432 -v db-data:/var/lib/postgresql/data -e POSTGRES_PASSWORD=password \
    -d postgres:10 postgres
  npx prisma migrate dev --name init
}

main () {
  nvm use
  yarn install
  docker build -t orca-orchestrator .
  prisma_migration
}

