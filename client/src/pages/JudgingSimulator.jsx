import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Gauge,
  Play,
  RefreshCw,
  Scale,
  Users
} from "lucide-react";
import CommandHeader from "../components/CommandHeader";
import api from "../services/api";

function JudgingSimulator() {
  const [eventId, setEventId] = useState("");
  const [eventName, setEventName] = useState("");
  const [judgesPerProject, setJudgesPerProject] = useState(2);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const storedEventId = localStorage.getItem("raptoros_event_id");

        if (storedEventId) {
          setEventId(storedEventId);

          const response = await api.get(`/events/${storedEventId}`);

          setEventName(response.data.event?.name || "RaptorOS Event");
          return;
        }

        const response = await api.get("/events");
        const events = response.data.events || [];

        if (events.length === 0) {
          setError("No event available for simulation.");
          return;
        }

        const firstEvent = events[0];

        localStorage.setItem(
          "raptoros_event_id",
          firstEvent.id
        );

        setEventId(firstEvent.id);
        setEventName(firstEvent.name || "RaptorOS Event");
      } catch (error) {
        console.error("Failed to load event:", error);

        setError(
          error.response?.data?.message ||
            "Unable to load event information."
        );
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, []);

  const runSimulation = async () => {
    if (!eventId) {
      setError("No event is available for simulation.");
      return;
    }

    setRunning(true);
    setError("");

    try {
      const response = await api.post(
        `/judging/simulate/${eventId}`,
        {
          judgesPerProject: Number(judgesPerProject)
        }
      );

      setResult(response.data.simulation);
      setEventName(
        response.data.event?.name || eventName || "RaptorOS Event"
      );
    } catch (error) {
      console.error("Simulation failed:", error);

      setError(
        error.response?.data?.message ||
          "Unable to run judging simulation."
      );
    } finally {
      setRunning(false);
    }
  };

  const averageScore = useMemo(() => {
    if (!result?.projects?.length) {
      return 0;
    }

    return (
      result.projects.reduce(
        (sum, project) => sum + Number(project.averageScore),
        0
      ) / result.projects.length
    );
  }, [result]);

  const highestScore = useMemo(() => {
    if (!result?.projects?.length) {
      return 0;
    }

    return Math.max(
      ...result.projects.map((project) =>
        Number(project.averageScore)
      )
    );
  }, [result]);

  const workloadMaximum = useMemo(() => {
    if (!result?.judgeWorkload?.length) {
      return 0;
    }

    return Math.max(
      ...result.judgeWorkload.map((judge) =>
        Number(judge.workload)
      )
    );
  }, [result]);

  return (
    <div>
      <CommandHeader />

      <section className="mb-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.3em] text-orange-400">
              JUDGING / SIMULATION
            </p>

            <h1 className="mt-3 text-5xl font-bold tracking-tight text-white">
              Judging Simulator
            </h1>

            <p className="mt-4 max-w-2xl text-base font-medium leading-6 text-white/60">
              Stress-test judge allocation, workload balancing, and scoring
              behavior before running a live judging round.
            </p>
          </div>

          <div className="flex items-center gap-3 border border-white/15 bg-[#151310] px-4 py-3">
            <Activity size={15} className="text-orange-400" />

            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] text-white/45">
                SIMULATION TARGET
              </p>

              <p className="mt-1 text-sm font-medium text-white/70">
                {loading
                  ? "LOADING EVENT..."
                  : eventName || "RaptorOS Event"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-8 flex items-center gap-3 border border-red-500/25 bg-red-500/[0.05] px-6 py-4">
          <AlertCircle size={17} className="text-red-400" />

          <p className="text-sm font-semibold text-red-300">
            {error}
          </p>
        </div>
      )}

      <section className="mb-8 grid gap-px border border-white/15 bg-white/10 md:grid-cols-[1fr_220px_180px]">
        <div className="bg-[#151310] p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center border border-orange-500/30 text-orange-400">
              <Scale size={18} />
            </div>

            <div>
              <p className="text-[11px] font-semibold tracking-[0.2em] text-white/50">
                SIMULATION ENGINE
              </p>

              <p className="mt-2 text-sm font-medium text-white/70">
                Balanced judge assignment with randomized rubric scoring.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#151310] p-6">
          <label className="text-[11px] font-semibold tracking-[0.2em] text-white/50">
            JUDGES / PROJECT
          </label>

          <select
            value={judgesPerProject}
            onChange={(event) =>
              setJudgesPerProject(
                Math.min(
                  Math.max(Number(event.target.value) || 1, 1),
                  5
                )
              )
            }
            className="mt-3 w-full border border-white/15 bg-[#11100e] px-3 py-2 text-sm font-medium text-white/75 outline-none focus:border-orange-500/50"
          >
            <option value={1}>1 JUDGE</option>
            <option value={2}>2 JUDGES</option>
            <option value={3}>3 JUDGES</option>
            <option value={4}>4 JUDGES</option>
            <option value={5}>5 JUDGES</option>
          </select>
        </div>

        <div className="bg-[#151310] p-6">
          <button
            type="button"
            onClick={runSimulation}
            disabled={loading || running}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 bg-orange-500 px-4 py-3 text-[11px] font-bold tracking-[0.15em] text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                SIMULATING
              </>
            ) : (
              <>
                <Play size={15} />
                RUN SIMULATION
              </>
            )}
          </button>
        </div>
      </section>

      {!result && !running && (
        <section className="border border-white/10 bg-[#151310] p-12 text-center">
          <Gauge
            size={35}
            className="mx-auto text-white/35"
          />

          <h2 className="mt-5 text-xl font-semibold text-white/80">
            Simulation ready
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-white/50">
            Configure the number of judges assigned to each project, then
            run a simulated judging round.
          </p>
        </section>
      )}

      {running && (
        <section className="border border-orange-500/20 bg-orange-500/[0.03] p-10 text-center">
          <RefreshCw
            size={29}
            className="mx-auto animate-spin text-orange-400"
          />

          <p className="mt-5 text-[11px] font-semibold tracking-[0.25em] text-orange-400">
            RUNNING JUDGING SIMULATION
          </p>

          <p className="mt-2 text-sm font-medium text-white/50">
            Generating assignments and rubric scores...
          </p>
        </section>
      )}

      {result && !running && (
        <>
          <section className="mb-8 grid gap-px border border-white/15 bg-white/10 md:grid-cols-4">
            <div className="bg-[#151310] p-6">
              <p className="text-[11px] font-semibold tracking-[0.2em] text-white/50">
                PROJECTS
              </p>

              <p className="mt-3 font-mono text-3xl font-semibold text-white">
                {String(result.projectCount).padStart(2, "0")}
              </p>
            </div>

            <div className="bg-[#151310] p-6">
              <p className="text-[11px] font-semibold tracking-[0.2em] text-white/50">
                ASSIGNMENTS
              </p>

              <p className="mt-3 font-mono text-3xl font-semibold text-orange-400">
                {String(result.assignmentCount).padStart(2, "0")}
              </p>
            </div>

            <div className="bg-[#151310] p-6">
              <p className="text-[11px] font-semibold tracking-[0.2em] text-white/50">
                MEAN SCORE
              </p>

              <p className="mt-3 font-mono text-3xl font-semibold text-white">
                {averageScore.toFixed(2)}
              </p>
            </div>

            <div className="bg-[#151310] p-6">
              <p className="text-[11px] font-semibold tracking-[0.2em] text-white/50">
                PEAK SCORE
              </p>

              <p className="mt-3 font-mono text-3xl font-semibold text-white">
                {highestScore.toFixed(2)}
              </p>
            </div>
          </section>

          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            <section>
              <div className="mb-4 flex items-center gap-3">
                <BarChart3 size={16} className="text-orange-400" />

                <p className="text-[11px] font-semibold tracking-[0.25em] text-white/50">
                  PROJECT SCORE DISTRIBUTION
                </p>
              </div>

              <div className="border-l border-t border-white/10">
                {result.projects.map((project, index) => {
                  const percentage = Math.min(
                    Math.max(
                      (Number(project.averageScore) / 100) * 100,
                      0
                    ),
                    100
                  );

                  return (
                    <div
                      key={project.projectId}
                      className="border-b border-r border-white/10 bg-[#151310] p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-4">
                          <span className="font-mono text-[11px] font-semibold text-white/40">
                            #{String(index + 1).padStart(2, "0")}
                          </span>

                          <div className="min-w-0">
                            <p className="truncate text-base font-medium text-white/80">
                              {project.projectTitle}
                            </p>

                            <p className="mt-1 text-[11px] font-semibold text-white/40">
                              {project.judges.length} judges assigned
                            </p>
                          </div>
                        </div>

                        <span className="font-mono text-lg font-semibold text-orange-400">
                          {Number(project.averageScore).toFixed(2)}
                        </span>
                      </div>

                      <div className="mt-4 h-1 bg-white/5">
                        <div
                          className="h-full bg-orange-500 transition-all duration-700"
                          style={{
                            width: `${percentage}%`
                          }}
                        />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {project.judges.map((judge) => (
                          <span
                            key={`${project.projectId}-${judge.judgeId}`}
                            className="border border-white/10 px-2 py-1 text-[10px] font-medium text-white/50"
                          >
                            {judge.judgeName} ·{" "}
                            {Number(judge.totalScore).toFixed(2)}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center gap-3">
                <Users size={16} className="text-orange-400" />

                <p className="text-[11px] font-semibold tracking-[0.25em] text-white/50">
                  JUDGE WORKLOAD
                </p>
              </div>

              <div className="border border-white/10 bg-[#151310]">
                {result.judgeWorkload.map((judge, index) => {
                  const percentage =
                    workloadMaximum === 0
                      ? 0
                      : (Number(judge.workload) /
                          workloadMaximum) *
                        100;

                  return (
                    <div
                      key={judge.judgeId}
                      className="border-b border-white/10 p-5 last:border-b-0"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[11px] font-semibold text-white/40">
                            J-{String(index + 1).padStart(2, "0")}
                          </span>

                          <span className="text-sm font-medium text-white/70">
                            Judge {judge.judgeId}
                          </span>
                        </div>

                        <span className="font-mono text-sm font-semibold text-orange-400">
                          {judge.workload}
                        </span>
                      </div>

                      <div className="mt-3 h-1 bg-white/5">
                        <div
                          className="h-full bg-white/30 transition-all duration-700"
                          style={{
                            width: `${percentage}%`
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 border border-orange-500/20 bg-orange-500/[0.03] p-5">
                <p className="text-[10px] font-semibold tracking-[0.2em] text-orange-400">
                  SIMULATION NOTE
                </p>

                <p className="mt-3 text-sm font-medium leading-5 text-white/50">
                  Scores are synthetic and are not persisted as live
                  judgments. The simulator is intended to inspect assignment
                  balance and scoring behavior before an event run.
                </p>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export default JudgingSimulator;