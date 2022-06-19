# Questions

- [ ] Is there an example format for react typescript I should follow
- [ ] Restructuring files in orca may have messed up database setup
- [ ] How do min and max wait time work? (how do we know the min/max time a job may take)
- [ ] Do we want user to be able to create new job through orca web client? or just be able to manipulate existing jobs?

# Navbar

- [ ] Orca logo
- [ ] Figure out what other nav links are required (login, other tabs, etc.)

---

# Dashboard

## Wait Times

- [ ] Maybe make vertical next to the queue information (responsive behavior?)
- [ ] Move to overarching 'Queue' component

## Queue

### Queue Content

- [ ] Set background color of each queue item based on whether it is longer than average time, shorter than average time, or around average time (have to decide what to consider ;around average time')
- [ ] Paginted queue content list (e.g., https://gist.github.com/rxtur/6c29e2b0d81bac2578ca)
- [ ] Abstrat job info table to its own component
- [ ] Weird extra underline below first job info table entry
- [ ] What other field/info should I display in `QueueItem` entry (num max retries, link to student code, link to starter code, etc.)
- [ ] Find better way to conditionally render user id, team id or neither in `QueueItem` table
- [ ] Move wait time below `QueueItem` table?
- [ ] Top right of `QueueItem` card currently displays priority when it should be position in queue (want to be given that info)
