FROM ubuntu:20.04 

RUN apt-get update && \
	apt-get install -y openjdk-11-jdk ca-certificates-java racket xvfb python3 && \
	apt-get clean && \
	update-ca-certificates -f;

RUN javac --version
RUN java --version
CMD python3 --version
