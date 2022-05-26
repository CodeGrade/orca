## Redis Grading Job/Queue Set Up:

The following is a description of a possible Redis implementation for a GradingJob processing queue.

**Note:** Keywords in `ALL_CAPS` are Redis operations.

### Redis Data Structures

`String` QueuedGradingInfo.<sub_id> => GradingJob

`ZSet` GradingQueue => `{ <"team" | "user" | "sub">.id: release_time }`

`List` SubmitterInfo.<team_id | user_id> => `[ sub_id_0, sub_id_1, ..., sub_id_n ]`


### Client Adds Job to Queue:

```
lifetime = Math.max(GradingJob.priority + 10 seconds, EXPIRETIME(`QueuedGradingInfo.${GradingJob.sub_id}`))
SET(`QueuedGradingInfo.${GradingJob.sub_id}`, GradingJob, ex=lifetime)
next_task = team.{team_id} | user.{user_id}
LPUSH(`SubmitterInfo.${next_task}`, GradingJob.sub_id)
EXPIRE(`SubmitterInfo.${next_task}`, lifetime)
ZSET(GradingQueue, next_task, GradingJob.priority)
```

### Client adds submission for immediate grading:

```
lifetime = Math.max(GradingJob.priority + 10 seconds, EXPIRETIME(`QueuedGradingInfo.${GradingJob.sub_id}`))
SET(`QueuedGradingInfo.${GradingJob.sub_id}`, GradingJob, ex=lifetime)
ZSET(GradingQueue, sub.{GradingJob.sub_id}, GradingJob.priority)
```

### Client Extracts Job To Grade:

```
next_task = ZPOPMIN(GradingQueue)
if (next_task STARTS WITH sub) {
	sub_id = next_task
} else {
	sub_id = LPOP(SubmitterInfo.next_task)
}
grading_info = GET(QueuedGradingInfo.{sub_id})
```

<hr>

Policy: Orca will grade a **Team's** submission in reverse order of submissions, i.e., most recent first.
Policy: Bottlenose can delay submissions by giving them priorities that are timestamps in the future.
Policy: Bottlenose can allow professors to immediately grade by setting a timestamp of _now_.
