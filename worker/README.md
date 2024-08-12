# Orca: Grading VM Component

Orca' grading VM (also referred to as the "grader") is responsible for grading student submissions delivered to a shared Redis DB via the Orca web server.

It does so by spinning up a Docker container when executed and running the grading job inside this isolated environment.

Post-execution, it will send off the results to Bottlenose for the grade to be processed.

## Set Up

This software component is set up through the use of Python's virtual environment (`venv`) module.

1. Begin by running `python -m venv .venv`.
2. To activate the virtual environment, run `source .venv/bin/activate`
3. Set up local packages with `python -m pip install -r requirements.txt`.

When finished developing or running the worker, the user may return to their "normal shell" by executing `deactivate`.

## Running the Grader

Given the PostgreSQL database is running, simply run

```
$ python -m orca_grader
```

### Checking Output

To emulate sending the result of a grading job to a response URL, the worker module has a built-in _echo server_ provided by a basic Express API run in a docker container (this is included in the `docker-compose.yml` file).

GETing the URL `http://localhost:9001/job-output` will yield which IDs can be queried for their results, and GETing the URL `http://localhost:9001/job-output/:id` will give the result of grading that specific job.

## Running Unit Tests

The worker features multiple test suites to ensure robustness. All of these suites can be run by execution the command:

```
$ python -m orca_grader.tests.runner
```
