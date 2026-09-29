import { useEffect, useState } from "react";
import CommandHeader from "../components/CommandHeader";
import {
  Users,
  GitBranch,
  Scale,
  ShieldCheck,
  AlertTriangle,
  Activity
} from "lucide-react";
import api from "../services/api";

function ControlRoom() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHealth = async () => {
      setLoading(true);
      setError("");

      try {
        let eventId = localStorage.getItem("raptoros_event_id");

        if (!eventId) {
          const eventsResponse = await api.get("/events");
          const events = eventsResponse.data.events || [];

          if (events.length > 0) {
            eventId = events[0].id;
            localStorage.setItem("raptoros_event_id", eventId);
          }
        }

        if (!eventId) {
          setError("No event is available for monitoring.");
          return;
        }

        const response = await api.get(`/health/${eventId}`);
        setHealth(response.data);
      } catch (error) {
        console.error("Failed to load control room:", error);

        setError(
          error.response?.data?.message ||
            "Unable to load event control data."
        );
      } finally {
        setLoading(false);
      }
    };

    loadHealth();
  }, []);

  const systems = [
    {
      code: "01",
      title: "PARTICIPANTS",
      value: health
        ? String(health.teams?.totalTeams || 0).padStart(3, "0")
        : "—",
      detail: "ACTIVE TEAMS",
      icon: Users
    },
    {
      code: "02",
      title: "ASSIGNMENTS",
      value: health
        ? String(health.judging?.totalAssignments || 0).padStart(3, "0")
        : "—",
      detail: health
        ? `${health.judging?.assignedProjects || 0} PROJECTS COVERED`
        : "LOADING",
      icon: GitBranch
    },
    {
      code: "03",
      title: "NORMALIZATION",
      value: health
        ? health.judging?.totalAssignments > 0
          ? "READY"
          : "STANDBY"
        : "—",
      detail: health
        ? `${health.judging?.judgingCompletion || 0}% JUDGING COMPLETE`
        : "LOADING",
      icon: Scale
    },
    {
      code: "04",
      title: "INTEGRITY",
      value: health
        ? health.integrity?.activeConflicts === 0
          ? "NOMINAL"
          : "ATTENTION"
        : "—",
      detail: health
        ? health.integrity?.activeConflicts === 0
          ? "NO ACTIVE CONFLICTS"
          : `${health.integrity.activeConflicts} ACTIVE CONFLICTS`
        : "LOADING",
      icon: ShieldCheck
    }
  ];

  return (
    <div>
      <CommandHeader />

      <section className="mb-10">
        <p className="text-[11px] font-semibold tracking-[0.3em] text-orange-400">
          CONTROL / 04
        </p>

        <div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-5xl font-bold tracking-tight text-white">
              Control Room
            </h1>

            <p className="mt-4 max-w-xl text-base font-medium leading-6 text-white/60">
              Operate the event, monitor judging integrity, and inspect
              critical system signals.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.15em] text-white/50">
            <Activity
              size={14}
              className={
                loading
                  ? "animate-pulse text-orange-400"
                  : "text-orange-400"
              }
            />
            {loading ? "SYNCING" : "LIVE"}
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-8 flex items-center gap-3 border border-red-500/25 bg-red-500/[0.05] px-6 py-4">
          <AlertTriangle size={17} className="text-red-400" />

          <p className="text-sm font-semibold text-red-300">
            {error}
          </p>
        </div>
      )}

      <section className="grid border-l border-t border-white/15 md:grid-cols-2">
        {systems.map(({ code, title, value, detail, icon: Icon }) => (
          <div
            key={code}
            className="border-b border-r border-white/15 p-7 transition hover:bg-white/[0.03]"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold text-white/45">
                {code}
              </span>

              <Icon size={19} className="text-orange-400/80" />
            </div>

            <p className="mt-10 text-[11px] font-semibold tracking-[0.2em] text-white/50">
              {title}
            </p>

            <p className="mt-2 font-mono text-3xl font-semibold text-white">
              {value}
            </p>

            <p className="mt-3 text-[11px] font-semibold tracking-wider text-orange-400/80">
              {detail}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-8 border border-white/15 bg-[#151310]">
        <div className="flex items-center gap-3 border-b border-white/15 p-6">
          <AlertTriangle size={18} className="text-orange-400" />

          <div>
            <p className="text-[11px] font-semibold tracking-[0.25em] text-orange-400">
              SYSTEM SIGNALS
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              Attention Required
            </h2>
          </div>
        </div>

        <div className="divide-y divide-white/10">
          <div className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-base font-medium text-white/80">
                {health
                  ? `${health.judging?.unassignedProjects || 0} projects have insufficient judge coverage`
                  : "Checking project coverage..."}
              </p>

              <p className="mt-1 text-[11px] font-semibold text-white/40">
                ASSIGNMENT ENGINE
              </p>
            </div>

            <span
              className={`text-[11px] font-semibold tracking-wider ${
                health?.judging?.unassignedProjects > 0
                  ? "text-orange-400"
                  : "text-white/45"
              }`}
            >
              {health?.judging?.unassignedProjects > 0
                ? "REVIEW"
                : "CLEAR"}
            </span>
          </div>

          <div className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-base font-medium text-white/80">
                {health
                  ? `${health.integrity?.activeConflicts || 0} active judge conflicts detected`
                  : "Checking integrity..."}
              </p>

              <p className="mt-1 text-[11px] font-semibold text-white/40">
                FAIRNESS MONITOR
              </p>
            </div>

            <span
              className={`text-[11px] font-semibold tracking-wider ${
                health?.integrity?.activeConflicts > 0
                  ? "text-orange-400"
                  : "text-white/45"
              }`}
            >
              {health?.integrity?.activeConflicts > 0
                ? "REVIEW"
                : "CLEAR"}
            </span>
          </div>

          <div className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-base font-medium text-white/80">
                {health
                  ? `${health.submissions?.submittedProjects || 0} of ${health.submissions?.totalProjects || 0} projects submitted`
                  : "Checking submissions..."}
              </p>

              <p className="mt-1 text-[11px] font-semibold text-white/40">
                SUBMISSION PIPELINE
              </p>
            </div>

            <span className="font-mono text-[11px] font-semibold text-orange-400">
              {health
                ? `${health.submissions?.submissionPercentage || 0}%`
                : "—"}
            </span>
          </div>

          <div className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-base font-medium text-white/80">
                {health
                  ? `${health.judging?.completedJudgments || 0} of ${health.judging?.totalAssignments || 0} judgments completed`
                  : "Checking judging progress..."}
              </p>

              <p className="mt-1 text-[11px] font-semibold text-white/40">
                JUDGING PIPELINE
              </p>
            </div>

            <span className="font-mono text-[11px] font-semibold text-orange-400">
              {health
                ? `${health.judging?.judgingCompletion || 0}%`
                : "—"}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ControlRoom;