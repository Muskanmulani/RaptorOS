import { useEffect, useState } from "react";
import CommandHeader from "../components/CommandHeader";
import {
  Copy,
  Check,
  Vote,
  MessageSquare,
  RefreshCw
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function shuffleProjects(items) {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function ParticipantPortal() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);

  const [selectedEvent, setSelectedEvent] = useState("");
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const [loading, setLoading] = useState(true);
  const [teamLoading, setTeamLoading] = useState(false);
  const [votingLoading, setVotingLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [copiedCode, setCopiedCode] = useState("");

  const [commentOpen, setCommentOpen] = useState({});
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [commentLoading, setCommentLoading] = useState({});

  const loadVotingData = async () => {
    setVotingLoading(true);

    try {
      const response = await api.get("/projects?limit=50");

      const rawProjects = response.data?.projects || [];

      const submittedProjects = rawProjects.filter(
        (project) =>
          project.id &&
          String(project.status || "").toUpperCase() !== "DRAFT"
      );

      const votingProjects = await Promise.all(
        submittedProjects.map(async (project) => {
          try {
            const votingResponse = await api.get(
              `/voting/project/${project.id}`
            );

            const commentsResponse = await api.get(
              `/voting/project/${project.id}/comments`
            );

            return {
              ...project,
              voting: votingResponse.data,
              comments: commentsResponse.data?.comments || []
            };
          } catch (projectError) {
            console.error(
              `Failed to load voting data for project ${project.id}:`,
              projectError
            );

            return {
              ...project,
              voting: {
                votingEnabled: false,
                votingOpen: false,
                hasVoted: false,
                voteCount: 0
              },
              comments: []
            };
          }
        })
      );

      setProjects(shuffleProjects(votingProjects));
    } catch (loadError) {
      console.error("Failed to load projects:", loadError);
      setProjects([]);
    } finally {
      setVotingLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [eventsResponse, teamsResponse] = await Promise.all([
        api.get("/events"),
        api.get("/teams/mine")
      ]);

      const eventData = eventsResponse.data?.events || [];
      const teamData = teamsResponse.data?.teams || [];

      setEvents(eventData);
      setTeams(teamData);

      if (eventData.length > 0) {
        setSelectedEvent((current) => current || eventData[0].id);
      }

      await loadVotingData();
    } catch (loadError) {
      console.error("Failed to load participant data:", loadError);

      setError(
        loadError.response?.data?.message ||
          "Unable to load participant data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTeam = async (event) => {
    event.preventDefault();

    if (!selectedEvent) {
      setError("Please select an event.");
      return;
    }

    if (!teamName.trim()) {
      setError("Please enter a team name.");
      return;
    }

    setTeamLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post("/teams", {
        eventId: selectedEvent,
        name: teamName.trim()
      });

      setMessage(
        response.data?.message || "Team created successfully."
      );

      setTeamName("");

      const teamsResponse = await api.get("/teams/mine");
      setTeams(teamsResponse.data?.teams || []);
    } catch (createError) {
      console.error("Failed to create team:", createError);

      setError(
        createError.response?.data?.message ||
          "Unable to create team."
      );
    } finally {
      setTeamLoading(false);
    }
  };

  const handleJoinTeam = async (event) => {
    event.preventDefault();

    if (!inviteCode.trim()) {
      setError("Please enter an invite code.");
      return;
    }

    setTeamLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post("/teams/join", {
        inviteCode: inviteCode.trim()
      });

      setMessage(
        response.data?.message || "Joined team successfully."
      );

      setInviteCode("");

      const teamsResponse = await api.get("/teams/mine");
      setTeams(teamsResponse.data?.teams || []);
    } catch (joinError) {
      console.error("Failed to join team:", joinError);

      setError(
        joinError.response?.data?.message ||
          "Unable to join team."
      );
    } finally {
      setTeamLoading(false);
    }
  };

  const handleCopyInviteCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);

      setCopiedCode(code);

      setTimeout(() => {
        setCopiedCode("");
      }, 1500);
    } catch (copyError) {
      console.error("Failed to copy invite code:", copyError);
    }
  };

  const handleVote = async (projectId) => {
    setVotingLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post(`/voting/project/${projectId}`);

      setMessage(
        response.data?.message || "Your community vote has been recorded."
      );

      await loadVotingData();
    } catch (voteError) {
      console.error("Failed to vote:", voteError);

      setError(
        voteError.response?.data?.message ||
          "Unable to record your vote."
      );
    } finally {
      setVotingLoading(false);
    }
  };

  const handleRemoveVote = async (projectId) => {
    setVotingLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await api.delete(
        `/voting/project/${projectId}`
      );

      setMessage(
        response.data?.message || "Your vote has been removed."
      );

      await loadVotingData();
    } catch (voteError) {
      console.error("Failed to remove vote:", voteError);

      setError(
        voteError.response?.data?.message ||
          "Unable to remove your vote."
      );
    } finally {
      setVotingLoading(false);
    }
  };

  const loadComments = async (projectId) => {
    try {
      const response = await api.get(
        `/voting/project/${projectId}/comments`
      );

      setComments((current) => ({
        ...current,
        [projectId]: response.data?.comments || []
      }));
    } catch (commentError) {
      console.error("Failed to load comments:", commentError);
    }
  };

  const toggleComments = async (projectId) => {
    const isOpen = commentOpen[projectId];

    setCommentOpen((current) => ({
      ...current,
      [projectId]: !isOpen
    }));

    if (!isOpen && !comments[projectId]) {
      await loadComments(projectId);
    }
  };

  const handleCommentChange = (projectId, value) => {
    setCommentText((current) => ({
      ...current,
      [projectId]: value
    }));
  };

  const handleAddComment = async (projectId) => {
    const text = String(commentText[projectId] || "").trim();

    if (!text) {
      setError("Please enter a comment before posting.");
      return;
    }

    setCommentLoading((current) => ({
      ...current,
      [projectId]: true
    }));

    setError("");
    setMessage("");

    try {
      const response = await api.post(
        `/voting/project/${projectId}/comments`,
        {
          comment: text
        }
      );

      const newComment = response.data?.comment;

      setCommentText((current) => ({
        ...current,
        [projectId]: ""
      }));

      if (newComment) {
        setComments((current) => ({
          ...current,
          [projectId]: [
            ...(current[projectId] || []),
            newComment
          ]
        }));
      } else {
        await loadComments(projectId);
      }

      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project.id === projectId
            ? {
                ...project,
                comments: newComment
                  ? [...(project.comments || []), newComment]
                  : project.comments || []
              }
            : project
        )
      );

      setMessage(
        response.data?.message || "Comment added successfully."
      );
    } catch (commentError) {
      console.error("Failed to add comment:", commentError);

      setError(
        commentError.response?.data?.message ||
          commentError.message ||
          "Unable to add comment."
      );
    } finally {
      setCommentLoading((current) => ({
        ...current,
        [projectId]: false
      }));
    }
  };

  if (loading) {
    return (
      <div>
        <CommandHeader />

        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-sm font-semibold tracking-[0.15em] text-white/50">
            LOADING PARTICIPANT CONSOLE...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <CommandHeader />

      <section className="mb-10">
        <p className="text-[11px] font-semibold tracking-[0.3em] text-orange-400">
          PARTICIPANT CONSOLE
        </p>

        <h1 className="mt-3 text-5xl font-bold tracking-tight text-white">
          Welcome, {user?.name || "Participant"}
        </h1>

        <p className="mt-4 max-w-2xl text-base font-medium leading-6 text-white/60">
          Create or join a team, manage your participation, and take part in community voting.
        </p>
      </section>

      {(message || error) && (
        <div
          className={`mb-8 border px-5 py-4 text-sm font-semibold ${
            error
              ? "border-red-400/30 bg-red-400/5 text-red-300"
              : "border-orange-400/30 bg-orange-400/5 text-orange-300"
          }`}
        >
          {error || message}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="border border-white/15 bg-[#151310] p-6">
          <div className="mb-6">
            <p className="text-[11px] font-semibold tracking-[0.25em] text-orange-400">
              CREATE A TEAM
            </p>

            <h2 className="mt-2 text-xl font-semibold text-white">
              Start a new team for an event
            </h2>
          </div>

          <form onSubmit={handleCreateTeam} className="space-y-5">
            <div>
              <label className="mb-2 block text-[11px] font-semibold tracking-[0.18em] text-white/50">
                EVENT
              </label>

              <select
                value={selectedEvent}
                onChange={(event) => setSelectedEvent(event.target.value)}
                className="w-full border border-white/15 bg-[#0f0e0c] px-4 py-3 text-sm font-medium text-white outline-none"
              >
                <option value="">Select an event</option>

                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-semibold tracking-[0.18em] text-white/50">
                TEAM NAME
              </label>

              <input
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
                placeholder="Enter team name"
                className="w-full border border-white/15 bg-[#0f0e0c] px-4 py-3 text-sm font-medium text-white outline-none placeholder:text-white/30"
              />
            </div>

            <button
              type="submit"
              disabled={teamLoading}
              className="border border-orange-400 bg-orange-400 px-5 py-3 text-[11px] font-bold tracking-[0.18em] text-black transition hover:bg-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {teamLoading ? "CREATING..." : "CREATE TEAM"}
            </button>
          </form>
        </div>

        <div className="border border-white/15 bg-[#151310] p-6">
          <div className="mb-6">
            <p className="text-[11px] font-semibold tracking-[0.25em] text-orange-400">
              JOIN A TEAM
            </p>

            <h2 className="mt-2 text-xl font-semibold text-white">
              Use the invite code shared by your teammate
            </h2>
          </div>

          <form onSubmit={handleJoinTeam} className="space-y-5">
            <div>
              <label className="mb-2 block text-[11px] font-semibold tracking-[0.18em] text-white/50">
                INVITE CODE
              </label>

              <input
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
                placeholder="e.g. NOVA2026"
                className="w-full border border-white/15 bg-[#0f0e0c] px-4 py-3 text-sm font-medium uppercase tracking-[0.08em] text-white outline-none placeholder:text-white/30"
              />
            </div>

            <button
              type="submit"
              disabled={teamLoading}
              className="border border-white/20 px-5 py-3 text-[11px] font-bold tracking-[0.18em] text-white transition hover:border-orange-400 hover:text-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {teamLoading ? "JOINING..." : "JOIN TEAM"}
            </button>
          </form>
        </div>
      </section>

      {/* YOUR TEAMS — intentionally before Community Voting */}
      <section className="mt-10">
        <div className="mb-6">
          <p className="text-[11px] font-semibold tracking-[0.25em] text-orange-400">
            YOUR TEAMS
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-white">
            Team membership
          </h2>

          <p className="mt-2 text-sm font-medium text-white/50">
            {teams.length} {teams.length === 1 ? "team" : "teams"}
          </p>
        </div>

        {teams.length === 0 ? (
          <div className="border border-white/15 p-8">
            <p className="text-sm font-medium text-white/50">
              You are not a member of any team yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {teams.map((team) => (
              <div
                key={team.id}
                className="border border-white/15 bg-[#151310] p-6"
              >
                <div className="grid gap-6 sm:grid-cols-3">
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.2em] text-white/40">
                      TEAM
                    </p>

                    <p className="mt-2 text-lg font-semibold text-white">
                      {team.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.2em] text-white/40">
                      EVENT
                    </p>

                    <p className="mt-2 text-sm font-medium text-white/75">
                      {team.event_name || team.event || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.2em] text-white/40">
                      INVITE CODE
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold tracking-[0.1em] text-orange-400">
                        {team.invite_code || "—"}
                      </span>

                      {team.invite_code && (
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyInviteCode(team.invite_code)
                          }
                          className="text-white/40 transition hover:text-orange-400"
                          title="Copy invite code"
                        >
                          {copiedCode === team.invite_code ? (
                            <Check size={15} />
                          ) : (
                            <Copy size={15} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* COMMUNITY VOTING */}
      <section className="mt-14">
        <div className="mb-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.25em] text-orange-400">
              COMMUNITY VOTING
            </p>

            <h2 className="mt-2 text-3xl font-semibold text-white">
              Vote for projects
            </h2>

            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/50">
              Explore submitted projects and cast your community vote.
              Project order is randomized to reduce ordering bias.
            </p>
          </div>

          <button
            type="button"
            onClick={loadVotingData}
            disabled={votingLoading}
            className="flex items-center justify-center gap-2 border border-white/15 px-4 py-3 text-[11px] font-bold tracking-[0.16em] text-white transition hover:border-orange-400 hover:text-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={votingLoading ? "animate-spin" : ""}
            />
            REFRESH PROJECTS
          </button>
        </div>

        {votingLoading && projects.length === 0 ? (
          <div className="border border-white/15 p-8">
            <p className="text-sm font-semibold text-white/50">
              Loading projects...
            </p>
          </div>
        ) : projects.length === 0 ? (
          <div className="border border-white/15 p-8">
            <p className="text-lg font-semibold text-white">
              No submitted projects
            </p>

            <p className="mt-2 text-sm font-medium text-white/50">
              Submitted projects will appear here when they are available.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => {
              const voting = project.voting || {};
              const projectComments =
                comments[project.id] || project.comments || [];

              const votingOpen = Boolean(voting.votingOpen);
              const hasVoted = Boolean(voting.hasVoted);

              return (
                <article
                  key={project.id}
                  className="border border-white/15 bg-[#151310] p-6"
                >
                  <div className="flex flex-col justify-between gap-6 lg:flex-row">
                    <div className="max-w-3xl">
                      <p className="text-[10px] font-semibold tracking-[0.2em] text-white/40">
                        PROJECT
                      </p>

                      <h3 className="mt-2 text-2xl font-semibold text-white">
                        {project.title}
                      </h3>

                      <p className="mt-1 text-sm font-semibold text-orange-400">
                        {project.team_name ||
                          project.team ||
                          "Unknown team"}
                      </p>

                      {project.tagline && (
                        <p className="mt-4 text-base font-medium text-white/75">
                          {project.tagline}
                        </p>
                      )}

                      {project.description && (
                        <p className="mt-3 text-sm font-medium leading-6 text-white/50">
                          {project.description}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col gap-3 lg:min-w-[170px] lg:items-end">
                      {votingOpen ? (
                        <button
                          type="button"
                          onClick={() =>
                            hasVoted
                              ? handleRemoveVote(project.id)
                              : handleVote(project.id)
                          }
                          disabled={votingLoading}
                          className={`flex items-center justify-center gap-2 border px-5 py-3 text-[11px] font-bold tracking-[0.16em] transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            hasVoted
                              ? "border-orange-400 bg-orange-400 text-black hover:bg-orange-300"
                              : "border-white/20 text-white hover:border-orange-400 hover:text-orange-400"
                          }`}
                        >
                          <Vote size={15} />

                          {hasVoted ? "REMOVE VOTE" : "VOTE"}
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold tracking-[0.16em] text-white/40">
                          VOTING CLOSED
                        </span>
                      )}

                      <span className="text-xs font-semibold text-white/45">
                        {voting.voteCount === null ||
                        voting.hideVotingResults
                          ? "VOTES HIDDEN"
                          : `${voting.voteCount || 0} ${
                              voting.voteCount === 1 ? "vote" : "votes"
                            }`}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-white/10 pt-5">
                    <button
                      type="button"
                      onClick={() => toggleComments(project.id)}
                      className="flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-white/55 transition hover:text-orange-400"
                    >
                      <MessageSquare size={14} />

                      {commentOpen[project.id]
                        ? "HIDE COMMENTS"
                        : "VIEW COMMENTS"}
                    </button>

                    {commentOpen[project.id] && (
                      <div className="mt-5">
                        <div className="space-y-3">
                          {projectComments.length === 0 ? (
                            <p className="text-sm font-medium text-white/40">
                              No comments yet.
                            </p>
                          ) : (
                            projectComments.map((comment, index) => (
                              <div
                                key={
                                  comment.id ||
                                  `${project.id}-comment-${index}`
                                }
                                className="border border-white/10 bg-[#0f0e0c] p-4"
                              >
                                <div className="flex justify-between gap-4">
                                  <span className="text-xs font-semibold text-white/70">
                                    {comment.user_name ||
                                      comment.user ||
                                      "Community member"}
                                  </span>

                                  {comment.created_at && (
                                    <span className="text-[10px] font-medium text-white/30">
                                      {new Date(
                                        comment.created_at
                                      ).toLocaleString()}
                                    </span>
                                  )}
                                </div>

                                <p className="mt-2 text-sm font-medium leading-6 text-white/55">
                                  {comment.comment}
                                </p>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                          <input
                            value={commentText[project.id] || ""}
                            onChange={(event) =>
                              handleCommentChange(
                                project.id,
                                event.target.value
                              )
                            }
                            maxLength={1000}
                            placeholder="Add a comment..."
                            className="flex-1 border border-white/15 bg-[#0f0e0c] px-4 py-3 text-sm font-medium text-white outline-none placeholder:text-white/30"
                          />

                        <button
                          type="button"
                          onClick={() => handleAddComment(project.id)}
                          disabled={Boolean(commentLoading[project.id])}
                          className="border border-white/20 px-5 py-3 text-[11px] font-bold tracking-[0.16em] text-white transition hover:border-orange-400 hover:text-orange-400 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {commentLoading[project.id]
                            ? "POSTING..."
                            : "ADD COMMENT"}
                        </button>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default ParticipantPortal;