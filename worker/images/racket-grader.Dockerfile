FROM orca-grader-base:latest

RUN apt-get update
RUN apt-get install wget -y
RUN wget https://download.racket-lang.org/installers/8.13/racket-8.13-x86_64-linux-cs.sh \
  -O racket-8.13-x86_64-linux-cs.sh
RUN sh racket-8.13-x86_64-linux-cs.sh --unix-style
RUN apt-get autoremove --purge -y wget

USER orca-grader
