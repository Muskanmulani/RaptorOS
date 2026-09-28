const { query } = require("../config/db");

const getEventHealth = async (req, res) => {
  try {
    const { eventId } = req.params;

    const eventResult = await query(
      `SELECT
        id,
        name,
        status,
        start_date,
        end_date,
        submission_deadline,
        community_voting_enabled,
        voting_start,
        voting_end
       FROM events
       WHERE id = $1`,
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    const event = eventResult.rows[0];

    const teamResult = await query(
      `SELECT COUNT(*)::int AS total
       FROM teams
       WHERE event_id = $1`,
      [eventId]
    );

    const projectResult = await query(
      `SELECT
        COUNT(p.id)::int AS total_projects,
        COUNT(
          CASE
            WHEN EXISTS (
              SELECT 1
              FROM submissions s
              WHERE s.project_id = p.id
              AND s.status = 'submitted'
            )
            THEN 1
          END
        )::int AS submitted_projects
       FROM projects p
       JOIN teams t ON t.id = p.team_id
       WHERE t.event_id = $1`,
      [eventId]
    );

    const assignmentResult = await query(
      `SELECT
        COUNT(DISTINCT ja.project_id)::int AS assigned_projects,
        COUNT(ja.id)::int AS total_assignments,
        COUNT(
          CASE
            WHEN EXISTS (
              SELECT 1
              FROM judgments j
              WHERE j.judge_id = ja.judge_id
              AND j.project_id = ja.project_id
            )
            THEN 1
          END
        )::int AS completed_assignments
       FROM judge_assignments ja
       JOIN projects p
         ON p.id = ja.project_id
       JOIN teams t
         ON t.id = p.team_id
       WHERE t.event_id = $1`,
      [eventId]
    );

    const judgeResult = await query(
      `SELECT
        COUNT(DISTINCT ja.judge_id)::int AS active_judges
       FROM judge_assignments ja
       JOIN projects p
         ON p.id = ja.project_id
       JOIN teams t
         ON t.id = p.team_id
       WHERE t.event_id = $1`,
      [eventId]
    );

    const judgePoolResult = await query(
      `SELECT COUNT(*)::int AS total
       FROM judges`,
      []
    );

    const conflictResult = await query(
      `SELECT COUNT(*)::int AS total
       FROM judge_assignments ja
       JOIN projects p
         ON p.id = ja.project_id
       JOIN teams t
         ON t.id = p.team_id
       JOIN judges j
         ON j.id = ja.judge_id
       JOIN team_members tm
         ON tm.team_id = t.id
        AND tm.user_id = j.user_id
       WHERE t.event_id = $1`,
      [eventId]
    );

    const voteResult = await query(
      `SELECT COUNT(*)::int AS total
       FROM project_votes pv
       JOIN projects p
         ON p.id = pv.project_id
       JOIN teams t
         ON t.id = p.team_id
       WHERE t.event_id = $1`,
      [eventId]
    );

    const totalTeams = teamResult.rows[0].total;
    const totalProjects = projectResult.rows[0].total_projects;
    const submittedProjects = projectResult.rows[0].submitted_projects;
    const assignedProjects = assignmentResult.rows[0].assigned_projects;
    const totalAssignments = assignmentResult.rows[0].total_assignments;
    const completedAssignments =
      assignmentResult.rows[0].completed_assignments;

    const submissionPercentage =
      totalProjects === 0
        ? 0
        : Number(
            ((submittedProjects / totalProjects) * 100).toFixed(1)
          );

    const assignmentCoverage =
      totalProjects === 0
        ? 0
        : Number(
            ((assignedProjects / totalProjects) * 100).toFixed(1)
          );

    const judgingCompletion =
      totalAssignments === 0
        ? 0
        : Number(
            ((completedAssignments / totalAssignments) * 100).toFixed(1)
          );

    res.json({
      event: {
        id: event.id,
        name: event.name,
        status: event.status,
        startDate: event.start_date,
        endDate: event.end_date,
        submissionDeadline: event.submission_deadline
      },
      submissions: {
        totalProjects,
        submittedProjects,
        draftProjects: totalProjects - submittedProjects,
        submissionPercentage
      },
      teams: {
        totalTeams
      },
      judging: {
        totalJudges: judgePoolResult.rows[0].total,
        activeJudges: judgeResult.rows[0].active_judges,
        assignedProjects,
        unassignedProjects: totalProjects - assignedProjects,
        totalAssignments,
        completedJudgments: completedAssignments,
        judgingCompletion
      },
      integrity: {
        activeConflicts: conflictResult.rows[0].total
      },
      community: {
        votingEnabled: event.community_voting_enabled,
        votingStart: event.voting_start,
        votingEnd: event.voting_end,
        totalVotes: voteResult.rows[0].total
      }
    });
  } catch (error) {
    console.error("Event health error:", error);

    res.status(500).json({
      message: "Failed to calculate event health"
    });
  }
};

module.exports = {
  getEventHealth
};