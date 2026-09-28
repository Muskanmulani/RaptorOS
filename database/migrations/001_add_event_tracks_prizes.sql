BEGIN;

CREATE TABLE IF NOT EXISTS event_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (event_id, name)
);

CREATE TABLE IF NOT EXISTS event_prizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    position INTEGER,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (event_id, position)
);

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS track_id UUID
REFERENCES event_tracks(id)
ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_event_tracks_event
ON event_tracks(event_id);

CREATE INDEX IF NOT EXISTS idx_event_prizes_event
ON event_prizes(event_id);

CREATE INDEX IF NOT EXISTS idx_projects_track
ON projects(track_id);

COMMIT;