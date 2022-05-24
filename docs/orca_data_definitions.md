# Data Definitions - Orca/Grading VMs

The following are data definitons to describe the shapes of objects passed around between Bottlenose and Orca, as well as Orca and Grading VMs it spins up.

## `GradingJobConfig`

<hr>

A `GradingJobConfig` is a JSON object that contains details about how to grade a submission. The following is the basic data structure:

```typescript
{
  submission_id: string,
  grade_id: string,
  starter_code?: string,
  student_code: string,
  professor_code?: string,
  max_retries?: number,
  script: [GradingScriptCommand]
}
```

`GradingJobConfig`s require a Grade Id and Submission Id (pulled from Bottlenose), as well as a path to a student's code files to be autograded. These are mapped to the `grade_id`, `submission_id`, and `student_code` keys, respectively. The object must also contain a grading script (specified by the `grading_script` key), which are a series of steps to execute such that an assignment can be graded. Each item in the list is in the shape of a `GradingScriptCommand` object.

<hr>

### `GradingScriptCommand`

A `GradingScriptCommand` defines an execution step during the autograding process, and takes the following shape:

```typescript
{
  cmd: string,
  on_fail: "abort" | "<number>",
  on_complete: "output" | "<number>"
}
```

The `cmd` key holds a string which is a shell command to be executed by the autograding program. Commands include but are not limited to copying contents, compiling code, or running tests.

The `on_fail` value is a string of either `"abort"` or a string containing an integer _i_ that is in the range [0, (# of commands) - 1]. When executing the script, if the command fails it will either exit the script if `on_fail` is set to `"abort"`, or will go to the command at the specified index.

The `on_complete` key serves a similar purpose to `on_fail`, but now we exit the script successfully upon the key word `"output"`. If the string contains an integer, we instead go to that index in the script. Usually, this will just be the next command in the array.

<hr>

A `GradingJobConfig` may optionally also specify the following keys and their respective values:

- `starter_code` : A file path to starter code files provided by the assignment. Starter exists **iff** professor code also exists.
- `professor_code` : A file path to professor code, a.k.a. tests used for grading an assignment. Professor code exists **iff** starter code also exists for an assignment.
- `max_retries` : The number of times a grading script can attempt to re-execute steps in the event it back-tracks to an index specified by the `on_fail` key of a `GradingScriptCommand`.

## `GradingJob` - (**Orca** Database Model)

A `GradingJob` is a class (through database ORM) which contains the following information (written in Typescript for easy formatting):

```typescript
class GradingJob {
  gradingJobConfig: GradingJobConfig;
  spamCounter: number;
  createdAt: Date;
}
```

The `GradingJobConfig` here contains the same shape described above, specifically post-decoding and represented using dictionaries/hashes, lists/tuples, and other data structure implementations for the language in use on the server. The `spamCounter` is used as a means to determine how many jobs have been submitted for a given submission/grade Id pair, generally within a certain time frame (tentatively 15 minutes). This value is used in task queues to determine priority. Finally, we also specify timestamps to track changes to the object.

## `GradingJobOutput`

Once a grading job has been completed on the Grading VM, we use a `GradingJobOutput` object to send back the data to Orca. Let's take a look at the shape and break down the required and optional keys:

```typescript
{
  tap_output?: string,
  audit: [string],
  errors?: [string],
  grade_id: string,
  submission_id: string
}
```

The required fields for the output include the grade Id and the submission Id associated with the job, as well as `audit`, which maps to a log (in the form of an array of strings) detailing the execution of the job.

The optional fields are the following:

- `tap_output` : The Test Anything Protocol (TAP) contents from a successful test execution.
- `errors` : An array of error messages received from executing the grading script.

**NOTE:** TAP output is present **iff** errors are not present, and errors are present **iff** TAP output is not present.

## Remaining Questions

With the data definitions laid out above, here are some remaining questions to determine the shape of the rest of our data:

- Is the shape of jobs put in a Task Queue anything more than a _reference_ to a `GradingJob` in the database?
- Is the configuration we pass to the Grading VM any different from the `GradingJobConfig` described above (i.e., the one Bottlenose sends to Orca)?
