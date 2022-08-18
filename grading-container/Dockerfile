FROM python:3.8.10-slim

RUN pip install pipenv

WORKDIR /usr/local/grading

COPY Pipfile .
COPY Pipfile.lock .
COPY . .

ENV PYTHONPATH .

RUN pipenv install --system --deploy
CMD [ "python3", "do_grading.py" ]