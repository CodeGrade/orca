# Redis Grading Job Queue Set Up

Explanation for why Redis was the choice for the queue.

## Data Definitions

A full implementation of the grading queue requires three pieces of functionality:

1. Knowing when a job is ready to be extracted and graded.
2. Retrieving the next submission to be graded for a given team or user.
3. Obtaining the `GradingJob` object for a given submission.

### GradingQueue: ZSet

The data definiton for **(1)** must support a priority-based ordering of jobs and contain information to be used in **(2)**.

Redis' `ZSet` data structure is an ordered set with keys sorted by a given _score_ value (in practice, this is more usefully typed as an `OrderedMap<string, number>`). This can be utilized to create a priority queue of IDs to be popped off when a grading VM is ready to extract a new job.

```
ZSet GradingQueue => { <"team" | "user" | "sub">.<id>.nonce: release_time }
```

The set is mapped to the key `GradingQueue`, and each key is a unique identifier with either a user, team, or submission ID needed for retrieving the associated grading job. Keys receive a score equivalent to the timestamp of when they should be released for grading.

Each `ZSet` key also has a _nonce_, which is used to ensure students spamming the queue with multiple jobs reserve a corresponding spot. This nonce is the timestamp of when the job was enqueued.

### SubmitterInfo: List

Submission IDs for an individual or team submission must be stored in a FIFO Queue. This can be implemented with a Redis `List`, where the list is mapped to a key containing the given user/team ID.

```
List SubmitterInfo.<"team" | "user">.<team_id | user_id> => [ sub_id_0, sub_id_1, ..., sub_id_n ]
```

Order of the queue is maintained by only ever appending submission IDs and popping the first ID off the list.

There is never a `SubmitterInfo.sub.<id>` key due to redundancy.

### QueuedGradingInfo

`GradingJob` objects are individually mapped to keys that use a given submission ID from either `GradingQueue` or `SubmitterInfo`.

```
String QueuedGradingInfo.<sub_id> => GradingJob
```

Only one `GradingJob` exists per submission ID so that the most recent grading script specifications provided by a professor are used for grading.

Policy: Bottlenose can allow professors to immediately grade by setting a timestamp of _now_.

## Web Server: Adding a Job to the Queue

Orca will queue up grading jobs based on their user ID or team ID. The `QueuedGradingInfo` for a submission is updated to the given `GradingJob` object, and the submission ID for this object will be pushed onto the `SubmitterInfo` FIFO queue using Redis' `RPUSH` operation, ensuring it is added to the back.

`GradingJob`s sent from Bottlenose will contain a _priority_, which is a delay to be placed on a job. For now, assume `delay = (# of subs in last 15 mins) * 1 min`.

```typescript
lifetime_buffer = 60 * 60 * 24 // A day in seconds.
arrival_time = time.now()
lifetime = Math.max(GradingJob.priority + arrival_time + life_time_buffer, EXPIRETIME(`QueuedGradingInfo.${GradingJob.sub_id}`))
SET(`QueuedGradingInfo.${GradingJob.sub_id}`, GradingJob, ex=lifetime)
next_task = team.${team_id}.${arrival_time} | user.${user_id}.${arrival_time}
RPUSH(`SubmitterInfo.${next_task}`, GradingJob.sub_id)
EXPIREAT(`SubmitterInfo.${next_task}`, lifetime)
ZADD(GradingQueue, next_task, GradingJob.priority + arrival_time)
```

This priority is used to calculate the lifetime of all job info, where the value of this lifetime is the maximum of the lifetime of the current `QueuedGradingInfo` for that submission and the sum of priority, arrival time, and a buffer of one day. Orca uses Redis' expiration feature as a way to ensure items in the queue are cleaned up rather than implementing a constantly-running task.

The priority is also used to calculate the `ZSet` score of the job, which is just the sum of arrival time and the priority value.

## Web Server: Adding a Job for Immediate Grading

A professor may want to submit a job for immediate grading in the event they change the original test criteria.

Jobs added to the queue for immediate grading are added to the `GradingQueue` `ZSet` using the submission ID instead of the team or user ID. This allows the job to bypass the `SubmitterInfo` list, ensuring that they are placed at the front of the queue **in absolute**.

```typescript
lifetime_buffer = 60 * 60 * 24 // Add buffer of 1 day to expiry.
arrival_time = time.now()
lifetime = Math.max(arrival_time + lifetime_buffer, EXPIRETIME(`QueuedGradingInfo.${GradingJob.sub_id}`))
SET(`QueuedGradingInfo.${GradingJob.sub_id}`, GradingJob, ex=lifetime)
ZSET(GradingQueue, sub.${GradingJob.sub_id}.${arrival_time}, GradingJob.priority)
ZSET(GradingQueue, sub.{GradingJob.sub_id}, GradingJob.priority)
```

Bottlenose guarantees that all jobs submitted for immediate grading will have a priority of 0.

## Web Server: Moving a Job in the Queue

Jobs in the queue may either be:

- Moved to the back of the queue.
- Moved to the front of the queue.

```typescript
enum MoveJobAction {
  RELEASE = 'release',
  DELAY = 'delay',
}

interface MoveJobRequest {
  nonce: number;
  sub_id: number;
  move_action: MoveJobAction;
  team_id?: number;
  user_id?: number;
}
```

Moving a job requires the submission ID of the job, the nonce used in the job's corresponding key in the `GradingQueue` `ZSet`, the type of action to be taken, and either the team ID or user ID of the job. Jobs submitted for immediate grading cannot be moved.

```typescript
function moveJob(req: JobMoveRequest) {
  let new_priority: number;
  switch (req.move_action) {
    case MoveJobAction.RELEASE:
      new_priority = releaseJob(req);
      break;
    case MoveJobAction.DELAY:
      new_priority = delayJob(req);
      break;
    default:
      throw Error();
  }
  ZADD(
    'GradingQueue',
    `${req.user_id ? 'user' : 'team'}.${req.user_id || req.team_id}.${
      req.nonce
    }`
  );
}

const MOVE_TO_BACK_BUFFER = 10; // seconds

function delayJob(req: JobMoveReuquest) {
  queued_info_key = `QueuedGradingInfo.${req.sub_id}`;
  [last_job, last_priority] = ZRANGE('GradingQueue', -1, -1, WITHSCORES); // Gets job at back of queue
  new_priority = last_priority + MOVE_TO_BACK_BUFFER;
  new_lifetime = new_priority + LIFE_TIME_BUFFER;
  job = GET(queued_info_key);
  SET(queued_info_key, { ...job, priority: new_priority });
  EXPIRE_AT(queued_info_key, current_lifetime);
  EXPIRE_AT(
    `SubmitterInfo.${req.user_id ? 'user' : 'team'}.${
      req.user_id || req.team_id
    }`
  );
  return new_priority;
}

function releaseJob(req: JobMoveRequest) {
  queued_info_key = `QueuedGradingInfo.${req.sub_id}`;
  current_lifetime = EXPIRETIME(queued_info_key);
  job = GET(queued_info_key);
  new_priority = 0;
  SET(queued_info_key, { ...job, priority: new_priority });
  EXPIRE_AT(queued_info_key, current_lifetime);
  return new_priority;
}
```

A job is moved to the back of the queue by assigning it a new priority of `priorityOf(lastJobInQueue) + buffer`. The buffer is used to guaranteed that the given job will be placed at the back.

To move a job to the front (i.e., release the job),

### Examples

- Release a job -> job at front of queue
- Delay a job -> job at back of queue
- Release job_1, release job_2 -> job_2 in front of job_1, job_1 in front of job_3...job_n
- Delay job_1, delay job_2 -> job_2 is behind job_1, job_1 is behind job_3...job_n

## Web Server: Deleting a Job from the Queue

This functionality has yet to be implemented.

## Grading VM: Extracting Job From Queue

Grading jobs are popped from the queue using the submission id.

```typescript
next_task = ZPOPMIN('GradingQueue')
if (next_task STARTS WITH sub) {
	_, id, _ = next_task.split(".")
} else {
	id_type, id, _ = next_task.split(".")
	sub_id = LPOP(`SubmitterInfo.${id_type}.${id}`)
}
grading_info = GET(`QueuedGradingInfo.${sub_id}`)
```

This is either obtained directly by popping off the first item from `GradingQueue`, or by popping the first submission ID off of `SubmitterInfo` given the team/user ID from `GradingQueue`.
