# Deploying Orca

This guide serves to describe how to deploy Orca and its components in a **production** environment.

## General Requirements

The following tools must be present on the host machine running Orca (where 'x' means any minor/patch sub-version):
* Docker v27.x.x
* PostgreSQL v10.x.x

Both the Orchestrator and the Worker(s) will utilize these tools when interacting with grading jobs and grader images.

### The `orca-grader-base` Docker Image

All grader images that Orca may create on demand are built from the `orca-grader-base` Docker image; it is necessary that this must exist before running the system.

The Dockerfile for the base image is located in the `worker/` directory, and can be built by running the following command:

```bash
cd worker/
docker build -t orca-grader-base -f images/orca-grader-base.Dockerfile .
```

In particular, if the Orchestrator and Worker are being run on separate machine instances, **please ensure the Orchestrator's machine has this image built by its local Docker service**.

## The Orchestrator

The Orchestrator expects to be run with Node version 21.0.0.

### Environment Variables

The following environment variables need to be set upon deploying the orchestrator:

* `ENVIRONMENT` - Used for logging configuration and other conditionals; this should be set to `PRODUCTION`.
* `POSTGRES_URL` - Used for connecting to and interacting with Orca's database; see [this Prisma page](https://www.prisma.io/dataguide/postgresql/short-guides/connection-uris) for the URL format.
* `API_PORT` - The port on which the API should listen for incoming connections.

### Installing Dependencies

Dependencies can be installed and built from the top level of the `orchestrator/` directory.

```bash
yarn install
yarn workspaces run build
```

From there, Prisma will be installed, and migrations for setting up the database can be executed by running the following:

```bash
cd packages/db
npx prisma migrate deploy
```

**NOTE: This will not work if the POSTGRES_URL is not set.**

This will create the schemas needed for grading jobs and grader image builds to be created.

### Running the Orchestrator: A Tale of Two Cities

The Orchestrator is made up of two components: the Web API and the Image Builder Service.

There are two ways to run them: (1) as two separate terminal sessions _or_ (2) with a single command.

Option (1):

In two different terminal sessions, run the following:

* Session A: `yarn server`
* Session B: `yarn image-builder`


Option (2):

The node tool `concurrently` can be utilized to run the API and Build Service in one session; this has been aliased to this command:

```bash
yarn start
```

## The Worker

The Worker expects to be run with Python version 3.12.5.

### Environment Variables

The following environment variables need to be set upon deploying a worker instance:

* `ENVIRONMENT` - Used for certain conditional logic on the worker; this should be set to `PRODUCTION`.
* `POSTGRES_URL` - Used for fetching jobs from the queue; this is the same URL for the running PostgreSQL database instance.
* `ORCA_WEB_SERVER_HOST` - Needed for fetching grader images that don't exist on the worker's machine; this should be whatever the Orcherstrator's API URL is.

### Installing Dependencies

To install all of its dependencies, run the following commands:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

The `venv` Python command ensures installed packages are local to the `worker/` directory instead of installing them system-wide.

**NOTE:** unless actively running the Worker instance, the python virtual environment can be exited by typing `deactivate` and hitting ENTER in a given terminal session.

### Running the Worker

The worker can be run by simply executing the following:

```bash
source .venv/bin/activate
python -m orca_grader
```

