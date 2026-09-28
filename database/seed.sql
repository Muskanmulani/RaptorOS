INSERT INTO users (id, name, email, password_hash, role)
VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'Raptor Admin',
    'admin@raptoros.local',
    'TEMP_ADMIN_HASH',
    'admin'
),
(
    '00000000-0000-0000-0000-000000000002',
    'Alex Organizer',
    'organizer@raptoros.local',
    'TEMP_ORGANIZER_HASH',
    'organizer'
),
(
    '00000000-0000-0000-0000-000000000003',
    'Maya Judge',
    'judge1@raptoros.local',
    'TEMP_JUDGE_HASH',
    'judge'
),
(
    '00000000-0000-0000-0000-000000000004',
    'Arjun Judge',
    'judge2@raptoros.local',
    'TEMP_JUDGE_HASH',
    'judge'
),
(
    '00000000-0000-0000-0000-000000000005',
    'Demo Participant',
    'participant@raptoros.local',
    'TEMP_PARTICIPANT_HASH',
    'participant'
);

INSERT INTO events (
    id,
    name,
    description,
    start_date,
    end_date,
    submission_deadline,
    status,
    created_by
)
VALUES (
    '10000000-0000-0000-0000-000000000001',
    'RaptorOS Demo Hackathon',
    'A seeded demonstration event for the RaptorOS judging platform.',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP + INTERVAL '5 days',
    CURRENT_TIMESTAMP + INTERVAL '3 days',
    'active',
    '00000000-0000-0000-0000-000000000002'
);

INSERT INTO teams (
    id,
    event_id,
    name,
    invite_code
)
VALUES (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Team Nova',
    'NOVA2026'
);

INSERT INTO team_members (team_id, user_id)
VALUES (
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000005'
);

INSERT INTO projects (
    id,
    team_id,
    title,
    tagline,
    description,
    repository_url,
    demo_url
)
VALUES (
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'EcoRoute',
    'Smarter routes for greener cities',
    'A demo project showing how RaptorOS handles project submissions and judging.',
    'https://github.com/example/ecoroute',
    'https://example.com/ecoroute'
);

INSERT INTO submissions (
    id,
    project_id,
    version,
    status,
    submitted_at
)
VALUES (
    '40000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    1,
    'submitted',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
);

INSERT INTO judges (
    id,
    user_id
)
VALUES
(
    '50000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003'
),
(
    '50000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000004'
);

INSERT INTO judge_assignments (
    id,
    judge_id,
    project_id
)
VALUES
(
    '60000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001'
),
(
    '60000000-0000-0000-0000-000000000002',
    '50000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000001'
);

INSERT INTO rubrics (
    id,
    event_id,
    name
)
VALUES (
    '70000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'RaptorOS Standard Rubric'
);

INSERT INTO rubric_criteria (
    id,
    rubric_id,
    name,
    description,
    weight,
    max_score
)
VALUES
(
    '80000000-0000-0000-0000-000000000001',
    '70000000-0000-0000-0000-000000000001',
    'Technical Depth',
    'Architecture, implementation quality and technical complexity.',
    30,
    10
),
(
    '80000000-0000-0000-0000-000000000002',
    '70000000-0000-0000-0000-000000000001',
    'Innovation',
    'Originality and creativity of the solution.',
    25,
    10
),
(
    '80000000-0000-0000-0000-000000000003',
    '70000000-0000-0000-0000-000000000001',
    'Impact',
    'Potential usefulness and real-world value.',
    25,
    10
),
(
    '80000000-0000-0000-0000-000000000004',
    '70000000-0000-0000-0000-000000000001',
    'Execution',
    'Completeness, usability and quality of implementation.',
    20,
    10
);

INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    metadata
)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'EVENT_CREATED',
    'event',
    '10000000-0000-0000-0000-000000000001',
    '{"source":"seed"}'
);