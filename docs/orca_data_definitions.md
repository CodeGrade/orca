# Data Definitions - Orca/Grading VMs

The following are data definitons to describe the shapes of objects passed around between Bottlenose and Orca, as well as Orca and Grading VMs it spins up.

## `GradingJobConfig`

<hr>

A `GradingJobConfig` is a JSON object that contains details about how to grade a submission. The following is the basic data structure:

```
{
  submission_id: string,
  grade_id: string,
  starter_code?: string,
  student_code: string,
  professor_code?: string,
  max_retries?: number
  script: [GradingScriptCommands]
}
```

`GradingJobConfig`s require a Grade Id and Submission Id (pulled from Bottlenose), as well as a path to a student's code files to be autograded. These are mapped to the `grade_id`, `submission_id`, and `student_code` keys, respectively. The object must also contain a grading script (specified by the `grading_script` key), which are a series of steps to execute such that an assignment can be graded. Each item in the list is in the shape of a `GradingScriptCommand` object.

<hr>

### `GradingSciptCommand`

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
  updatedAt: Date;
}
```

The `GradingJobConfig` here contains the same shape described above, specifically post-decoding and represented using dictionaries/hashes, lists/tuples, and other data structure implementations for the language in use on the server. The `spamCounter` is used as a means to determine how many

## Remaining Questions

With the data definitions laid out above, here are some remaining questions to determine the shape of the rest of our data:

- Is the shape of jobs put in a Task Queue anything more than a _reference_ to a `GradingJob` in the database?
- Is the configuration we pass to the Grading VM any different from the `GradingJobConfig` described above (i.e., the one Bottlenose sends to Orca)?
