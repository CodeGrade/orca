FROM orca-grader-base:latest

RUN ["apt", "install", "openjdk-11-jdk-headless", "-y"]