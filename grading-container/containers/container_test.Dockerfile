FROM orca-grading-container-base:latest

RUN pip install pipenv

WORKDIR /usr/local/grading

COPY Pipfile .
COPY Pipfile.lock .
COPY . .

ENV PYTHONPATH .
ARG REDIS_URL

RUN apt-get update && \
	apt-get install -y openjdk-11-jdk && \
	apt-get clean;
RUN apt-get updates && \
	apt-get install ca-certificates-java && \
	apt-get clean && \
	update-ca-certificates -f;

RUN java --version
RUN javac --version

RUN pipenv install --system --deploy

RUN echo $REDIS_URL

RUN python3 tests/scripts/seed_test_db.py tests/fixtures/files/live-URL-student-only.json

CMD [ "python3", "do_grading.py"]
