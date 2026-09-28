import { useEffect, useState } from "react";
import { Users, Plus, LogIn, Copy, CheckCircle2 } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function ParticipantPortal() {
  const { user } = useAuth();

  const [events, setEvents] = useState([]);
  const [teams, setTeams] = useState([]);

  const [teamName, setTeamName] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");

  const [inviteCode, setInviteCode] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [eventsResponse, teamsResponse] = await Promise.all([
        api.get("/events"),
        api.get("/teams/mine")
      ]);

      const availableEvents = eventsResponse.data?.events || [];
      const myTeams = teamsResponse.data?.teams || teamsResponse.data || [];

      setEvents(availableEvents);
      setTeams(Array.isArray(myTeams) ? myTeams : []);

      if (!selectedEvent && availableEvents.length > 0) {
        const activeEvent =
          availableEvents.find(
            (event) =>
              event.status !== "completed"
          ) || availableEvents[0];

        setSelectedEvent(activeEvent.id);
      }
    } catch (err) {
      console.error("Failed to load participant data:", err);
      setError(
        err.response?.data?.message ||
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

    if (!selectedEvent || !teamName.trim()) {
      setError("Select an event and enter a team name.");
      return;
    }

    try {
      setCreating(true);
      setError("");
      setMessage("");

      await api.post("/teams", {
        event_id: selectedEvent,
        name: teamName.trim()
      });

      setTeamName("");
      setMessage("Team created successfully.");
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create team."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleJoinTeam = async (event) => {
    event.preventDefault();

    if (!inviteCode.trim()) {
      setError("Enter an invite code.");
      return;
    }

    try {
      setJoining(true);
      setError("");
      setMessage("");

      await api.post("/teams/join", {
        inviteCode: inviteCode.trim()
      });

      setInviteCode("");
      setMessage("You joined the team successfully.");
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to join team."
      );
    } finally {
      setJoining(false);
    }
  };

  const copyInviteCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);

      setTimeout(() => {
        setCopiedCode("");
      }, 1500);
    } catch (err) {
      console.error("Failed to copy invite code:", err);
    }
  };

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.3em] text-orange-500">
          PARTICIPANT CONSOLE
        </p>

        <h1 className="mt-2 text-3xl font-semibold">
          Welcome, {user?.name || "Participant"}
        </h1>

        <p className="mt-2 text-sm text-white/40">
          Register for hackathons, create your team, or join an
          existing team.
        </p>
      </div>

      {message && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          <CheckCircle2 size={17} />
          {message}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-[#151310] p-8 text-sm text-white/40">
          Loading participant console...
        </div>
      ) : (
        <>
          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-[#151310] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border border-orange-500/30 bg-orange-500/10 text-orange-400">
                  <Plus size={18} />
                </div>

                <div>
                  <h2 className="font-semibold">
                    Create a team
                  </h2>

                  <p className="text-xs text-white/30">
                    Start a new team for an event
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleCreateTeam}
                className="mt-6 space-y-4"
              >
                <div>
                  <label className="text-xs text-white/40">
                    Event
                  </label>

                  <select
                    value={selectedEvent}
                    onChange={(event) =>
                      setSelectedEvent(event.target.value)
                    }
                    className="mt-2 w-full rounded-lg border border-white/10 bg-[#0d0c0a] px-4 py-3 text-sm text-white outline-none focus:border-orange-500/50"
                  >
                    <option value="">
                      Select an event
                    </option>

                    {events.map((event) => (
                      <option
                        key={event.id}
                        value={event.id}
                      >
                        {event.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-white/40">
                    Team name
                  </label>

                  <input
                    type="text"
                    value={teamName}
                    onChange={(event) =>
                      setTeamName(event.target.value)
                    }
                    placeholder="e.g. Team Phoenix"
                    className="mt-2 w-full rounded-lg border border-white/10 bg-[#0d0c0a] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-orange-500/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="w-full rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating
                    ? "Creating team..."
                    : "Create team"}
                </button>
              </form>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#151310] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border border-white/10 bg-white/[0.03] text-white/60">
                  <LogIn size={18} />
                </div>

                <div>
                  <h2 className="font-semibold">
                    Join a team
                  </h2>

                  <p className="text-xs text-white/30">
                    Use the invite code shared by your teammate
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleJoinTeam}
                className="mt-6"
              >
                <label className="text-xs text-white/40">
                  Invite code
                </label>

                <input
                  type="text"
                  value={inviteCode}
                  onChange={(event) =>
                    setInviteCode(event.target.value)
                  }
                  placeholder="Enter invite code"
                  className="mt-2 w-full rounded-lg border border-white/10 bg-[#0d0c0a] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-orange-500/50"
                />

                <button
                  type="submit"
                  disabled={joining}
                  className="mt-4 w-full rounded-lg border border-white/10 px-4 py-3 text-sm font-medium text-white/70 transition hover:border-orange-500/40 hover:bg-orange-500/[0.05] hover:text-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {joining
                    ? "Joining team..."
                    : "Join team"}
                </button>
              </form>
            </div>
          </section>

          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] tracking-[0.25em] text-white/30">
                  YOUR TEAMS
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  Team membership
                </h2>
              </div>

              <span className="text-xs text-white/30">
                {teams.length} team{teams.length === 1 ? "" : "s"}
              </span>
            </div>

            {teams.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-[#151310] p-8 text-center">
                <Users
                  size={28}
                  className="mx-auto text-white/20"
                />

                <p className="mt-3 text-sm text-white/40">
                  You are not part of a team yet.
                </p>

                <p className="mt-1 text-xs text-white/20">
                  Create a team or join one using an invite code.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className="rounded-2xl border border-white/10 bg-[#151310] p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] tracking-[0.2em] text-orange-500">
                          TEAM
                        </p>

                        <h3 className="mt-1 text-lg font-semibold">
                          {team.name}
                        </h3>
                      </div>

                      <Users
                        size={18}
                        className="text-white/30"
                      />
                    </div>

                    <div className="mt-5 border-t border-white/10 pt-4">
                      <p className="text-[10px] tracking-[0.2em] text-white/20">
                        EVENT
                      </p>

                      <p className="mt-1 text-sm text-white/60">
                        {team.event_name || "Hackathon Event"}
                      </p>
                    </div>

                    {team.invite_code && (
                      <div className="mt-4">
                        <p className="text-[10px] tracking-[0.2em] text-white/20">
                          INVITE CODE
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            copyInviteCode(team.invite_code)
                          }
                          className="mt-2 flex w-full items-center justify-between rounded-lg border border-white/10 bg-[#0d0c0a] px-4 py-3 text-left transition hover:border-orange-500/30"
                        >
                          <span className="font-mono text-sm text-orange-400">
                            {team.invite_code}
                          </span>

                          {copiedCode === team.invite_code ? (
                            <CheckCircle2
                              size={15}
                              className="text-green-400"
                            />
                          ) : (
                            <Copy
                              size={15}
                              className="text-white/30"
                            />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default ParticipantPortal;