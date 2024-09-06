# Data Definitions

This document explores the shape of data exchanged between various points in the Orca workflow, where JSON objects are passed:

1. From grading job source to the Orchestrator Web Server
2. From the Orca Web Server to the Grading Queue
3. From the Grading Queue to the Worker
4. From the Worker back to grading job source

While Orca is mainly suited to integrate with Bottlenose, in theory it could be used with any source that can submit a grading job and accept its result.

## `GradingJobConfig`

<hr>

A `GradingJobConfig` contains details about how to grade a submission.

```typescript
interface GradingJob {
  key: JSONString;
  collation: Collation;
  metadata_table: Record<string, string>;
  files: Record<string, CodeFileInfo>;
  priority: integer;
  script: GradingScriptCommand[];
  response_url: string;
  container_response_url?: string;
  grader_image_sha: string;
}
```

The `key` is a unique string provided by the job source used to identify it when an Orca worker sends its result back. Orca will never ascribe meaning to the key (i.e., parse the `JSONString`) and only uses it as an identifier.

Orca needs to know if a job belongs to a single user or a team to maintain an _ordered list_ of jobs to be graded for their owners.

<hr>

### `Collation`

```typescript

type CollationType = "user" | "team";

interface Collation {
  type: CollationType;
  id: string;
}
```

`Collation` objects specify relevant ownership info for the grading queue.

<hr>

The Orca Web Client is filterable by useful metadata for a given grading job. `GradingJob`s specify a dictionary of field names that are mapped to a given identifier.

For example, the JUnit Grader for Assignment 1 might have a metadata field of:

```json
{
  "assignment_name": "Assignment 1",
  "grader_description": "A1 JUnit Grader",
  "grader_id": "1234"
}
```

`GradingJobConfig`s contain files to be used for grading, with a unique and (ideally) descriptive name mapped to each one. Workers download files in a directory matching this name.

<hr>

### `FileInfo`

A `FileInfo` contains a URL to files necessary to grade this submission. A MIME type is also included so that the worker can download and extract (as necessary) files correctly.

```typescript
interface CodeFileInfo {
  url: string;
  mime_type: string;
  should_replace_paths: boolean;
}
```

A given file may contain file paths to be updated for use inside a grading container. For example, `javac` can utilize a list of files for compilation. The `should_replace_paths` field indicates to the worker whether a file should be updated.

<hr>

Grading jobs have a numeric priority determined by their sources, which is interpreted as a _delay_ to be applied to the job when added to the queue.

Jobs are run inside Docker containers to provide a level of isolation from the local machine. When an assignment is generated, professors will provide a Dockerfile to build their grader image. Orca's web server will build this image and save it to a .tgz file with the name `<SHA>.tgz`, where `<SHA>` is the SHA sum generated from the image's Dockerfile.

The worker will use the `grader_image_sha`'s value to determine if the image already exists on its local machine or if it should be downloaded from the URL `https://<orca-server-hostname>/images/<SHA>.tgz`.

The script defines the actual grading process, as a state machine specified below.

<hr>

### `GradingScriptCommand`

A grading script takes many steps to complete, and the output of these steps needs to be captured in a useful way to send back to job's originator. Orca internalizes these steps as a list of `GradingScriptCommand`s rather than using a `Makefile` as a means of execution. This list encodes a control flow graph, and Orca requires this graph be **acyclic**.

`GradingScriptCommand`s can take on either of the following representations:

```typescript
interface BashGradingScriptCommand {
  cmd: string[] | string;
  on_fail?: string | number | Array<GradingScriptCommand>;
  on_complete?: string | number | Array<GradingScriptCommand>;
  label?: string;
  working_dir?: string;
}
```

A `BashGradingScriptCommand` describes a step in the grading script that requires interaction with the shell. This can be compilation, running grader tests, etc. The `cmd` key points to the bash command to run with its options and arguments. It is generally recommended to pass in a sequence of program arguments (e.g., `["javac", ...]`), however in the case of needing to use shell utilities (e.g., a subshell with `(<cmd>)`), a `string` would be necessary.

Each command could either succeed or fail. If successful and `on_complete` says to _output_, or if failed and `on_fail` says to _abort_, then the script exits and sends the results back to the job's source.

These terminating cases are indicated by the following:
* `on_fail` is either excluded or points to the reserved keyword `"abort"`.
* `on_complete` points to the reserved keywork `"output"`.

If `on_complete` is not specified, then the state machine goes to the next command in the list.

If either key points to the reserved keyword `"next"`, then the state machine will go to the next command.

Otherwise, the keys should point to one of the following:

- The _index_ of the desired next state.
- The next command's `label` property.
- A sub-script -- e.g., a procedure to be executed upon completion or failure of this command.

```typescript
interface ConditionalGradingScriptCommand {
  condition: GradingScriptCondition;
  on_true?: number | string | Array<GradingScriptCommand>;
  on_false?: number | string | Array<GradingScriptCommand>;
  label?: string;
}

interface GradingScriptCondition {
  predicate: "exists" | "file" | "dir";
  path: string;
}
```

A `ConditionalGradingScriptCommand` allows the control flow of a script to branch. Currently, the only predicates we support test for various file system contents.

The `GradingScriptCondition` defines how to check for the existence of an object in the file path: either as a file (`'file'`), a directory (`'dir'`), or as either one (`'exists'`).

Similar to the `BashGradingScriptCommand`, the optional `on_true` and `on_false` keys specify which command to run next.

These pointers are almost exactly congruent to the `BashGradingScriptCommand`'s `on_complete` and `on_fail` properties, except that a script **cannot exit** from a `ConfitionalGradingScriptCommand`.

<hr>

## `GradingJob`

```typescript
interface AdditionalJobInformation {
  created_at: Date;
  release_at: Date;
  queue_id: number;
}

type GradingJob = GradingJobConfig & QueuedJobInformation;
```

Once a `GradingJobConfig` has been received and validated by the server, it is enqueued by creating records in the Postgres database.

All references to the job's information will now be in the form of a `GradingJob`: a combination of the original `GradingJobConfig` and new `AdditionalJobData`. The latter's properties are interpreted as the following:

* `created_at` - the date and time of the job's creation.
* `release_at` - the date and time at which a job is guaranteed to be in the front of the queue.
* `queue_id` - the primary key of the `Job` record in the database.

<hr>

## `GradingJobResult`

Execution of a grading job will result in a `GradingJobResult` object to be sent back to a job's `response_url` with its `key`.

_Optionally_, a `container_response_url` may be included for local development as if the grading container needs to contact an test echo server also running in a container, then there will be a need for separate `http://localhost` and `http://<container_name>` URLs.

```typescript
interface GradingJobResult {
  output?: string;
  shell_responses: [GradingScriptCommandResponse];
  errors?: [string];
}

interface GradingScriptCommandResponse {
  stdout: string;
  stderr: string;
  status_code?: int;
  timed_out: boolean;
  cmd: string;
}
```

The output includes the key given in the original job for use by its originator. The `shell_responses` array contains a transcript of the output from each `GradingScriptCommand`.

A successful `GradingJobResult` will _always_ contain `output`.

An unsuccessful `GradingJobResult` will still contain any responses of commands executed by the script.

If the worker fails (e.g., due to resource limits) or an operation on the server removes the job (e.g., cancelling a job in the queue), the `errors` property will contain a non-empty array.
