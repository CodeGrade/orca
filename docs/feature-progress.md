# Feature Progress

The following is a breakdown of the features left to implement to get Orca up and running. Bottlenose is included here as changes to that project are necessary for Orca to funciton as intended.

<hr>

## Orca

<hr>

### API/HTTP Server [ ]

- Validate incoming JSON [ ]
  - Create modules for Validation Schemas [ ]
- Create/Enqueue Grading Job [ ]
  - Create Job in Orca (Postrgres) DB [X]
  - Enqueue Job in Redis DB [ ]
- GET Grading Job(s) [ ]
  - Paginated List of Enqueued Jobs [ ]
  - Getting details on a specific job(?) [ ]
- Queue Management [ ]
  - Deleting a Grading Job [ ]
- Authentication [ ]
- POST Grading Job Results [ ]
  - Restart/Replace Grading Container [ ]
  - Remove Matching Job(s) in PostgreSQL DB [ ]
  - Send to Bottlenose (PUT request) [ ]

### Web Client [ ]

- Set Up Typescript [ ]
- Status Page [ ]
- Queue List [ ]
  - Pagination [ ]
  - Details on Specific Job [ ]
  - Remove Job from Queue [ ]
- Authentication [ ]

### Docker [ ]

- Create Dockerfile [ ]
- Set Up Docker Container Management [ ]

<hr>

## Grading Containers

<hr>

### Redis/Grading Queue

- Retrieval of `GradingJobConfig` from the Queue [ ]
  - Lock/Semaphore on a job such that only "this" container has access [ ]

### Grading Script [ ]

- Execution of Scripts [ ]s
  - Retries [ ]
  - Saving to Log [ ]
  - Producing TAP Output [ ]
  - Error Handling [ ]
  - Assets (e.g., Javalib and Tester library) [ ]
- Retrieval of Student/Other Files [ ]
- Send Results to Orca [ ]

### Docker

- Dockerfile [ ]
- Cutting off/Reinstating Network Access On Demand [ ]

<hr>

## Bottlenose

<hr>

### API [ ]

- PUT Grading Job Results [ ]
  - Parse JSON and TAP [ ]
  - Update Grade in DB [ ]

### Full Stack

- Generate Job Config based on Grader [ ]
  - Build commands [ ]
  - Test commands [ ]
