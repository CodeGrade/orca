#!/bin/bash

if [ ! -d ".venv" ]; then
  echo "Creating virtual environment..."
  python -m venv .venv
  echo "Created."
fi
source .venv/bin/activate
python -m pip install -r requirements.txt

if [ ! -f ".env" ]; then
  echo "Creating .env from .default.env..."
  cp .env.defaults .env
  echo "Created."
  echo "Please make any desired environment variable changes in .env."
fi

docker network create orca-testing
docker build -t orca-grader-base -f images/orca-grader-base.Dockerfile .
docker build -t orca-java-grader -f images/java-grader.Dockerfile .
docker build -t simple-server -f images/testing/simple-server/Dockerfile images/testing/simple-server
docker build -t echo-server -f images/testing/echo-server/Dockerfile images/testing/echo-server/
