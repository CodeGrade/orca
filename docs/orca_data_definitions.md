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
  submission_id: number;
  grade_id: number;
  grader_id: number;
  course_id: number;
  fixture_code?: CodeFileInfo;
  target_code: CodeFileInfo;
  test_code?: CodeFileInfo;
  priority: integer;
  script: [GradingScriptCommand];
  team_id?: number;
  user_id?: number;
  user_names?: [string];
  submitter_name: string;
}
```

**TODO: Why the hell did we use grader_id in here and NOT grader type?**

The grade ID and submission ID _alone_ are sufficient to send the grading results back to Bottlenose. The course ID, submitter name, usernames, user ID, and team ID are included to provide useful metadata in the Orca UI.

The fixture code, target code, and test code provide the setup, student code, and test cases (if any) for this submission.

The script defines the actual grading process, as a state machine specified below.

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
  grade_id: number;
  submission_id: number;
  user_id?: number;
  team_id?: number;
}

interface GradingScriptCommandResponse {
  stdout: string;
  stderr: string;
  status_code?: int;
  timed_out: boolean;
  cmd: string;
}
```

The output includes the grade ID and the submission ID associated with the job. The `shell_responses` array contains a transcript of the output from each `GradingScriptCommand`.

A successful `GradingJobOutput` will _always_ contain TAP output. An unsuccessful `GradingJobOutput` will still contain any responses of commands executed by the script; if the Orca VM harness fails (e.g., due to resource limits) the `errors` array will be non-empty.
