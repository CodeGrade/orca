FROM ubuntu:20.04

ENV DEBIAN_FRONTEND noninteractive
RUN ["apt", "update"]
RUN ["apt", "install", "python3", "-y"]
RUN ["apt", "install", "python3-pip", "-y"]

WORKDIR /usr/local/grading

COPY . .

RUN ["python3", "-m", "pip", "install", "-r", "requirements.txt"]
