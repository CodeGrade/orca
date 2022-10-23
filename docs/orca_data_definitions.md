# Data Definitions - Orca/Grading VMs

This document explores the shape of data exchanged between various points in the Orca workflow, where JSON objects are passed:

1. From Bottlenose to the Orca Web Server
2. From the Orca Web Server to the Redis Grading Queue
3. From the Redis Grading Queue to the Orca Grading VM
4. From the Orca VM to Bottlenose

## `GradingJob`

<hr>

A `GradingJob` contains details about how to grade a submission.

```typescript
interface GradingJob {
  key: JSONString;
  collation: Collation;
  metadata_table: Map<string, string>;
  files: Map<string, CodeFileInfo>;
  priority: integer;
  script: GradingScriptCommand[];
  response_url: string;
}
```

The `key` is produced by Bottlenose and is unique to a given GradingJob. Orca will never abscribe meaning to the key (i.e., parse the `JSONString`) and only uses it as an identifier. **The given key must not contain a `.` character.**

Orca needs to know if it belongs to a single user or a team to maintain an ordered list of jobs to be graded for their owners.

<hr>

### `Collation`

```typescript

enum CollationType {
  User = "user"
  Team = "team"
}

interface Collation {
  type: CollationType;
  id: string;
}
```

`Collation` objects specify relevant ownership info for the grading queue.

<hr>

The Orca Web Client is filterable by useful metadata for a given grading job. `GradingJob`s specify a dictionary of field names that are mapped to a given identifier.

For example, JUnit Grader for Assignment 1 might have a metadata field of:

```json
{
  "assignment_name": "Assignment 1",
  "grader_description": "A1 JUnit Grader",
  "grader_id": "1234"
}
```

`GradingJob`s contain code files to be used for grading, with a unique and (ideally) descriptive name mapped to each one. Grading VMs download files in a directory matching this name.

<hr>

### `CodeFileInfo`

A `CodeFileInfo` contains a URL to files necessary to grade this submission. A MIME type is also included so that the grading VM can download and extract (as necessary) files correctly.

```typescript
interface CodeFileInfo {
  url: string;
  mime_type: string;
}
```

<hr>

Grading jobs have a numeric priority determined by Bottlenose, which is interpreted as a _delay_ to be applied to the job when added to the queue.

The script defines the actual grading process, as a state machine specified below.

<hr>

### `GradingScriptCommand`

A grading script takes many steps to complete, and the output of these steps needs to be captured in a useful way to send back to Bottlenose. Orca internalizes these steps as a list of `GradingScriptCommand`s rather than using a `Makefile` as a means of execution. This list encodes a control flow graph, and Orca requires this graph be **acyclic**.

`GradingScriptCommand`s can take on either of the following representations:

```typescript
interface BashGradingScriptCommand {
  cmd: string;
  on_fail: 'abort' | number;
  on_complete: 'output' | number;
}
```

A `BashGradingScriptCommand` describes a step in the grading script that requires interaction with the shell. This can be compilation, running grader tests, etc. The `cmd` key points to the bash command to run.

Each command could either succeed or fail. If successful and `on_complete` says to _output_, or if failed and `on_fail` says to _abort_, then the script exits and sends the results back to Bottlenose. Otherwise, the `on_fail` and `on_complete` keys specify the index of the next `GradingScriptCommand` to execute.

```typescript
interface ConditionalGradingScriptCommand {
  condition: GradingScriptCondition;
  on_true: number;
  on_false: number;
}

interface GradingScriptCondition {
  predicate: 'exists' | 'file' | 'dir';
  path: string;
}
```

A `ConditionalGradingScriptCommand` allows the control flow of a script to branch. Currently, the only predicates we support test for various file system contents.

The `GradingScriptCondition` defines how to check for the existence of an object in the file path: either as a file (`'file'`), a directory (`'dir'`), or as either one (`'exists'`). The `on_true` and `on_false` keys specify which command to run next, accordingly.

<hr>

## `GradingJobOutput`

Execution of a grading job will result in a `GradingJobOutput` object to send back data to Bottlenose.

```typescript
interface GradingJobOutput {
  tap_output?: string;
  shell_responses: [GradingScriptCommandResponse];
  errors?: [string];
  key: JSONString;
}

interface GradingScriptCommandResponse {
  stdout: string;
  stderr: string;
  status_code?: int;
  timed_out: boolean;
  cmd: string;
}
```

The output includes the key given in the original job for use on the Bottlenose side. The `shell_responses` array contains a transcript of the output from each `GradingScriptCommand`.

A successful `GradingJobOutput` will _always_ contain TAP output. An unsuccessful `GradingJobOutput` will still contain any responses of commands executed by the script; if the Orca VM harness fails (e.g., due to resource limits) the `errors` array will be non-empty.
