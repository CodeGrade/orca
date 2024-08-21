FROM orca-grader-base:latest

RUN apt-get update
RUN curl -L -o racket-8.14-x86_64-linux-cs.sh \
  https://download.racket-lang.org/installers/8.14/racket-8.14-x86_64-linux-cs.sh
RUN sh racket-8.14-x86_64-linux-cs.sh --unix-style
RUN rm racket-8.14-x86_64-linux-cs.sh

USER orca-grader
