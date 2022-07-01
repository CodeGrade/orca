# Questions/Concerns

- [ ] Restructuring files in orca may have messed up database setup

# API

- [ ] Error handling for axios requests
- [ ] Need to remove anything having to do with postgres database and replace with redis stuff

# GradingJobReducer

- [ ] Abstract functionality for moving jobs to front/back

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

- [ ] Redesign UI for visualizing a grading job
- [ ] Paginated queue content list (e.g., https://gist.github.com/rxtur/6c29e2b0d81bac2578ca) \*\*
- [ ] Abstract job info table to its own component
- [ ] What other field/info should I display in `QueueItem` entry (num max retries, link to student code, link to starter code, etc.)
- [ ] Find better way to conditionally render user id, team id or neither in `QueueItem` table
- [ ] Extrapolate something more useful from a job's `priority` (datetime, position in queue, etc.)
