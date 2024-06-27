# End-to-End Workflows
This document covers the full end-to-end workflow of all Orca processes, including:
* Creating a job
* Updating a job
* Building a grader image
* Deleting a job

## Some Quick Notes
A couple items to cover for both the clarity and brevity of this document:
1. Assume all endpoint names are preceded by `/api/v1`, as all operations fall under this sub-route.
2. All data definitions referenced in the below text and diagrams can be found in the [data definitions document](./data_definitions.md) file.
3. As [Bottlenose]() is Orca's main "customer," it will be considered the caller of Orca's API. However, this could easily be replaced by _any_ client who implements the functionality needed to connect with Orca's APIs and have results returned to it.

## The Base Workflow

When a student submits an assignment to a client utilizing Orca, the client will submit a `GradingJobConfig` to the Orchestrator. The Orchestrator will enqueue the job and inform the client.

```mermaidjs
sequenceDiagram
    actor S as Student
    participant B as Bottlenose
    participant O as Orchestrator
    participant Q as Postgres (Queue)
    participant W as Worker
    S->>+B: PUT /submissions/create
    B-->>-S: HTTPS 200 OK
    B->>+O: PUT /gradingJob
    O-->>-B: HTTPS 200 OK
    O->>+Q: createGradingJob(GradingJobConfig)
    Q-->>-O: void
    W->>+Q: getNextJob()
    Q-->>-W: GradingJob
    create participant C as Container
    W->>C: runGradingJob(GradingJob)
    C->>+B: getGraderAndSubmissionFiles()
    B-->>-C: List[File]
    C->>+B: pushResults(GradingJobResult)
    B-->>-C: HTTPS 200 OK
    destroy C
    C-->>W: void
    S->>+B: getGradeForSubmission(Submission)
    B-->>-S: Grade
```

Eventually, the job will be picked up by a single worker out of a pool of VMs actively grading jobs.

**TODO: Add image download step from worker**
The worker then spins up a Docker container to grade the job, and given that the grading script is able to be compiled and executed, the container will send grading results back to the client before being shut down.

## Building a Grader Image

Before clients can create a grading job, Orca mandates that there is either an existing Docker image for grading in its file system or one in the process of being built.

```mermaidjs
sequenceDiagram
    participant B as Bottlenose
    participant O as Orchestrator
    B->>+O: PUT /gradingJob (GradingJobConfig)
    O-->>-B: HTTPS 400 Bad Request
```

Attempting to submit a job to the queue without an image will return a `400 Bad Request` error back to the client.

Clients can submit an `ImageBuildRequest` to Orca via its `/buildImage` endpoint.

```mermaidjs
sequenceDiagram
    participant B as Bottlenose
    participant O as Orchestrator
    participant P as Postgres
    participant I as Image Builder
    B->>+O: POST /buildImage (ImageBuildRequest)
    O->>+P: createImageBuildRequest(ImageBuildRequest)
    P-->>-O: void
    O-->>-B: HTTPS 200 OK
    I->>+P: getNextBuildRequest()
    P-->>-I: ImageBuildRequest
    create participant D as Docker
    I->>D: docker build ...
    B->>+O: PUT /gradingJob GradingJobConfig
    O->>+P: placeJobInHoldingPen(GradingJobConfig)
    P-->>-O: void
    O-->>-B: HTTPS 200 OK
    destroy D
    D-->>I: OK
    I->>+P: releaseAllJobsInHolding()
    P-->>-I: void
```

While an image is being built, it is possible to hit the `/gradingJob` endpoint with a `GradingJobConfig`. Orca will handle this request by placing the job in a "holding pen," where that job and any other jobs in the same holding pen will eventually be enqueued _after_ the image has been successfully built. Like jobs that have been enqueued, jobs in the holding pen may be updated.

```mermaidjs
sequenceDiagram
    participant B as Bottlenose
    participant O as Orchestrator
    participant P as Postgres
    participant I as Image Builder
    I->>+P: getNextBuildRequest()
    P-->>-I: ImageBuildRequest
    create participant D as Docker
    I->>D: docker build ...
    B->>+O: PUT /gradingJob GradingJobConfig
    O->>+P: placeJobInHoldingPen(GradingJobConfig)
    P-->>-O: void
    O-->>-B: HTTPS 200 OK
    destroy D
    D-->>I: ERROR
    I->>+P: removeJobsInHoldingPen
    P-->>-I: List<GradingJobConfig>
    loop For config in list
        I->>+B: POST <response_url> GraderConfigCreationResult
        B->>-I: HTTPS 200 OK
    end
```

In the event that the image fails to build, any jobs in the holding pen will be removed from Postgres and a notification will be sent back to the URL specified by each `GradingJobConfig`'s `response_url` prop.
