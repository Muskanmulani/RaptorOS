# RaptorOS Architecture

## 1. Overview

RaptorOS is a self-hostable hackathon event operating system designed to manage the complete lifecycle of a hackathon.

The platform covers event management, team formation, project submissions, judge assignment, rubric-based evaluation, score normalization, AI-assisted evidence retrieval, community voting, audit logging, and result analysis.

The system is designed around three primary user roles:

- Participant
- Judge
- Organizer/Admin

The architecture separates the user interface, API layer, application services, and persistent data layer so that the platform can be operated locally or self-hosted.

---

## 2. High-Level Architecture

```text
┌─────────────────────────────────────────────┐
│                React Frontend               │
│              Vite + Tailwind CSS            │
│                                             │
│  Landing │ Dashboard │ Gallery │ Judging    │
│  Control │ Ledger    │ Simulator │ Fairness │
└──────────────────────┬──────────────────────┘
                       │ HTTP / REST
                       ▼
┌─────────────────────────────────────────────┐
│              Express REST API               │
│                                             │
│ Authentication │ RBAC │ Validation │ Routes │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│               Controllers                   │
│                                             │
│ Auth │ Events │ Teams │ Projects │ Judging  │
│ Voting │ Audit │ Conflicts │ JEV │ Health   │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│             Application Services            │
│                                             │
│ Normalization │ RAG │ JEV │ Duplicate       │
│ Detection │ Simulator │ CSV │ Webhooks      │
│ Certificates │ Judge Records │ Imports      │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│                PostgreSQL                   │
│                                             │
│ Users │ Events │ Teams │ Projects │ Judges  │
│ Rubrics │ Scores │ Votes │ Audit Logs       │
│ Certificates │ Webhooks │ Imports           │
└─────────────────────────────────────────────┘
```

---

## 3. Frontend Architecture

The frontend is implemented using React and Vite.

### Main technologies

- React
- Vite
- React Router
- Tailwind CSS
- Axios
- Lucide React
- Recharts where visualization is required

The frontend is organized into:

```text
client/src/
├── components/
├── pages/
├── layouts/
├── services/
├── context/
├── hooks/
└── utils/
```

### Pages

Major application areas include:

- Landing
- Login
- Command Dashboard
- Project Explorer
- Judging Desk
- Project Review
- Score Anatomy / Explain Score
- Control Room
- Fairness Lab
- Decision Ledger
- Judging Simulator

### Routing

React Router provides client-side navigation between the public landing/login experience and authenticated application pages.

The main authenticated application is rendered through `MainLayout`, which provides the RaptorOS navigation and shared application shell.

---

## 4. API Layer

The backend is implemented using Node.js and Express.

The frontend communicates with the backend through REST APIs.

The API is organized by domain:

```text
/api/auth
/api/admin
/api/events
/api/teams
/api/projects
/api/judging
/api/audit
/api/voting
/api/conflicts
/api/invitations
/api/health
/api/jev
/api/webhooks
/api/judge-records
/api/certificates
/api/import
/api/gallery-widget
```

Each route group is responsible for a specific part of the event lifecycle.

For example:

```text
/api/events
```

handles event management.

```text
/api/projects
```

handles projects and submissions.

```text
/api/judging
```

handles judges, rubrics, assignments, judgments, normalization, explanations, exports, and simulation.

---

## 5. Backend Structure

The server follows a controller, middleware, route, and service-based structure.

```text
server/src/
├── config/
├── controllers/
├── middleware/
├── routes/
├── services/
└── utils/
```

### Controllers

Controllers handle HTTP requests and responses.

Major controller domains include:

- Authentication
- Events
- Teams
- Projects
- Judging
- Voting
- Invitations
- Conflicts
- Event Health
- JEV
- Audit
- Webhooks
- Judge Records
- Certificates
- Imports
- Gallery Widget

Controllers validate incoming data, perform authorization checks, call application services or database queries, and return API responses.

### Middleware

Middleware provides cross-cutting functionality such as:

- JWT authentication
- Role-based authorization
- Rate limiting
- Request processing

---

## 6. Authentication and Authorization

RaptorOS uses JWT-based authentication.

Passwords are securely hashed using `bcryptjs`.

The authentication flow is:

```text
User
  ↓
Login
  ↓
POST /api/auth/login
  ↓
Validate credentials
  ↓
bcrypt password verification
  ↓
JWT generated
  ↓
Token returned to frontend
  ↓
Frontend stores authenticated session
  ↓
JWT sent with protected API requests
```

The JWT contains the authenticated user's identity and role.

### Role-Based Access Control

The backend enforces role permissions using authorization middleware.

Primary roles are:

```text
participant
judge
organizer
admin
```

Examples:

- Participants can create and manage their projects.
- Judges can access their assigned judging workflow.
- Organizers and admins can manage judging, assignments, rubrics, event configuration, audit information, and results.
- Administrative operations are protected from participant access.

Authorization is enforced at the API level rather than relying only on frontend navigation.

---

## 7. Event Management Flow

Events are the top-level container for hackathon activity.

The event workflow is:

```text
Create Event
    ↓
Configure Dates / Status
    ↓
Participants Join
    ↓
Teams Form
    ↓
Projects Created
    ↓
Submissions Open
    ↓
Projects Submitted
    ↓
Judging
    ↓
Normalization / Results
    ↓
Event Completion
```

Events contain configuration such as:

- Event name
- Start date
- End date
- Submission deadline
- Voting configuration
- Voting start/end dates
- Event status

---

## 8. Team Formation

Participants can create teams and join existing teams through invitation/join mechanisms.

The team workflow is:

```text
Participant
    ↓
Create Team
    ↓
Generate Invite Code
    ↓
Other Participant Joins
    ↓
Team Members
    ↓
Team Creates Project
```

Team membership is stored separately from team records, allowing multiple users to belong to a team.

The backend verifies team membership before allowing participant-level project operations.

---

## 9. Project and Submission Architecture

A team can create a project associated with its event.

Projects contain information such as:

- Title
- Tagline
- Description
- Repository URL
- Demo URL
- Team relationship

Submissions are versioned separately from the project.

```text
Team
  ↓
Project
  ↓
Submission v1
  ↓
Submission v2
  ↓
Submission v3
```

This separation allows the project identity to remain stable while submission versions can change during the submission period.

The backend enforces submission deadline rules.

Projects are also checked for duplicate fingerprints within an event.

---

## 10. Judge Invitation and Assignment

Judges are represented separately from normal user accounts.

The judging workflow is:

```text
Organizer
    ↓
Invite Judge
    ↓
Judge Accepts Invitation
    ↓
Judge Added to Eligible Pool
    ↓
Organizer Assigns Projects
    ↓
Judge Reviews Assigned Projects
```

Assignments are stored separately so that the system can track:

- Which judge is assigned
- Which project is assigned
- Event relationship
- Assignment state
- Completed judgments

The assignment logic also checks for conflicts between judges and teams.

A judge should not be assigned to a project belonging to their own team.

---

## 11. Rubrics and Scoring

Organizers can configure rubrics for an event.

A rubric contains multiple criteria.

```text
Rubric
 ├── Criterion 1
 ├── Criterion 2
 ├── Criterion 3
 └── Criterion 4
```

Each criterion can have:

- Name
- Description
- Weight
- Maximum score

Judges provide raw scores for individual criteria.

The system then calculates weighted scores.

Conceptually:

```text
Weighted Criterion Score
=
(Raw Score / Maximum Score) × Criterion Weight
```

The project's judging score is calculated from the weighted criterion scores.

This keeps the scoring process transparent and allows organizers to use different evaluation criteria for different events.

---

## 12. Score Normalization

RaptorOS includes judge-level score normalization to reduce differences in scoring behavior between judges.

The current implementation first aggregates all weighted criterion scores into a project-level score for each judge.

For every judge:

```text
Judge Project Scores
        ↓
Calculate Mean
        ↓
Calculate Standard Deviation
        ↓
Normalize Each Project Score
```

The normalization formula is:

```text
Normalized Score =
50 + ((Project Score - Judge Mean) / Judge Standard Deviation) × 10
```

The resulting value is bounded between 0 and 100.

If a judge's standard deviation is zero, the normalized score defaults to 50 because a Z-score cannot be calculated when all scores are identical.

Normalization is performed on project-level totals rather than individual criterion rows so that the statistical comparison represents the actual total score assigned by each judge to each project.

The normalization service also exposes judge statistics and project-level normalized results.

---

## 13. Explain Score

RaptorOS provides an Explain Score capability for project evaluations.

Instead of exposing only a final score, the system retrieves the underlying judging information and presents:

- Judge
- Rubric
- Criterion
- Criterion weight
- Maximum score
- Raw score
- Weighted score
- Total score
- Submission time

This allows organizers and judges to understand how a project's score was constructed.

---

## 14. Raptor Intelligence / JEV

RaptorOS includes an AI-assisted evidence and analysis layer referred to as Raptor Intelligence / JEV.

The system retrieves project information and indexes relevant submission evidence.

The current evidence pipeline is:

```text
Project
  ↓
Project Description + Submitted Content
  ↓
Evidence Indexing
  ↓
Local Retrieval
  ↓
Relevant Evidence
  ↓
JEV Analysis
  ↓
Human Judge Decision
```

The retrieval layer supports project evidence search.

JEV can provide:

- Project-level analysis
- Criterion-level analysis
- Evidence retrieval
- Existing score context

The system explicitly keeps the final decision with the human judge.

AI analysis is therefore an assistance layer rather than an automatic judge.

---

## 15. Duplicate Detection

RaptorOS includes project duplicate detection.

A normalized fingerprint is generated from:

- Project title
- Project description
- Repository URL

The normalized values are hashed using SHA-256.

The system compares the fingerprint against other projects within the same event.

This provides a deterministic first-level duplicate detection mechanism.

---

## 16. Community Voting

RaptorOS supports configurable community voting.

The voting system provides:

- Vote creation
- Vote removal
- Vote status
- Comments
- Voting configuration
- Voting start/end dates
- Result visibility configuration
- Rate limiting
- Audit logging

A database constraint prevents duplicate votes for the same user/project combination.

Voting operations are also protected by server-side rate limiting.

---

## 17. Audit Logs / Decision Ledger

Important platform actions are recorded in the `audit_logs` table.

Examples include:

- Project creation
- Team actions
- Judge assignment
- Judgment activity
- Voting activity
- Administrative actions

The Decision Ledger exposes these events in a chronological interface.

Organizers can inspect:

- Actor
- Action
- Entity
- Entity ID
- Metadata
- Timestamp

This creates a traceable record of important event decisions.

---

## 18. Hackathon Health

RaptorOS provides an event health endpoint that aggregates operational information.

The health layer tracks information such as:

- Teams
- Projects
- Submitted projects
- Judge assignments
- Completed judgments
- Active judges
- Assignment coverage
- Judging completion
- Conflicts
- Community votes

This information powers the Command Dashboard and Control Room.

The goal is to give organizers an operational view of the event rather than requiring them to inspect individual records.

---

## 19. Judging Simulator

The Judging Simulator provides a way to model judge assignment and workload distribution.

It considers:

- Available judges
- Submitted projects
- Number of judges per project
- Rubric criteria
- Judge workload

The simulator produces:

- Project assignments
- Judge workload
- Simulated criterion scores
- Project average scores

The simulator is intended as an operational planning and testing tool rather than a replacement for actual judging.

---

## 20. CSV Export

RaptorOS provides CSV export for normalized judging results.

This allows organizers to take judging results outside the application for further analysis, reporting, or archival.

---

## 21. Auditability and Integrity Features

Several features are designed to improve judging integrity:

- Backend-enforced role isolation
- Judge invitations
- Assignment validation
- Judge/team conflict detection
- Duplicate project detection
- Rate-limited voting
- Audit logs
- Score explanations
- Judge score normalization
- Human-controlled final decisions

These mechanisms work together rather than relying on a single integrity feature.

---

## 22. Additional Platform Services

RaptorOS also contains supporting services for:

- Webhook configuration and delivery tracking
- Judge participation records
- Certificates
- Bulk participant import
- Embeddable gallery widget
- CSV result generation
- Judging simulation
- Project evidence retrieval

These services are implemented as separate backend modules to keep domain logic isolated from HTTP controllers.

---

## 23. Docker Architecture

RaptorOS includes Docker Compose configuration for the backend and PostgreSQL environment.

The Docker architecture is:

```text
┌──────────────────────┐
│   RaptorOS Backend   │
│   Node.js + Express  │
│      Port 5000       │
└──────────┬───────────┘
           │
           │ PostgreSQL connection
           ▼
┌──────────────────────┐
│     PostgreSQL 16    │
│      raptoros DB     │
└──────────────────────┘
```

Database initialization is performed using:

```text
database/schema.sql
database/seed.sql
```

The PostgreSQL container includes a health check.

The database uses a persistent Docker volume so that data remains available across normal container restarts.

The Docker environment has been verified with:

- PostgreSQL startup
- PostgreSQL health check
- Schema initialization
- Seed data
- Backend startup
- `/api/health`
- `/api/events`
- Database persistence after restart

The Docker environment is intended to make RaptorOS easier to run in a self-hosted environment.

---

## 24. Data Flow

A typical judging request follows this architecture:

```text
Judge Browser
     ↓
React Project Review
     ↓
Axios REST Request
     ↓
Express Route
     ↓
JWT Authentication
     ↓
Role Authorization
     ↓
Judging Controller
     ↓
Judging / Normalization Service
     ↓
PostgreSQL
     ↓
API Response
     ↓
React UI
```

For AI-assisted project analysis:

```text
Judge Browser
     ↓
JEV API
     ↓
Project Context
     ↓
Evidence Index / Retrieval
     ↓
JEV Analysis Service
     ↓
Analysis Response
     ↓
Human Judge
```

---

## 25. Design Principles

RaptorOS follows several architectural principles:

### Backend-enforced security

Important permissions are enforced by the API rather than trusting the frontend.

### Domain separation

Event management, judging, voting, audit, evidence retrieval, and supporting capabilities are separated into distinct controllers and services.

### Explainability

Judging results can be traced back to individual criteria and judges.

### Human-in-the-loop AI

AI-assisted analysis provides evidence and recommendations but does not replace the human judge.

### Self-hostability

The core system is designed to run with local infrastructure and PostgreSQL rather than requiring a proprietary cloud platform.

### Auditability

Important event actions are recorded so organizers can understand how decisions were made.

### Operational visibility

Dashboards and health endpoints expose event progress and potential integrity issues.

---

## 26. Repository Structure

```text
RaptorOS/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── services/
│   │   ├── context/
│   │   ├── hooks/
│   │   └── utils/
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── Dockerfile
│   └── package.json
│
├── database/
│   ├── schema.sql
│   └── seed.sql
│
├── docs/
├── tests/
├── docker-compose.yml
├── README.md
└── ARCHITECTURE.md
```

---

## 27. Summary

RaptorOS is structured as a layered event management and judging platform:

```text
React UI
   ↓
REST API
   ↓
Authentication + Authorization
   ↓
Controllers
   ↓
Domain Services
   ↓
PostgreSQL
```

The architecture combines hackathon management, judging integrity, score normalization, evidence-assisted evaluation, auditability, and operational monitoring into one self-hostable platform.

The design intentionally prioritizes a correct and traceable judging workflow while keeping AI assistance under human control.