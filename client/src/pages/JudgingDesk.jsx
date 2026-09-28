import CommandHeader from "../components/CommandHeader";
import { CheckCircle2, Clock3, ArrowRight } from "lucide-react";

function JudgingDesk() {
  const assignments = [
    {
      id: "P-014",
      project: "EcoRoute",
      team: "Team Nova",
      progress: "COMPLETE",
      score: "8.42"
    },
    {
      id: "P-021",
      project: "PulseGrid",
      team: "Team Vector",
      progress: "IN PROGRESS",
      score: "—"
    },
    {
      id: "P-027",
      project: "CivicLens",
      team: "Team Orbit",
      progress: "PENDING",
      score: "—"
    }
  ];

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

      <section className="mb-8 grid gap-px border border-white/10 bg-white/10 md:grid-cols-3">
        <div className="bg-[#151310] p-6">
          <p className="text-[10px] tracking-[0.2em] text-white/30">
            ASSIGNED
          </p>
          <p className="mt-3 font-mono text-3xl">03</p>
        </div>

        <div className="bg-[#151310] p-6">
          <p className="text-[10px] tracking-[0.2em] text-white/30">
            COMPLETED
          </p>
          <p className="mt-3 font-mono text-3xl text-orange-500">01</p>
        </div>

        <div className="bg-[#151310] p-6">
          <p className="text-[10px] tracking-[0.2em] text-white/30">
            PROGRESS
          </p>
          <p className="mt-3 font-mono text-3xl">33%</p>
        </div>
      </section>

      <section className="border-l border-t border-white/10">
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className="grid border-b border-r border-white/10 p-6 transition hover:bg-white/[0.02] md:grid-cols-[100px_1.5fr_1fr_150px_80px_30px] md:items-center md:gap-6"
          >
            <span className="font-mono text-xs text-white/20">
              {assignment.id}
            </span>

            <div>
              <h2 className="text-lg font-medium">{assignment.project}</h2>
              <p className="mt-1 text-xs text-white/30">
                {assignment.team}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {assignment.progress === "COMPLETE" && (
                <CheckCircle2 size={15} className="text-orange-500" />
              )}

              {assignment.progress === "IN PROGRESS" && (
                <Clock3 size={15} className="text-orange-500" />
              )}

              <span
                className={`text-[10px] tracking-[0.15em] ${
                  assignment.progress === "COMPLETE"
                    ? "text-orange-500"
                    : "text-white/40"
                }`}
              >
                {assignment.progress}
              </span>
            </div>

            <span className="font-mono text-sm text-white/60">
              {assignment.score}
            </span>

            <button className="flex items-center justify-center gap-2 text-[10px] tracking-wider text-white/40 transition hover:text-orange-500">
              REVIEW
            </button>

            <ArrowRight
              size={15}
              className="text-white/20 transition group-hover:text-orange-500"
            />
          </div>
        ))}
      </section>
    </div>
  );
}

export default JudgingDesk;