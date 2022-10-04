# Data Definitions - Orca/Grading VMs

The following are data definitons to describe the shapes of objects passed around between Bottlenose and Orca, as well as Orca and Grading VMs it spins up.

## `GradingJob`

<hr>

A `GradingJob` is a JSON object that contains details about how to grade a submission. The following is the basic data structure:

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

`GradingJob`s require a Grade Id and Submission Id (pulled from Bottlenose), as well as details about a student's code files (in the form of a `CodeFileInfo` object) to be autograded. These are mapped to the `grade_id`, `submission_id`, and `target_code` keys, respectively.

<hr>

### `CodeFileInfo`

A `CodeFileInfo` is simply a JSON object that contains the URL to an assignment starter, submission,
or test file, as well as the MIME type of the file.

```typescript
{
  "url": string,
  "mime_type": string
}
```

<hr>

Starter code and/or professor code may also be provided by Bottlenose as `CodeFileInfo` objects.

Grading jobs have a priority `int`, which is a _delay_ (determined by Bottlenose) to be placed on the job when added to the queue. The object must also contain a grading script (specified by the `grading_script` key), which are a specification of `GradingScriptCommand` objects.

<hr>

### `GradingScriptCommand`

A `GradingScriptCommand` is an interface that defines an execution step during the autograding process. It can take the shape of one of the following:

```typescript
interface BashGradingScriptCommand {
  cmd: string;
  on_fail: 'abort' | number;
  on_complete: 'output' | number;
}
```

A `BashGradingScriptCommand` describes a step in the GradingScript where there is an interaction with the shell itself. This can be compilation, running grader tests, etc.

The `cmd` key holds a string which is a shell command to be executed by the autograding program. Commands include but are not limited to copying contents, compiling code, or running tests.

The `on_fail` value is a string of either `"abort"` or an integer that maps to another command in the list. When executing the script, if the command fails it will either exit the script if `on_fail` is set to `"abort"`, or will go to the command at the specified index.

The `on_complete` key serves a similar purpose to `on_fail`, but now we exit the script successfully upon the key word `"output"`. If the key maps to an integer, we instead go to that index in the script. Usually, this will just be the next command in the array.

```typescript
interface GradingScriptCondition {
  predicate: 'exists' | 'file' | 'dir';
  path: string;
}

interface ConditionalGradingScriptCommand {
  condition: GradingScriptCondition;
  on_true: number;
  on_false: number;
}
```

A `ConditionalGradingScriptCommand` is essentially an _if-else_ statement implementation that dictates the flow of the script based on the file system.

The `GradingScriptCondition` defines how to check for the existence of an object in the file path: either as a file (`'file'`), a directory (`'dir'`), or as either one (`'exists'`). This existence query of the file system will decide which command to move onto next, specified by keys `on_true` and `on_false`.

What this list is forming is a graph of commands, where our on\_\* keys will serve as an edge to the next command. Currently, these scripts will be auto-generated on the Bottlenose side as **Directed Acyclic Graphs**, which will be our means of preventing an infinite loop of execution given a grading script.

<hr>

A `GradingJob` may optionally also specify the following keys and their respective values:

- `starter_code` : A file path to starter code files provided by the assignment. Starter exists **iff** professor code also exists.
- `professor_code` : A file path to professor code, a.k.a. tests used for grading an assignment. Professor code exists **iff** starter code also exists for an assignment.

Finally, a `GradingJob` may specify either a `team_id`, `student_id`, or neither. This is based on whether the submission to be graded was submitted by a team, individual student, or a professor, respectively.

## `GradingJobOutput`

Once a grading job has been completed on the VM, we use a `GradingJobOutput` object to send back the data to Bottlenose. Let's take a look at its shape and break down the required and optional keys:

```typescript
interface GradingScriptCommandResponse {
  stdout: string;
  stderr: string;
  status_code?: int;
  timed_out: boolean;
  cmd: string;
}

interface GradingJobOutput {
  tap_output?: string;
  shell_responses: [string];
  errors?: [string];
  grade_id: number;
  submission_id: number;
  user_id?: number;
  team_id?: number;
}
```

The required fields for the output include the grade ID and the submission ID associated with the job, as well as `shell_responses`, which maps to an array of `GradingScriptCommandResponse`s. These response objects are generated by execution of a `BashGradingScriptCommand`, and contain the original command, a boolean denoting whether or not the command timed out, the command's status code (if applicable), and the resulting STDOUT and STDERR content.

The optional fields are the following:

- `tap_output` : The Test Anything Protocol (TAP) contents from a successful test execution.
- `errors` : An array of execution error messages (i.e., in the VM program) received from executing the grading script.
