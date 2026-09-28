# RaptorOS Judging System

## 1. Overview

RaptorOS provides a complete backend-enforced judging workflow for hackathon events.

The judging system covers:

- Judge invitations
- Invitation acceptance
- Judge assignment
- Assignment conflict prevention
- Rubric configuration
- Criterion-level scoring
- Weighted project scores
- Judge progress tracking
- Score explanation
- Cross-judge normalization
- CSV result export
- Judging simulation
- Audit logging
- Human-controlled final decisions

The system is designed so that judging decisions are traceable from the final project result back to individual judges, criteria, and raw scores.

---

# 2. Judging Lifecycle

The complete judging lifecycle is:

```text id="x0f2vl"
Organizer
    ↓
Create / Configure Event
    ↓
Configure Rubric
    ↓
Invite Judges
    ↓
Judge Accepts Invitation
    ↓
Assign Projects
    ↓
Judge Reviews Project
    ↓
Score Each Criterion
    ↓
Submit Judgment
    ↓
Calculate Weighted Score
    ↓
Track Judge Progress
    ↓
Cross-Judge Normalization
    ↓
Explain / Export Results
```

The final decision remains with the event organizers and human judges.

---

# 3. Judge Eligibility

Judges are represented using two related records:

```text id="w3c3gq"
users
  ↓
judges
```

A user must have a judge profile before participating in the judge workflow.

The `judges.user_id` field is unique, ensuring that a user can have at most one judge profile.

Judge invitations are event-specific.

```text id="v5l0s4"
Event
  ↓
Judge Invitation
  ↓
Pending
  ↓
Accepted / Declined
```

An invitation has one of three states:

```text id="zml4k8"
pending
accepted
declined
```

Only an accepted invitation makes the judge eligible for event assignment.

---

# 4. Judge Assignment

## 4.1 Assignment Model

Assignments connect judges to projects:

```text id="t5d4xq"
Judge
  ↓
Judge Assignment
  ↓
Project
```

The database enforces:

```text id="fjxv73"
UNIQUE (judge_id, project_id)
```

This prevents the same judge from being assigned to the same project more than once.

---

## 4.2 Assignment Validation

Before an assignment is created, the backend validates:

1. The judge exists.
2. The project exists.
3. The event/project relationship is valid.
4. The judge has an accepted invitation for the event.
5. The judge is not associated with the project's team.
6. The judge/project assignment does not already exist.

This means assignment integrity is enforced by the backend rather than relying on the frontend.

---

# 5. Conflict Prevention

RaptorOS checks for judge/team conflicts before creating assignments.

A judge should not evaluate a project belonging to their own team.

Conceptually:

```text id="0d7a6v"
Judge
  ↓
Judge User
  ↓
Team Membership
  ↓
Project Team
```

If the judge is a member of the project's team, the assignment is rejected.

This prevents a direct self-evaluation conflict.

The assignment operation is also recorded in the audit trail.

---

# 6. Rubric Configuration

Organizers can create event-specific rubrics.

The database model is:

```text id="g3n8pm"
Event
  ↓
Rubric
  ↓
Rubric Criteria
```

Each criterion contains:

- Name
- Description
- Weight
- Maximum score

Example:

```text id="6ekqzx"
Innovation       → Weight
Technical Quality → Weight
Impact            → Weight
Execution         → Weight
```

The rubric is configurable rather than hard-coded into the judging interface.

---

# 7. Criterion Scoring

Each judge evaluates a project using the event rubric.

For each criterion, the judge provides a raw score.

The score record contains:

```text id="4gr7es"
Judgment
   ↓
Criterion
   ↓
Raw Score
   ↓
Weighted Score
```

The database prevents duplicate scoring of the same criterion within the same judgment:

```text id="4x8p7f"
UNIQUE (judgment_id, criterion_id)
```

Raw scores cannot be negative because the database enforces:

```text id="uk0plq"
raw_score >= 0
```

Criteria also require positive weights and positive maximum scores.

---

# 8. Weighted Scoring

The judging system converts raw criterion scores into weighted scores.

The conceptual calculation is:

```text id="k0u5o9"
Weighted Criterion Score
=
(Raw Score / Maximum Score) × Criterion Weight
```

For a project:

```text id="j4m7qz"
Project Score
=
Sum of all weighted criterion scores
```

This creates a project-level score for each judge.

The important architectural decision is that normalization operates on these **project-level totals**, not on individual criterion rows.

---

# 9. Judgment Records

A judgment connects:

```text id="9g5rj7"
Judge
  +
Project
  +
Rubric
  ↓
Judgment
```

The database enforces:

```text id="3v4k8r"
UNIQUE (judge_id, project_id, rubric_id)
```

This prevents duplicate judgments for the same judge, project, and rubric combination.

A judgment contains multiple criterion-level score records.

```text id="px9n2k"
Judgment
 ├── Score → Criterion 1
 ├── Score → Criterion 2
 ├── Score → Criterion 3
 └── Score → Criterion 4
```

---

# 10. Judge Progress

RaptorOS provides judge progress information based on assignments and submitted judgments.

The judging desk exposes information such as:

- Total assigned projects
- Completed judgments
- Pending judgments
- Completion progress

Conceptually:

```text id="8h1w7b"
Assigned Projects
        ↓
Completed Judgments
        ↓
Pending Reviews
        ↓
Judge Completion %
```

The system derives progress from actual assignment and judgment data rather than displaying static progress values.

---

# 11. Explain Score

RaptorOS includes an Explain Score workflow.

The purpose is to make a project score inspectable rather than treating it as an unexplained number.

The explanation retrieves:

- Judge
- Rubric
- Criterion
- Raw score
- Criterion weight
- Weighted score
- Project-level total
- Judgment information

The score can therefore be traced as:

```text id="m0q44v"
Final Project Score
       ↑
Weighted Criterion Scores
       ↑
Raw Criterion Scores
       ↑
Judge + Rubric + Criterion
```

This supports review and debugging of judging decisions.

---

# 12. Cross-Judge Normalization

Different judges may use different parts of the available scoring range.

For example, one judge may consistently give relatively high scores while another may consistently give lower scores.

RaptorOS therefore provides cross-judge normalization.

The implementation first calculates a project-level total for every judgment.

For each judge, the system then calculates statistics across that judge's project-level totals.

```text id="upz7co"
Judge Project Scores
        ↓
Project-Level Totals
        ↓
Judge Mean
        ↓
Judge Standard Deviation
        ↓
Normalized Scores
```

---

# 13. Normalization Formula

The implemented normalization formula is:

```text id="qylf20"
Normalized Score =
50 + ((Project Score - Judge Mean) / Judge Standard Deviation) × 10
```

Where:

- `Project Score` = weighted total given by the judge for the project
- `Judge Mean` = mean of that judge's project-level totals
- `Judge Standard Deviation` = standard deviation of that judge's project-level totals

The normalized score is then bounded to:

```text id="w0xj5n"
0 ≤ Normalized Score ≤ 100
```

This creates a common scale for comparing scores from judges with different scoring distributions.

---

# 14. Zero Standard Deviation

If a judge gives the same project-level score to every project, the standard deviation is zero.

In that situation, the normalization formula would require division by zero.

RaptorOS handles this explicitly.

```text id="w3xq3y"
If Standard Deviation = 0
        ↓
Normalized Score = 50
```

This prevents invalid statistical output.

---

# 15. Why Normalization Uses Project-Level Totals

The implementation intentionally calculates the judge's mean and standard deviation from **project-level totals**.

The flow is:

```text id="xgkw5g"
Criterion Scores
       ↓
Weighted Criterion Scores
       ↓
Project Total for Judge
       ↓
Judge Mean / Standard Deviation
       ↓
Normalized Project Score
```

This is important because the normalization unit is the actual score a judge assigns to a project.

Calculating statistics independently over criterion rows would mix different rubric dimensions and would not represent the judge's overall project-level scoring behavior.

---

# 16. Normalized Results

After normalization, the system aggregates normalized scores across judges for each project.

Conceptually:

```text id="qz9x8f"
Judge 1 → Normalized Project Score
Judge 2 → Normalized Project Score
Judge 3 → Normalized Project Score
                ↓
        Project Normalized Average
```

The normalized results can then be sorted for result analysis.

The normalization service also exposes judge-level statistics and the number of projects each judge evaluated.

---

# 17. Normalization Example

Consider a judge who evaluates three projects with project-level scores:

```text id="1f2c4a"
Project A → 70
Project B → 80
Project C → 90
```

The system calculates:

```text id="u7w2bs"
Mean
↓
Standard Deviation
↓
Z-score for each project
↓
Normalized score
```

The resulting normalized scores are based on each project's position relative to that judge's own scoring distribution.

The purpose is not to change the underlying raw judgment. The raw and weighted scores remain available for inspection.

---

# 18. Result Transparency

RaptorOS keeps the raw judging data separate from normalized result calculations.

```text id="x9c0a2"
Raw Judgment
    ↓
Raw Criterion Scores
    ↓
Weighted Criterion Scores
    ↓
Project Total
    ↓
Normalization
    ↓
Normalized Result
```

This means organizers can distinguish between:

- What a judge originally scored
- How the score was weighted
- How normalization transformed the score
- The resulting cross-judge comparison

---

# 19. CSV Export

Organizers can export judging results through the judging API.

The export is based on the calculated event results.

The workflow is:

```text id="7q3n8a"
Judgments
   ↓
Weighted Project Scores
   ↓
Normalization
   ↓
Event Results
   ↓
CSV Export
```

This allows results to be archived or analyzed outside RaptorOS.

---

# 20. Judging Simulator

RaptorOS includes a Judging Simulator for testing and operational planning.

The simulator operates on submitted projects and the available event rubric.

Its workflow is:

```text id="h0r5e6"
Event
 ↓
Submitted Projects
 ↓
Eligible Judges
 ↓
Assignment Simulation
 ↓
Workload Distribution
 ↓
Simulated Criterion Scores
 ↓
Project Averages
```

The simulator can be used to inspect the judging workflow before or independently of real judging activity.

Simulated scores are not intended to replace actual judge decisions.

---

# 21. Human-in-the-Loop Decision Model

RaptorOS does not automatically determine the final winner based on AI analysis.

The judging architecture separates:

```text id="n4o8ye"
Evidence / Analysis
        ↓
Human Judge
        ↓
Judgment
        ↓
Score
        ↓
Normalization / Results
```

The JEV/Raptor Intelligence layer can provide project evidence and analysis, but the final scoring decision remains with the human judge.

This is especially important for subjective criteria such as innovation, usability, impact, and execution quality.

---

# 22. JEV / Raptor Intelligence in Judging

The judging interface can request project analysis and evidence retrieval.

The analysis pipeline is:

```text id="5v8b4n"
Project
  ↓
Submitted Content
  ↓
Evidence Index
  ↓
Evidence Retrieval
  ↓
JEV Analysis
  ↓
Judge Review
```

JEV can provide:

- Project analysis
- Criterion-specific analysis
- Evidence search
- Relevant project context

The retrieved evidence is intended to support the judge's evaluation rather than silently modifying the score.

---

# 23. Judging Integrity Controls

RaptorOS applies multiple integrity controls to the judging workflow.

### Role isolation

Judging APIs are protected by authentication and role-based authorization.

### Invitation validation

Judges must have an accepted invitation before assignment.

### Assignment uniqueness

The database prevents duplicate judge/project assignments.

### Conflict prevention

Judges cannot be assigned to their own team's projects.

### Judgment uniqueness

A judge cannot submit duplicate judgments for the same project and rubric.

### Score uniqueness

A criterion cannot receive multiple score rows within the same judgment.

### Audit logging

Important judging actions are recorded in the audit log.

### Score explainability

Project scores can be broken down into their underlying criterion-level components.

### Normalization transparency

The normalization service exposes the statistics and formula used to transform judge scores.

---

# 24. Judging API

The primary judging endpoints include:

```text id="c8p3yd"
GET  /api/judging/my-assignments
GET  /api/judging/my-progress
GET  /api/judging/project/:projectId
GET  /api/judging/explain/:projectId

POST /api/judging/judgments

GET  /api/judging/judges
POST /api/judging/judges

GET  /api/judging/rubrics/:eventId
POST /api/judging/rubrics

GET  /api/judging/assignments
POST /api/judging/assign

POST /api/judging/simulate/:eventId

GET  /api/judging/results/:eventId
GET  /api/judging/results/:eventId/export
```

Access to these endpoints is controlled according to the operation being performed.

Judge-facing operations are separated from organizer/admin operations.

---

# 25. Judging Data Model

The judging-specific database relationships are:

```text id="k8x9s1"
EVENT
  │
  ├──────────────► RUBRIC
  │                  │
  │                  └──► RUBRIC CRITERIA
  │
  └──────────────► JUDGE INVITATIONS
                         │
                         ▼
                       JUDGE
                         │
                         ├──► ASSIGNMENTS ─────► PROJECT
                         │
                         └──► JUDGMENTS
                                  │
                                  ├──► PROJECT
                                  │
                                  ├──► RUBRIC
                                  │
                                  └──► SCORES
                                          │
                                          └──► CRITERIA
```

This separates eligibility, assignment, evaluation, and scoring into distinct records.

---

# 26. End-to-End Example

A typical project evaluation looks like this:

```text id="w1c3qa"
1. Organizer creates event
        ↓
2. Organizer creates rubric
        ↓
3. Judge receives invitation
        ↓
4. Judge accepts invitation
        ↓
5. Organizer assigns project
        ↓
6. Backend checks conflict
        ↓
7. Judge opens project
        ↓
8. Judge reviews submission
        ↓
9. Judge optionally uses Raptor Intelligence
        ↓
10. Judge scores each criterion
        ↓
11. Backend calculates weighted scores
        ↓
12. Judgment is submitted
        ↓
13. Audit entry is created
        ↓
14. Judge progress updates
        ↓
15. Organizer calculates normalized results
        ↓
16. Results can be explained/exported
```

---

# 27. Design Rationale

The judging system is designed around several principles.

## Correctness before feature count

The core judging workflow is kept explicit:

```text
Invitation → Assignment → Evaluation → Score → Result
```

Each stage is represented by persistent records and backend validation.

## Separation of raw and derived data

Raw scores remain stored in the database.

Weighted and normalized results are derived from those records.

This makes the scoring pipeline inspectable.

## Backend enforcement

Important judging rules are checked server-side so that they cannot be bypassed simply by modifying the frontend.

## Explainability

The system can trace a project result back to its judges, rubric, criteria, and raw scores.

## Human control

AI-assisted analysis provides evidence and context but does not replace human judging.

## Statistical transparency

Normalization uses an explicit formula and project-level judge statistics rather than an opaque transformation.

---

# 28. Summary

The RaptorOS judging engine is structured as:

```text id="xq2g0b"
INVITATION
    ↓
ELIGIBILITY
    ↓
ASSIGNMENT
    ↓
CONFLICT CHECK
    ↓
PROJECT REVIEW
    ↓
CRITERION SCORING
    ↓
WEIGHTED PROJECT SCORE
    ↓
JUDGE PROGRESS
    ↓
CROSS-JUDGE NORMALIZATION
    ↓
RESULTS / CSV
```

The system preserves the underlying judging evidence while providing normalization and analysis as derived layers.

The final decision remains a human decision supported by transparent scores, evidence, audit records, and explainable result calculations.