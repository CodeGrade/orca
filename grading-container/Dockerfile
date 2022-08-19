FROM python:3.8.10-slim

RUN pip install pipenv

WORKDIR /usr/local/grading

COPY Pipfile .
COPY Pipfile.lock .
COPY validations/ .
COPY grading_job/ .
COPY do_grading.py .

RUN apt-get install -y java javac xvfb xvfb-run racket


ENV PYTHONPATH .

RUN pipenv install --system --deploy
CMD [ "python3", "do_grading.py" ]
