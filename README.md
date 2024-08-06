# Orca: A Computer Science Grading Service

Orca is a grading job ecosystem to be used in tandem with Bottlenose, a web application used to host computer science courses.

| Directory   | Description                                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------- |
| docs/       | Documentation, design specs, and diagrams to provide developers with knowledge useful in contributing to Orca. |
| worker/ | Contains the logic for grading a submission with a given `GradingJob`.                                           |
| web-client/ | React application logic for allowing professors and admins to manage the grading queue.                          |
| orchestrator/ | Web API and Build service for grader image and grading job management.                                                                       |

## Stack

Orca expects the following tools with these versions:

- Docker 27.x.x
- Postgres 10.x.x
- Node 21.0.0 (Web Server and Client)
- Python 3.10.6 (Worker)
