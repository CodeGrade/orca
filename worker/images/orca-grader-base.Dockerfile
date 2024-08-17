FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive
RUN ["useradd", "-ms", "/bin/bash", "orca-grader"]
RUN ["chmod", "755", "/home/orca-grader"]
WORKDIR /home/orca-grader
RUN ["apt", "update", "-y"]
RUN ["apt", "upgrade", "-y"]
RUN ["apt", "install", "p7zip-full", "zip", "-y"]
RUN ["apt", "install", "curl", "-y"]
RUN ["apt", "install", "software-properties-common", "-y"]
RUN ["add-apt-repository", "ppa:deadsnakes/ppa", "-y"]
RUN ["apt", "update", "-y"]
RUN ["apt", "install", "python3.10", "-y"]
RUN curl -sS https://bootstrap.pypa.io/get-pip.py | python3.10
RUN ["python3.10", "-m", "pip", "install", "pip"]

COPY ../requirements.txt .
COPY ../orca_grader ./orca_grader

RUN ["python3.10", "-m", "pip", "install", "-r", "requirements.txt"]
