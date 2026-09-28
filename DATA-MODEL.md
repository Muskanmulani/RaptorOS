# RaptorOS Data Model

## 1. Overview

RaptorOS uses PostgreSQL as its primary relational database.

The data model is organized around the complete hackathon lifecycle:

```text
Users
  ↓
Events
  ↓
Teams
  ↓
Projects
  ↓
Submissions
  ↓
Judging
  ↓
Scores
  ↓
Results / Audit / Voting
```

The schema also contains supporting tables for webhooks, judge participation records, certificates, and bulk import jobs.

PostgreSQL's `pgcrypto` extension is used to generate UUID primary keys.

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

Most primary keys use:

```sql
gen_random_uuid()
```

---

## 2. Entity Relationship Overview

```text
                              ┌──────────────┐
                              │    users     │
                              └──────┬───────┘
                                     │
                 ┌───────────────────┼───────────────────┐
                 │                   │                   │
                 ▼                   ▼                   ▼
          ┌─────────────┐     ┌─────────────┐     ┌──────────────┐
          │   events    │     │ team_members│     │    judges    │
          └──────┬──────┘     └──────┬──────┘     └──────┬───────┘
                 │                   │                   │
       ┌─────────┼─────────┐         │          ┌────────┼──────────┐
       │         │         │         │          │        │          │
       ▼         ▼         ▼         ▼          ▼        ▼          ▼
    teams     rubrics   webhooks   teams   invitations assignments records
       │         │
       ▼         ▼
    projects  criteria
       │         │
   ┌───┼────┐    │
   │   │    │    │
   ▼   ▼    ▼    ▼
subs assignments judgments
              │
              ▼
            scores

projects ───────► votes
projects ───────► comments

users ───────────► audit_logs
events ──────────► certificates
users ───────────► certificates
events ──────────► import_jobs
```

---

# 3. Core Tables

## 3.1 `users`

Stores all authenticated RaptorOS users.

### Columns

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | UUID | Primary Key | Unique user identifier |
| `name` | VARCHAR(100) | NOT NULL | User's display name |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Login/email identity |
| `password_hash` | TEXT | NOT NULL | Bcrypt password hash |
| `role` | VARCHAR(20) | NOT NULL, CHECK | User role |
| `created_at` | TIMESTAMP | Default current timestamp | Account creation time |

### Allowed roles

```text
participant
judge
organizer
admin
```

The `role` column has a database CHECK constraint restricting values to these four roles.

### Relationships

- One user can create multiple events.
- One user can belong to multiple teams through `team_members`.
- A judge user can have one record in `judges`.
- A user can create votes.
- A user can create project comments.
- A user can generate audit log entries.
- A user can receive certificates.

---

# 4. Event Management

## 4.1 `events`

Represents a hackathon event.

### Columns

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | UUID | Primary Key | Event identifier |
| `name` | VARCHAR(200) | NOT NULL | Event name |
| `description` | TEXT | Nullable | Event description |
| `start_date` | TIMESTAMP | NOT NULL | Event start |
| `end_date` | TIMESTAMP | NOT NULL | Event end |
| `submission_deadline` | TIMESTAMP | NOT NULL | Final submission deadline |
| `status` | VARCHAR(20) | CHECK | Event lifecycle state |
| `community_voting_enabled` | BOOLEAN | Default FALSE | Enables community voting |
| `voting_start` | TIMESTAMP | Nullable | Voting start |
| `voting_end` | TIMESTAMP | Nullable | Voting end |
| `hide_voting_results` | BOOLEAN | Default TRUE | Controls voting result visibility |
| `created_by` | UUID | FK → `users.id`, NOT NULL | Event creator |
| `created_at` | TIMESTAMP | Default current timestamp | Creation time |

### Allowed statuses

```text
draft
active
judging
completed
```

### Relationships

```text
users 1 ──── N events
```

The `created_by` column identifies the user who created the event.

An event can have:

- Many teams
- Many rubrics
- Many judge invitations
- Many webhook endpoints
- Many judge participation records
- Many certificates
- Many import jobs

---

# 5. Teams

## 5.1 `teams`

Represents a participant team within an event.

### Columns

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | UUID | Primary Key | Team identifier |
| `event_id` | UUID | FK → `events.id`, NOT NULL | Associated event |
| `name` | VARCHAR(100) | NOT NULL | Team name |
| `invite_code` | VARCHAR(50) | UNIQUE, NOT NULL | Team invitation code |
| `created_at` | TIMESTAMP | Default current timestamp | Creation time |

### Relationships

```text
events 1 ──── N teams
```

Deleting an event cascades to its teams.

---

## 5.2 `team_members`

Associates users with teams.

This is a junction table implementing the many-to-many relationship between users and teams.

### Columns

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `team_id` | UUID | FK → `teams.id` | Team |
| `user_id` | UUID | FK → `users.id` | Member |
| `joined_at` | TIMESTAMP | Default current timestamp | Join time |

### Primary Key

```text
(team_id, user_id)
```

This prevents the same user from being added to the same team more than once.

### Relationships

```text
users N ──── N teams
```

through:

```text
team_members
```

Both foreign keys use `ON DELETE CASCADE`.

---

# 6. Projects and Submissions

## 6.1 `projects`

Represents a project submitted by a team.

### Columns

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | UUID | Primary Key | Project identifier |
| `team_id` | UUID | UNIQUE, FK → `teams.id` | Owning team |
| `title` | VARCHAR(200) | NOT NULL | Project title |
| `tagline` | VARCHAR(300) | Nullable | Short project description |
| `description` | TEXT | Nullable | Project description |
| `repository_url` | TEXT | Nullable | Source repository |
| `demo_url` | TEXT | Nullable | Demo URL |
| `created_at` | TIMESTAMP | Default current timestamp | Creation time |
| `updated_at` | TIMESTAMP | Default current timestamp | Last update |

### Important constraint

```sql
team_id UUID UNIQUE
```

This creates a one-to-one relationship between a team and a project.

Therefore, one team can have at most one project.

### Relationship

```text
teams 1 ──── 1 projects
```

---

## 6.2 `submissions`

Stores versioned project submissions.

### Columns

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | UUID | Primary Key | Submission identifier |
| `project_id` | UUID | FK → `projects.id` | Project |
| `version` | INTEGER | NOT NULL | Submission version |
| `status` | VARCHAR(20) | CHECK | Draft/submitted state |
| `content` | TEXT | Nullable | Submission content |
| `submitted_at` | TIMESTAMP | Nullable | Submission timestamp |
| `created_at` | TIMESTAMP | Default current timestamp | Creation time |

### Allowed statuses

```text
draft
submitted
```

### Unique constraint

```text
(project_id, version)
```

A project cannot have two submissions with the same version number.

### Relationship

```text
projects 1 ──── N submissions
```

This allows submission history such as:

```text
Project
 ├── Version 1
 ├── Version 2
 └── Version 3
```

---

# 7. Judge Management

## 7.1 `judges`

Represents a judge profile associated with a user.

### Columns

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | UUID | Primary Key | Judge identifier |
| `user_id` | UUID | UNIQUE, FK → `users.id` | Associated user |
| `created_at` | TIMESTAMP | Default current timestamp | Judge record creation |

### Relationship

```text
users 1 ──── 0..1 judges
```

The unique constraint on `user_id` ensures that a user can have at most one judge record.

---

## 7.2 `judge_invitations`

Stores event-specific judge invitations.

### Columns

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | UUID | Primary Key | Invitation identifier |
| `event_id` | UUID | FK → `events.id` | Event |
| `judge_id` | UUID | FK → `judges.id` | Invited judge |
| `status` | VARCHAR(20) | CHECK | Invitation state |
| `invited_at` | TIMESTAMP | Default current timestamp | Invitation time |
| `responded_at` | TIMESTAMP | Nullable | Response time |

### Allowed statuses

```text
pending
accepted
declined
```

### Unique constraint

```text
(event_id, judge_id)
```

A judge receives at most one invitation for a specific event.

---

## 7.3 `judge_assignments`

Maps judges to projects they are expected to evaluate.

### Columns

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | UUID | Primary Key | Assignment identifier |
| `judge_id` | UUID | FK → `judges.id` | Assigned judge |
| `project_id` | UUID | FK → `projects.id` | Assigned project |
| `assigned_at` | TIMESTAMP | Default current timestamp | Assignment time |

### Unique constraint

```text
(judge_id, project_id)
```

The same judge cannot be assigned to the same project twice.

### Relationships

```text
judges N ──── N projects
```

through:

```text
judge_assignments
```

---

# 8. Rubrics and Scoring

## 8.1 `rubrics`

Stores an event's judging rubric.

### Columns

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | UUID | Primary Key | Rubric identifier |
| `event_id` | UUID | FK → `events.id` | Associated event |
| `name` | VARCHAR(200) | NOT NULL | Rubric name |
| `created_at` | TIMESTAMP | Default current timestamp | Creation time |

### Relationship

```text
events 1 ──── N rubrics
```

---

## 8.2 `rubric_criteria`

Stores individual evaluation criteria belonging to a rubric.

### Columns

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | UUID | Primary Key | Criterion identifier |
| `rubric_id` | UUID | FK → `rubrics.id` | Parent rubric |
| `name` | VARCHAR(200) | NOT NULL | Criterion name |
| `description` | TEXT | Nullable | Criterion description |
| `weight` | DECIMAL(5,2) | CHECK > 0 | Criterion weight |
| `max_score` | DECIMAL(5,2) | CHECK > 0 | Maximum raw score |

### Relationships

```text
rubrics 1 ──── N rubric_criteria
```

A rubric can contain multiple criteria.

---

## 8.3 `judgments`

Represents a judge's evaluation of a project using a rubric.

### Columns

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | UUID | Primary Key | Judgment identifier |
| `judge_id` | UUID | FK → `judges.id` | Evaluating judge |
| `project_id` | UUID | FK → `projects.id` | Evaluated project |
| `rubric_id` | UUID | FK → `rubrics.id` | Rubric used |
| `submitted_at` | TIMESTAMP | Default current timestamp | Judgment submission time |

### Unique constraint

```text
(judge_id, project_id, rubric_id)
```

A judge cannot submit duplicate judgments for the same project and rubric.

### Relationships

```text
judges 1 ──── N judgments
projects 1 ──── N judgments
rubrics 1 ──── N judgments
```

---

## 8.4 `scores`

Stores individual criterion scores within a judgment.

### Columns

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | UUID | Primary Key | Score identifier |
| `judgment_id` | UUID | FK → `judgments.id` | Parent judgment |
| `criterion_id` | UUID | FK → `rubric_criteria.id` | Evaluated criterion |
| `raw_score` | DECIMAL(8,3) | CHECK >= 0 | Judge's raw score |
| `weighted_score` | DECIMAL(8,3) | Nullable | Calculated weighted score |

### Unique constraint

```text
(judgment_id, criterion_id)
```

A criterion can only have one score within a particular judgment.

### Relationship

```text
judgments 1 ──── N scores
rubric_criteria 1 ──── N scores
```

---

# 9. Community Features

## 9.1 `project_votes`

Stores community votes for projects.

### Columns

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | UUID | Primary Key | Vote identifier |
| `project_id` | UUID | FK → `projects.id` | Voted project |
| `user_id` | UUID | FK → `users.id` | Voting user |
| `created_at` | TIMESTAMP | Default current timestamp | Vote time |

### Unique constraint

```text
(project_id, user_id)
```

This ensures that a user can vote for a project only once.

### Relationships

```text
users N ──── N projects
```

through:

```text
project_votes
```

---

## 9.2 `project_comments`

Stores community comments on projects.

### Columns

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | UUID | Primary Key | Comment identifier |
| `project_id` | UUID | FK → `projects.id` | Commented project |
| `user_id` | UUID | FK → `users.id` | Comment author |
| `comment` | TEXT | NOT NULL | Comment content |
| `created_at` | TIMESTAMP | Default current timestamp | Creation time |
| `updated_at` | TIMESTAMP | Default current timestamp | Last update |

### Relationships

```text
projects 1 ──── N project_comments
users 1 ──── N project_comments
```

---

# 10. Audit and Integrity

## 10.1 `audit_logs`

Stores an auditable record of important system actions.

### Columns

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | UUID | Primary Key | Audit entry |
| `user_id` | UUID | FK → `users.id` | Actor |
| `action` | VARCHAR(100) | NOT NULL | Action performed |
| `entity_type` | VARCHAR(100) | Nullable | Affected entity type |
| `entity_id` | UUID | Nullable | Affected entity |
| `metadata` | JSONB | Nullable | Additional event data |
| `created_at` | TIMESTAMP | Default current timestamp | Action time |

The `user_id` relationship does not specify `ON DELETE CASCADE`, allowing audit records to remain even if the associated user is removed.

### Relationship

```text
users 1 ──── N audit_logs
```

---

# 11. Webhooks

## 11.1 `webhook_endpoints`

Stores configured webhook destinations.

### Columns

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | UUID | Primary Key | Webhook identifier |
| `event_id` | UUID | FK → `events.id` | Associated event |
| `url` | TEXT | NOT NULL | Webhook destination |
| `secret` | TEXT | NOT NULL | Webhook secret |
| `active` | BOOLEAN | Default TRUE | Whether endpoint is active |
| `created_at` | TIMESTAMP | Default current timestamp | Creation time |

### Relationship

```text
events 1 ──── N webhook_endpoints
```

---

## 11.2 `webhook_deliveries`

Tracks webhook delivery records.

### Columns

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | UUID | Primary Key | Delivery identifier |
| `webhook_id` | UUID | FK → `webhook_endpoints.id` | Endpoint |
| `event_name` | VARCHAR(100) | NOT NULL | Event being delivered |
| `payload` | JSONB | NOT NULL | Delivery payload |
| `status` | VARCHAR(20) | CHECK | Delivery state |
| `response_code` | INTEGER | Nullable | HTTP response code |
| `delivered_at` | TIMESTAMP | Nullable | Delivery time |
| `created_at` | TIMESTAMP | Default current timestamp | Record creation |

### Allowed statuses

```text
pending
success
failed
```

### Relationship

```text
webhook_endpoints 1 ──── N webhook_deliveries
```

---

# 12. Judge Participation Records

## 12.1 `judge_records`

Stores signed judge participation records.

### Columns

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | UUID | Primary Key | Record identifier |
| `judge_id` | UUID | FK → `judges.id` | Judge |
| `event_id` | UUID | FK → `events.id` | Event |
| `participation_type` | VARCHAR(50) | NOT NULL | Participation type |
| `issued_at` | TIMESTAMP | Default current timestamp | Issue time |
| `record_hash` | TEXT | NOT NULL | Record hash |
| `signature` | TEXT | NOT NULL | Signature |

### Unique constraint

```text
(judge_id, event_id)
```

A judge can have one participation record per event.

### Relationships

```text
judges 1 ──── N judge_records
events 1 ──── N judge_records
```

---

# 13. Certificates

## 13.1 `certificates`

Stores event certificates issued to users.

### Columns

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | UUID | Primary Key | Certificate identifier |
| `event_id` | UUID | FK → `events.id` | Event |
| `user_id` | UUID | FK → `users.id` | Certificate recipient |
| `certificate_type` | VARCHAR(50) | NOT NULL | Certificate category |
| `certificate_code` | VARCHAR(100) | UNIQUE, NOT NULL | Verification code |
| `issued_at` | TIMESTAMP | Default current timestamp | Issue time |
| `metadata` | JSONB | Nullable | Additional certificate data |

### Unique constraint

```text
(event_id, user_id, certificate_type)
```

This prevents duplicate certificates of the same type for the same user in the same event.

### Relationships

```text
events 1 ──── N certificates
users 1 ──── N certificates
```

---

# 14. Import Jobs

## 14.1 `import_jobs`

Tracks bulk data import operations.

### Columns

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | UUID | Primary Key | Import job identifier |
| `event_id` | UUID | FK → `events.id` | Associated event |
| `entity_type` | VARCHAR(50) | NOT NULL | Imported entity type |
| `status` | VARCHAR(20) | CHECK | Import state |
| `total_rows` | INTEGER | Default 0 | Total rows |
| `processed_rows` | INTEGER | Default 0 | Processed rows |
| `error_count` | INTEGER | Default 0 | Failed rows |
| `created_at` | TIMESTAMP | Default current timestamp | Job creation |
| `completed_at` | TIMESTAMP | Nullable | Completion time |

### Allowed statuses

```text
pending
processing
completed
failed
```

### Relationship

```text
events 1 ──── N import_jobs
```

---

# 15. Relationship Summary

| Parent | Child | Relationship |
|---|---|---|
| `users` | `events` | One user can create many events |
| `events` | `teams` | One event has many teams |
| `users` | `team_members` | Users can belong to teams |
| `teams` | `team_members` | Teams have multiple members |
| `teams` | `projects` | One team has at most one project |
| `projects` | `submissions` | One project has many submission versions |
| `users` | `judges` | A user can have one judge profile |
| `events` | `judge_invitations` | One event has many invitations |
| `judges` | `judge_invitations` | One judge can receive many event invitations |
| `judges` | `judge_assignments` | One judge can have many assignments |
| `projects` | `judge_assignments` | One project can have many judge assignments |
| `events` | `rubrics` | One event can have multiple rubrics |
| `rubrics` | `rubric_criteria` | One rubric has many criteria |
| `judges` | `judgments` | One judge can create many judgments |
| `projects` | `judgments` | One project can have multiple judgments |
| `rubrics` | `judgments` | Judgments use rubrics |
| `judgments` | `scores` | One judgment contains multiple scores |
| `rubric_criteria` | `scores` | Criteria receive scores |
| `projects` | `project_votes` | Projects can receive many votes |
| `users` | `project_votes` | Users can cast votes |
| `projects` | `project_comments` | Projects can receive comments |
| `users` | `project_comments` | Users can create comments |
| `users` | `audit_logs` | User actions can be audited |
| `events` | `webhook_endpoints` | Events can configure webhooks |
| `webhook_endpoints` | `webhook_deliveries` | Endpoints have delivery records |
| `judges` | `judge_records` | Judges can receive participation records |
| `events` | `judge_records` | Records belong to events |
| `events` | `certificates` | Events can issue certificates |
| `users` | `certificates` | Users can receive certificates |
| `events` | `import_jobs` | Events can have import jobs |

---

# 16. Referential Integrity

RaptorOS uses PostgreSQL foreign keys to maintain relationships between entities.

Several relationships use:

```text
ON DELETE CASCADE
```

This is used where child records should automatically be removed when their parent is deleted.

Examples include:

```text
events → teams
teams → team_members
teams → projects
projects → submissions
judges → judge_assignments
projects → judge_assignments
rubrics → rubric_criteria
judgments → scores
projects → votes
projects → comments
events → webhook_endpoints
webhook_endpoints → webhook_deliveries
events → certificates
events → import_jobs
```

The schema intentionally does not apply cascading deletion to every foreign key. For example, audit log user references remain available when a user is removed.

---

# 17. Unique Constraints

The schema uses database-level uniqueness to prevent duplicate records in important workflows.

| Table | Unique Constraint | Purpose |
|---|---|---|
| `users` | `email` | Prevent duplicate accounts |
| `teams` | `invite_code` | Prevent duplicate invite codes |
| `team_members` | `(team_id, user_id)` | Prevent duplicate membership |
| `projects` | `team_id` | One project per team |
| `submissions` | `(project_id, version)` | Prevent duplicate versions |
| `judges` | `user_id` | One judge profile per user |
| `judge_invitations` | `(event_id, judge_id)` | One invitation per event/judge |
| `judge_assignments` | `(judge_id, project_id)` | Prevent duplicate assignment |
| `judgments` | `(judge_id, project_id, rubric_id)` | Prevent duplicate judgment |
| `scores` | `(judgment_id, criterion_id)` | Prevent duplicate criterion score |
| `project_votes` | `(project_id, user_id)` | One vote per user/project |
| `judge_records` | `(judge_id, event_id)` | One judge record per event |
| `certificates` | `(event_id, user_id, certificate_type)` | Prevent duplicate certificate type |

---

# 18. Database Indexes

Additional indexes are created for frequently accessed relationships and operational queries.

### Projects

```text
idx_projects_team
```

Indexes `projects.team_id`.

### Submissions

```text
idx_submissions_project
idx_submissions_status
```

Used for project submission history and status filtering.

### Judge assignments

```text
idx_assignments_judge
idx_assignments_project
```

Support queries by judge and project.

### Judge invitations

```text
idx_judge_invitations_event
idx_judge_invitations_judge
```

Support invitation lookup by event and judge.

### Voting

```text
idx_project_votes_project
idx_project_votes_user
```

Support project and user vote queries.

### Comments

```text
idx_project_comments_project
idx_project_comments_created
```

Support project comment retrieval and chronological queries.

### Audit

```text
idx_audit_logs_created
idx_audit_logs_entity
```

Support chronological audit queries and entity-specific timelines.

### Webhooks

```text
idx_webhook_endpoints_event
idx_webhook_deliveries_webhook
```

Support event webhook lookup and delivery history.

### Certificates

```text
idx_certificates_event
idx_certificates_user
```

Support certificate lookup by event and recipient.

### Import jobs

```text
idx_import_jobs_event
```

Supports event-specific import job lookup.

---

# 19. Data Flow Through the Model

## Participant workflow

```text
users
  ↓
team_members
  ↓
teams
  ↓
projects
  ↓
submissions
```

## Judge workflow

```text
users
  ↓
judges
  ↓
judge_invitations
  ↓
judge_assignments
  ↓
judgments
  ↓
scores
```

## Rubric workflow

```text
events
  ↓
rubrics
  ↓
rubric_criteria
  ↓
scores
```

## Community workflow

```text
users ──────► project_votes ──────► projects

users ──────► project_comments ───► projects
```

## Integrity workflow

```text
users
  ↓
audit_logs
  ↓
Decision Ledger
```

## Operational extensions

```text
events
 ├── webhook_endpoints
 │      └── webhook_deliveries
 │
 ├── judge_records
 │
 ├── certificates
 │
 └── import_jobs
```

---

# 20. Submission and Import/Export Paths

### Project submission path

```text
User
 ↓
Team
 ↓
Project
 ↓
Submission Version
 ↓
Submitted Project
 ↓
Judging
```

Each submission version is stored in the `submissions` table and associated with a project through `project_id`.

### Judging result export

Judging results are calculated from:

```text
judgments
    ↓
scores
    ↓
weighted project scores
    ↓
judge-level normalization
    ↓
normalized project results
    ↓
CSV export
```

The database stores the underlying judgment and score records. Normalized result calculations are derived from those records by the judging service.

### Bulk import

Bulk imports are tracked using:

```text
events
   ↓
import_jobs
```

The import job records progress, total rows, processed rows, errors, and completion state.

---

# 21. Data Integrity Model

RaptorOS uses several layers of data integrity:

### Database constraints

PostgreSQL enforces:

- Primary keys
- Foreign keys
- Unique constraints
- NOT NULL constraints
- CHECK constraints

### Application-level validation

The backend validates business rules such as:

- Event deadlines
- Team membership
- Judge invitation status
- Judge/project conflicts
- Valid project ownership
- Valid judging workflow

### Auditability

Important actions are recorded in `audit_logs`.

This combination allows database constraints to protect structural integrity while backend services enforce higher-level event rules.

---

# 22. Design Principles

The data model follows these principles:

### Relational integrity

Core entities are normalized into related PostgreSQL tables rather than storing the entire event lifecycle in a single document.

### Versioned submissions

Projects and submissions are separated so that project identity remains stable while submission versions can be tracked.

### Explicit judging relationships

Judges, invitations, assignments, judgments, criteria, and scores are separate entities so the judging lifecycle remains traceable.

### Database-enforced uniqueness

Important anti-duplication rules are implemented as database constraints rather than relying only on frontend validation.

### Auditability

Operational decisions can be linked to users, entities, timestamps, and metadata.

### Extensibility

Supporting capabilities such as webhooks, certificates, judge records, and imports use separate tables so they do not complicate the core event model.

---

# 23. Summary

The RaptorOS PostgreSQL schema models the hackathon as a connected lifecycle:

```text
USER
 │
 ├──────────────► EVENT
 │                  │
 │                  ├──► TEAMS
 │                  │      │
 │                  │      └──► PROJECT
 │                  │             └──► SUBMISSIONS
 │                  │
 │                  ├──► RUBRIC
 │                  │      └──► CRITERIA
 │                  │
 │                  └──► JUDGE INVITATIONS
 │
 └──► JUDGE
        │
        ├──► ASSIGNMENTS
        │       └──► PROJECT
        │
        └──► JUDGMENTS
               └──► SCORES
```

Community participation, auditability, and operational extensions are represented through dedicated relational tables.

The schema uses UUID identifiers, foreign-key relationships, cascading deletes where appropriate, database-level uniqueness, CHECK constraints, and targeted indexes to support the RaptorOS event and judging workflows.