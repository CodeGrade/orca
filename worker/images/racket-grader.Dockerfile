FROM orca-grader-base:latest

RUN apt-get update
RUN apt-get install racket -y

USER orca-grader
