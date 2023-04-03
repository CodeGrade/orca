# Orca: Grading VM Component

## Set Up

This section is set up through the use of Python's virtual environment (`venv`) module.

1. Begin by running `python -m venv .venv`.
2. To activate the virtual environment, run `source .venv/bin/activate`
3. Set up local packages with `python -m pip install -r requirements.txt`.

## Running the Grader

For standard execution, run the following command:

```
python -m orca_grader
```

### Using Redis

The grading vm, when run normally (e.g., as it would be in production), has the machine talk to a Redis DB, where it fetches grading jobs and processes them one at a time.

To emulate this behavior, devs can kick off a local Redis DB server instance by running the following:

`docker run --rm -p 6379:6379 --name redis-server redis:7`.

### With Containers

By default, Orca's grading vm will execute a grading job within a given container (provided through a `GradingJob`'s `container_sha` property).

To ensure it connects to Redis correctly, we will need to connect the Redis instance to a custom Docker network. We can do this by running the following:

```
docker network create orca-testing
docker network connect orca-testing redis-server
```

**TODO**: Add section about exporting REDIS URL to local

For debugging, devs can optionally specify a custom command to the grading container such that instead of running the grading job, it will simply execute that command instead. For example:

```
python -m orca_grader --custom-container-cmd "echo hello world!"
```

This is useful for running sanity checks, such as ensuring containers are being spun up properly and are able to be killed if they timeout.

### Without Containers

Users may optionally run the grader without spinning up a container, which can be done as follows:

```
python -m orca_grader --no-container
```

This will run the grading job on the local machine instead.

### Running a Single, Local Job

**TODO**

## Exiting the Virtual Environment

When finished with development, the user may return to their "normal shell" by executing `deactivate`.
