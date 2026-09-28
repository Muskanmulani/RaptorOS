# RaptorOS

## Run. Judge. Ship.

RaptorOS is an open-source, self-hostable hackathon operating system designed to manage the complete lifecycle of a hackathon — from event setup and team formation to project submissions, judge assignment, scoring, normalization, public discovery, auditing, and results.

Instead of treating a hackathon platform as a collection of forms and dashboards, RaptorOS provides an event control system focused on operational visibility and judging integrity.

## What RaptorOS Solves

Running a hackathon involves several interconnected systems:

- Participant registration
- Team formation
- Project submission
- Submission deadlines
- Judge invitations
- Judge assignment
- Rubric-based scoring
- Judge workload balancing
- Conflict detection
- Score normalization
- Public voting
- Comments
- Audit trails
- Results
- Certificates and participation records

RaptorOS brings these workflows into a single self-hostable platform.

## Core Capabilities

### Event Operations

- Event creation and configuration
- Event dates and submission deadlines
- Event status management
- Team formation through invite codes
- Project creation and submission versions
- Deadline enforcement
- Event health monitoring

### Judging System

- Judge accounts and invitations
- Accepted-invitation enforcement
- Judge-to-project assignments
- Assignment workload balancing
- Conflict detection
- Configurable rubrics
- Weighted scoring
- Judge progress tracking
- Score normalization
- CSV result export
- Judging simulation

### Judging Integrity

- Judge/team conflict detection
- Duplicate project detection
- Audit trail for important actions
- Raw score transparency
- Normalized score transparency
- Explain Score breakdown
- Decision Ledger
- Fairness monitoring

### JEV / Raptor Intelligence

RaptorOS includes a local evidence retrieval and judging-assistance layer.

It can:

- Index project descriptions and submitted evidence
- Retrieve relevant project evidence
- Analyze projects against rubric criteria
- Provide criterion-level analysis
- Surface evidence for human judges

The system does not automatically make the final judging decision.

Human judges remain responsible for submitted scores.

### Public Participation

- Public project gallery
- Randomized project ordering
- Community voting
- Configurable voting windows
- Hidden results during voting
- Project comments
- Vote rate limiting
- Duplicate project protection

### Platform Extensions

RaptorOS also includes supporting platform capabilities:

- Webhook configuration and delivery tracking
- Signed judge participation records
- Certificate generation and verification
- Participant CSV import
- Embeddable gallery widget
- REST API endpoints for platform workflows

## Architecture

```text
React Client
     ↓
Express API
     ↓
Application Services
     ↓
PostgreSQL
```

The application is divided into frontend, backend, service, and database layers.

For more information, see:

- `ARCHITECTURE.md`
- `DATA-MODEL.md`
- `JUDGING.md`

## Technology Stack

### Frontend

- React
- Vite
- React Router
- Tailwind CSS
- Lucide React
- Recharts
- Axios

### Backend

- Node.js
- Express
- PostgreSQL
- pg
- JWT
- bcryptjs
- CORS

### Infrastructure

- Docker
- Docker Compose
- PostgreSQL 16

### AI / Evidence Layer

- Local deterministic embeddings
- Local retrieval
- RAG-style project evidence retrieval
- JEV judging-assistance service

The application does not require a cloud AI provider or external API to run the core judging workflow.

## Roles

RaptorOS supports role-based access control.

### Participant

Participants can:

- Register
- Create or join teams
- Create projects
- Manage project submissions
- Submit projects before the deadline

### Judge

Judges can:

- Access accepted judging assignments
- Review assigned projects
- Score rubric criteria
- Monitor judging progress
- Review evidence
- Use judging assistance
- View score explanations

### Organizer

Organizers can:

- Create and configure events
- Manage judges
- Create rubrics
- Assign judges
- Monitor event health
- Review conflicts
- Inspect audit logs
- Configure voting
- Export results

### Admin

Administrators have platform-level management capabilities and organizer-level judging operations.

## Running RaptorOS

### Prerequisites

- Node.js
- npm
- Docker Desktop
- Git

### Docker

From the repository root:

```bash
docker compose up --build
```

The Docker environment starts the application backend and PostgreSQL database.

The PostgreSQL database is initialized automatically using:

```text
database/schema.sql
database/seed.sql
```

The database uses a persistent Docker volume so data survives container restarts.

## Frontend Development

From the `client` directory:

```bash
npm install
npm run dev
```

The frontend communicates with the backend API at:

```text
http://localhost:5000/api
```

The API URL can be overridden using:

```text
VITE_API_URL
```

## Backend Development

From the `server` directory:

```bash
npm install
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

API health endpoint:

```text
GET /api/health
```

## Main API Areas

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

## Judging Workflow

```text
Event
  ↓
Rubric
  ↓
Judge Invitation
  ↓
Invitation Accepted
  ↓
Judge Assignment
  ↓
Project Review
  ↓
Criterion Scores
  ↓
Weighted Total
  ↓
Judge-Level Normalization
  ↓
Final Results
```

RaptorOS prevents judges from being assigned to projects belonging to their own team.

See `JUDGING.md` for the complete scoring and normalization methodology.

## Score Normalization

RaptorOS uses judge-level Z-score normalization.

For each judge, project-level weighted totals are calculated first.

The judge's mean and standard deviation are then calculated across the projects evaluated by that judge.

The normalized score is calculated as:

```text
Normalized Score =
50 + ((Project Score - Judge Mean) / Judge Standard Deviation) × 10
```

Normalized scores are bounded between 0 and 100.

When a judge has zero score variance, the normalized score defaults to 50 because a Z-score cannot be calculated when the standard deviation is zero.

## Explain Score

RaptorOS provides an Explain Score workflow that exposes:

- Judge
- Rubric
- Criterion
- Criterion weight
- Maximum score
- Raw score
- Weighted score
- Judge total

This allows organizers and judges to inspect how a project's score was constructed.

## Raptor Intelligence

The JEV layer provides evidence retrieval and judging assistance.

```text
Project Submission
       ↓
Evidence Indexing
       ↓
Local Retrieval
       ↓
Relevant Evidence
       ↓
Criterion Analysis
       ↓
Human Judge Decision
```

JEV is advisory and does not submit or override a judge's final score.

## Duplicate Detection

RaptorOS performs duplicate project detection using a normalized SHA-256 fingerprint derived from:

- Project title
- Project description
- Repository URL

Duplicate projects within the same event can be rejected during project creation.

## Audit Trail

Important platform actions are recorded in the audit log.

The Decision Ledger provides:

- Actor
- Action
- Entity
- Entity ID
- Timestamp
- Metadata

This creates an inspectable event history for operational and judging actions.

## Community Voting

Community voting can be configured for an event.

The system supports:

- Voting windows
- One vote per user/project
- Hidden results during voting
- Vote rate limiting
- Vote removal
- Project comments
- Audit logging

## Judging Simulator

The Judging Simulator allows organizers to test judging configuration without modifying live judgments.

It simulates:

- Judge assignment
- Judges per project
- Workload balancing
- Random rubric scores
- Project averages
- Judge workloads

Simulation results are not persisted as live judgments.

## Certificates and Judge Records

RaptorOS includes:

- Certificate generation
- Unique certificate codes
- Certificate lookup
- Signed judge participation records
- Record verification

Judge participation records use server-side cryptographic signing and verification.

## Webhooks

RaptorOS provides webhook configuration and delivery tracking endpoints.

The current implementation records webhook delivery events and provides webhook management APIs.

## Bulk Import

Participant CSV import is available through the API.

Imported participants can be created from CSV data and tracked through import jobs.

## Gallery Widget

RaptorOS provides an embeddable gallery widget endpoint that generates a self-contained project gallery.

## Project Structure

```text
RaptorOS/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── services/
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
└── README.md
```

## Security Model

RaptorOS implements:

- JWT authentication
- Password hashing with bcrypt
- Role-based authorization
- Backend-enforced role isolation
- Submission deadline enforcement
- Judge/team conflict checks
- Database uniqueness constraints
- Vote rate limiting
- Input validation
- Audit logging

Authorization is enforced on the backend rather than relying only on frontend visibility.

## Self-Hosting

RaptorOS is designed to be self-hosted.

```text
Docker Compose
      │
      ├── RaptorOS API
      │
      └── PostgreSQL
```

No cloud database, cloud authentication provider, or proprietary hosted service is required for the core application.

## Testing

The project includes backend module checks and application-level verification.

The final acceptance report documents verification against the hackathon requirements.

## Open Source

RaptorOS is released as open-source software under the license included in this repository.

## Hackathon

RaptorOS was built for the Dogfood 72-Hour Hackathon by Hackathon Raptors.

The project is designed around the challenge requirement of building a self-hostable platform capable of managing and judging hackathon submissions.

## Project Philosophy

### Run

Give organizers operational visibility into the event.

### Judge

Make judging structured, transparent, and auditable.

### Ship

Keep the platform self-hostable, reproducible, and usable beyond the hackathon.

## Status

RaptorOS is currently in final integration and verification.

The final acceptance report records which capabilities have been verified against the hackathon requirements.