
import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, ArrowRight, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CommandHeader from "../components/CommandHeader";
import api from "../services/api";

function JudgingDesk() {
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
  const [progress, setProgress] = useState({
    totalAssignments: 0,
    completedAssignments: 0,
    pendingAssignments: 0,
    completionPercentage: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadJudgingData = async () => {
      setLoading(true);
      setError("");

      try {
        const [assignmentsResponse, progressResponse] =
          await Promise.all([
            api.get("/judging/my-assignments"),
            api.get("/judging/my-progress")
          ]);

        setAssignments(assignmentsResponse.data.assignments || []);
        setProgress(
          progressResponse.data || {
            totalAssignments: 0,
            completedAssignments: 0,
            pendingAssignments: 0,
            completionPercentage: 0
          }
        );
      } catch (error) {
        console.error("Failed to load judging data:", error);

        setError(
          error.response?.data?.message ||
            "Unable to load judging assignments."
        );
      } finally {
        setLoading(false);
      }
    };

    loadJudgingData();
  }, []);

  const getAssignmentCode = (assignment, index) => {
    if (assignment.project_id) {
      return `P-${String(assignment.project_id).padStart(3, "0")}`;
    }

    return `P-${String(index + 1).padStart(3, "0")}`;
  };

  const getScore = (assignment) => {
    if (assignment.status !== "completed") {
      return "—";
    }

    if (assignment.score !== undefined && assignment.score !== null) {
      return Number(assignment.score).toFixed(2);
    }

    return "DONE";
  };

  const handleReview = (assignment) => {
    navigate(`/judge/project/${assignment.project_id}`);
  };

  return (
    <div>
      <CommandHeader />

      <section className="mb-10">
        <p className="text-[10px] tracking-[0.3em] text-orange-500">
          JUDGING / 03
        </p>

        <h1 className="mt-3 text-5xl font-semibold tracking-tight">
          Judging Desk
        </h1>

        <p className="mt-4 max-w-xl text-sm leading-6 text-white/40">
          Review assigned projects, complete rubric evaluations, and monitor
          judging progress.
        </p>
      </section>

      {loading && (
        <div className="mb-8 border border-white/10 bg-[#151310] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
            <p className="text-[10px] tracking-[0.2em] text-white/40">
              SYNCHRONIZING JUDGING DATA...
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-8 flex items-center gap-3 border border-red-500/20 bg-red-500/[0.04] px-6 py-4">
          <AlertCircle size={16} className="text-red-400" />

          <p className="text-sm text-red-300">
            {error}
          </p>
        </div>
      )}

      <section className="mb-8 grid gap-px border border-white/10 bg-white/10 md:grid-cols-3">
        <div className="bg-[#151310] p-6">
          <p className="text-[10px] tracking-[0.2em] text-white/30">
            ASSIGNED
          </p>

          <p className="mt-3 font-mono text-3xl">
            {String(progress.totalAssignments).padStart(2, "0")}
          </p>
        </div>

        <div className="bg-[#151310] p-6">
          <p className="text-[10px] tracking-[0.2em] text-white/30">
            COMPLETED
          </p>

          <p className="mt-3 font-mono text-3xl text-orange-500">
            {String(progress.completedAssignments).padStart(2, "0")}
          </p>
        </div>

        <div className="bg-[#151310] p-6">
          <p className="text-[10px] tracking-[0.2em] text-white/30">
            PROGRESS
          </p>

          <p className="mt-3 font-mono text-3xl">
            {Math.round(progress.completionPercentage)}%
          </p>
        </div>
      </section>

      <section className="border-l border-t border-white/10">
        {!loading && assignments.length === 0 && (
          <div className="border-b border-r border-white/10 bg-[#151310] p-10 text-center">
            <p className="text-sm text-white/40">
              No projects have been assigned to you yet.
            </p>
          </div>
        )}

        {assignments.map((assignment, index) => {
          const isComplete = assignment.status === "completed";
          const isPending = assignment.status === "pending";

          return (
            <div
              key={assignment.id}
              className="group grid border-b border-r border-white/10 p-6 transition hover:bg-white/[0.02] md:grid-cols-[100px_1.5fr_1fr_150px_80px_30px] md:items-center md:gap-6"
            >
              <span className="font-mono text-xs text-white/20">
                {getAssignmentCode(assignment, index)}
              </span>

              <div>
                <h2 className="text-lg font-medium">
                  {assignment.title}
                </h2>

                <p className="mt-1 text-xs text-white/30">
                  {assignment.team_name || "Unassigned team"}
                </p>

                {assignment.event_name && (
                  <p className="mt-2 text-[9px] tracking-[0.15em] text-white/20">
                    {assignment.event_name}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isComplete && (
                  <CheckCircle2
                    size={15}
                    className="text-orange-500"
                  />
                )}

                {isPending && (
                  <Clock3
                    size={15}
                    className="text-orange-500"
                  />
                )}

                <span
                  className={`text-[10px] tracking-[0.15em] ${
                    isComplete
                      ? "text-orange-500"
                      : "text-white/40"
                  }`}
                >
                  {isComplete
                    ? "COMPLETE"
                    : "PENDING"}
                </span>
              </div>

              <span className="font-mono text-sm text-white/60">
                {getScore(assignment)}
              </span>

              <button
                type="button"
                onClick={() => handleReview(assignment)}
                className="flex items-center justify-center gap-2 text-[10px] tracking-wider text-white/40 transition hover:text-orange-500"
              >
                REVIEW
              </button>

              <ArrowRight
                size={15}
                className="text-white/20 transition group-hover:text-orange-500"
              />
            </div>
          );
        })}
      </section>
    </div>
  );
}

export default JudgingDesk;
