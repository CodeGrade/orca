FROM python:3.8.10-slim

RUN pip install pipenv

WORKDIR /usr/local/grading

COPY Pipfile .
COPY Pipfile.lock .
COPY . .

ENV PYTHONPATH .
ARG REDIS_URL

RUN pipenv install --system --deploy

RUN echo $REDIS_URL

RUN python3 tests/scripts/seed_test_db.py tests/fixtures/files/live-URL-student-only.json

CMD [ "python3", "do_grading.py"]
