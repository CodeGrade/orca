## Redis Grading Job/Queue Set Up:

The following is a description of a possible Redis implementation for a GradingJob processing queue.

**Note:** Keywords in `ALL_CAPS` are Redis operations.

### Redis Data Structures

`String` QueuedGradingInfo.<sub_id> => GradingJob

`ZSet` GradingQueue => `{ <"team" | "user" | "sub">.id.nonce: release_time }`

`List` SubmitterInfo.<"team" | "user">.<team_id | user_id> => `[ sub_id_0, sub_id_1, ..., sub_id_n ]`

**NOTE**: the _nonce_ in the grading queue will be the timestamp when the job was added to the queue. The nonce is needed so that if a student spams multiple jobs, each of those jobs reserves a place in the queue.

### Client Adds Job to Queue:

```
lifetime_buffer = 60 * 60 * 24 # Add buffer of 1 day to expiry.
arrival_time = time.now()
lifetime = Math.max(GradingJob.priority + arrival_time + life_time_buffer, EXPIRETIME(`QueuedGradingInfo.${GradingJob.sub_id}`))
SET(`QueuedGradingInfo.${GradingJob.sub_id}`, GradingJob, ex=lifetime)
next_task = team.${team_id}.${arrival_time} | user.${user_id}.${arrival_time}
LPUSH(`SubmitterInfo.${next_task}`, GradingJob.sub_id)
EXPIRE(`SubmitterInfo.${next_task}`, lifetime)
ZSET(GradingQueue, next_task, GradingJob.priority + arrival_time)
```

### Client adds submission for immediate grading:

```
lifetime_buffer = 60 * 60 * 24 # Add buffer of 1 day to expiry.
arrival_time = time.now()
lifetime = Math.max(arrival_time + lifetime_buffer, EXPIRETIME(`QueuedGradingInfo.${GradingJob.sub_id}`))
SET(`QueuedGradingInfo.${GradingJob.sub_id}`, GradingJob, ex=lifetime)
ZSET(GradingQueue, sub.${GradingJob.sub_id}.${arrival_time}, GradingJob.priority)
```

### Client Extracts Job To Grade:

```
next_task = ZPOPMIN(GradingQueue)
if (next_task STARTS WITH sub) {
	_, id, _ = next_task.split(".")
} else {
	id_type, id, _ = next_task.split(".")
	sub_id = LPOP(SubmitterInfo.id_type.id)
}
grading_info = GET(QueuedGradingInfo.{sub_id})
```

<hr>

Policy: Orca will grade a **Team's** submission in reverse order of submissions, i.e., most recent first.
Policy: Bottlenose can delay submissions by giving them priorities that are delays -- which Orca sums with `time.now()` to generate a timestamp in the future.
Policy: Bottlenose can allow professors to immediately grade by setting a timestamp of _now_.

For now, assume `delay = (# of subs in last 15 mins) * 1 min`.
