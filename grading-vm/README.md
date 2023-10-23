# Orca: Grading VM Component

Orca' grading VM (also referred to as the "grader") is responsible for grading student submissions delivered to a shared Redis DB via the Orca web server.

It does so by spinning up a Docker container when executed and running the grading job inside this isolated environment.

Post-execution, it will send off the results to Bottlenose for the grade to be processed.

## Set Up

This software component is set up through the use of Python's virtual environment (`venv`) module.

1. Begin by running `python -m venv .venv`.
2. To activate the virtual environment, run `source .venv/bin/activate`
3. Set up local packages with `python -m pip install -r requirements.txt`.

These steps, as well as the building of Docker images utilized in multiple aspects of testing the worker, are all contained in a single shell script. This can be run with:

```
$ ./init_dev.sh
```

## Running the Grader

For standard execution, run the following commands:

```
$ docker compose up
$ python -m orca_grader
```

**BONUS: Populate Redis with Jobs**

Useful for both stress testing and generally populating the Redis queue, the following script can be run to enqueue 1000 jobs:

```
$ python -m orca_grader.tests.stress_tests.burst_scenario
```

### Using Redis

The grading vm, when run normally (e.g., as it would be in production), has the machine talk to a Redis DB, where it fetches grading jobs and processes them one at a time.

To emulate this behavior, devs can kick off a local Redis DB server instance by running the following:

```
$ docker run --rm -p 6379:6379 --name redis-server redis:7
```

### With Containers

By default, Orca's grading vm will execute a grading job within a given container (provided through a `GradingJob`'s `container_sha` property).

To ensure it connects to Redis correctly, we will need to connect the Redis instance to a custom Docker network. We can do this by running the following:

```
$ docker network create orca-testing
$ docker network connect orca-testing redis-server
```

For debugging, devs can optionally specify a custom command to the grading container such that instead of running the grading job, it will simply execute that command instead. For example:

```
$ python -m orca_grader --custom-container-cmd "echo hello world!"
```

This is useful for running sanity checks, such as ensuring containers are being spun up properly and are able to be killed if they timeout.

### Without Containers

Users may optionally run the grader without spinning up a container by adding the `--no-container` flag to the python startup command. This will run the grading job on the local machine instead.

### Running a Single, Local Job

Instead of infinitely looping and checking the Redis queue for new jobs to pop off and handle, the grader can alternatively take in a grading job specified in a local .json file, execute it, and exit. This can be specified with the `--local-job /PATH/TO/JOB` flag.

### Local File Server

Code files in a grading job must always be downloaded via HTTP/HTTPS. Fortunately, we've added a docker container that can easily be built and used for this.

First, all files to be used in local testing must be added under the `images/testing/simple-server/files` directory.

Then, run the following commands from this directory:

```
$ docker build -t simple-server -f images/testing/simple-server/Dockerfile images/testing/simple-server
$ docker run -p 9000:9000 --rm -d --network orca-testing --name simple-server
```

The first command builds the server image by copying all files in the given directory to the server such that it's able to deliver them over HTTP. The second command runs the server in the background, exposing port 9000 for machines to access.

Note that whether the grading job is executed from the container or the local machine will affect how local file URLs should be written under the `files` key in a grading job:

If running without the container, the URL should be "http://localhost:9000/files/PATH/TO/FILE".

If running with th contianer, the URL should be "http://simple-server:9000/files/PATH/TO/FILE". This is because docker does not allow containers to connect to each other through localhost. We are able to change the host name here since both the file server and grading container are connected to the same docker network, `orca-testing`.

## Running Unit Tests

The worker features multiple test suites to ensure robustness. All of these suites can be run by execution the command:

```
$ python -m orca_grader.tests.runner
```

## Exiting the Virtual Environment

When finished with development, the user may return to their "normal shell" by executing `deactivate`.
