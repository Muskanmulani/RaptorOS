import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Scale,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import CommandHeader from "../components/CommandHeader";
import api from "../services/api";

function FairnessLab() {
  const navigate = useNavigate();

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedProject, setExpandedProject] = useState(null);

  useEffect(() => {
    const loadResults = async () => {
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
          setError("No event is available for normalization.");
          return;
        }

        const response = await api.get(
          `/judging/results/${eventId}`
        );

        setResults(response.data);
      } catch (error) {
        console.error("Failed to load normalized results:", error);

        setError(
          error.response?.data?.message ||
            "Unable to calculate normalized results."
        );
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, []);

  const projects = results?.projects || [];
  const judgeStatistics = results?.judgeStatistics || [];

  const averageRawScore = useMemo(() => {
    if (projects.length === 0) {
      return 0;
    }

    return (
      projects.reduce(
        (sum, project) => sum + Number(project.rawAverage),
        0
      ) / projects.length
    );
  }, [projects]);

  const averageNormalizedScore = useMemo(() => {
    if (projects.length === 0) {
      return 0;
    }

    return (
      projects.reduce(
        (sum, project) =>
          sum + Number(project.normalizedAverage),
        0
      ) / projects.length
    );
  }, [projects]);

  if (loading) {
    return (
      <div>
        <CommandHeader />

        <div className="border border-white/10 bg-[#151310] px-6 py-10">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />

            <p className="text-[10px] tracking-[0.2em] text-white/40">
              CALCULATING FAIRNESS MODEL...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <CommandHeader />

      <button
        type="button"
        onClick={() => navigate("/control-room")}
        className="mb-8 flex items-center gap-2 text-[10px] tracking-[0.15em] text-white/40 transition hover:text-orange-500"
      >
        <ArrowLeft size={14} />
        BACK TO CONTROL ROOM
      </button>

      <section className="mb-10">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-[10px] tracking-[0.3em] text-orange-500">
              FAIRNESS / LAB
            </p>

            <h1 className="mt-3 text-5xl font-semibold tracking-tight">
              Fairness Lab
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/40">
              Inspect how judge scoring patterns are normalized before
              final results are compared.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[10px] tracking-[0.15em] text-orange-500">
            <CheckCircle2 size={14} />
            ENGINE ONLINE
          </div>
        </div>
      </section>

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
          <div className="flex items-center justify-between">
            <p className="text-[10px] tracking-[0.2em] text-white/30">
              JUDGES
            </p>

            <Scale size={16} className="text-orange-500/70" />
          </div>

          <p className="mt-4 font-mono text-3xl">
            {String(judgeStatistics.length).padStart(2, "0")}
          </p>

          <p className="mt-2 text-[10px] tracking-wider text-white/25">
            CALIBRATED
          </p>
        </div>

        <div className="bg-[#151310] p-6">
          <div className="flex items-center justify-between">
            <p className="text-[10px] tracking-[0.2em] text-white/30">
              PROJECTS
            </p>

            <BarChart3 size={16} className="text-orange-500/70" />
          </div>

          <p className="mt-4 font-mono text-3xl">
            {String(projects.length).padStart(2, "0")}
          </p>

          <p className="mt-2 text-[10px] tracking-wider text-white/25">
            NORMALIZED
          </p>
        </div>

        <div className="bg-[#151310] p-6">
          <div className="flex items-center justify-between">
            <p className="text-[10px] tracking-[0.2em] text-white/30">
              METHOD
            </p>

            <ShieldCheck size={16} className="text-orange-500/70" />
          </div>

          <p className="mt-4 text-lg font-medium">
            Z-SCORE
          </p>

          <p className="mt-2 text-[10px] tracking-wider text-orange-500/70">
            JUDGE NORMALIZATION
          </p>
        </div>
      </section>

      <section className="mb-8 border border-orange-500/20 bg-[#151310]">
        <div className="border-b border-white/10 p-6">
          <p className="text-[10px] tracking-[0.25em] text-orange-500">
            NORMALIZATION ENGINE
          </p>

          <h2 className="mt-2 text-xl font-medium">
            Judge Calibration
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
            Each judge is calibrated using their scoring mean and standard
            deviation. This reduces the effect of consistently strict or
            generous scoring patterns.
          </p>
        </div>

        <div className="grid gap-px bg-white/10 md:grid-cols-2 lg:grid-cols-3">
          {judgeStatistics.map((judge) => (
            <div
              key={judge.judgeId}
              className="bg-[#11100e] p-6"
            >
              <p className="text-[9px] tracking-[0.2em] text-white/25">
                JUDGE {String(judge.judgeId).padStart(2, "0")}
              </p>

              <h3 className="mt-3 text-sm font-medium">
                {judge.judgeName || "Judge"}
              </h3>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="border border-white/10 bg-[#151310] p-3">
                  <p className="text-[9px] tracking-wider text-white/25">
                    MEAN
                  </p>

                  <p className="mt-2 font-mono text-lg">
                    {Number(judge.mean).toFixed(2)}
                  </p>
                </div>

                <div className="border border-white/10 bg-[#151310] p-3">
                  <p className="text-[9px] tracking-wider text-white/25">
                    STD DEV
                  </p>

                  <p className="mt-2 font-mono text-lg">
                    {Number(judge.standardDeviation).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 border border-white/10 bg-[#151310]">
        <div className="border-b border-white/10 p-6">
          <p className="text-[10px] tracking-[0.25em] text-orange-500">
            PROJECT RESULTS
          </p>

          <h2 className="mt-2 text-xl font-medium">
            Raw vs Normalized
          </h2>
        </div>

        <div className="hidden border-b border-white/10 px-6 py-4 md:grid md:grid-cols-[1fr_100px_140px_160px_40px] md:gap-5">
          <span className="text-[9px] tracking-[0.2em] text-white/25">
            PROJECT
          </span>

          <span className="text-[9px] tracking-[0.2em] text-white/25">
            JUDGES
          </span>

          <span className="text-[9px] tracking-[0.2em] text-white/25">
            RAW AVG
          </span>

          <span className="text-[9px] tracking-[0.2em] text-white/25">
            NORMALIZED
          </span>

          <span />
        </div>

        <div className="divide-y divide-white/10">
          {projects.map((project, index) => {
            const isExpanded =
              expandedProject === project.projectId;

            const difference =
              Number(project.normalizedAverage) -
              Number(project.rawAverage);

            return (
              <div key={project.projectId}>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedProject(
                      isExpanded ? null : project.projectId
                    )
                  }
                  className="grid w-full gap-4 p-6 text-left transition hover:bg-white/[0.02] md:grid-cols-[1fr_100px_140px_160px_40px] md:items-center md:gap-5"
                >
                  <div>
                    <span className="font-mono text-[9px] text-white/20">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <p className="mt-1 text-sm font-medium">
                      {project.projectTitle}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] tracking-wider text-white/25 md:hidden">
                      JUDGES
                    </p>

                    <p className="mt-1 font-mono text-sm">
                      {project.judgeCount}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] tracking-wider text-white/25 md:hidden">
                      RAW AVERAGE
                    </p>

                    <p className="mt-1 font-mono text-sm text-white/50">
                      {Number(project.rawAverage).toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] tracking-wider text-white/25 md:hidden">
                      NORMALIZED
                    </p>

                    <p className="mt-1 font-mono text-lg text-orange-500">
                      {Number(project.normalizedAverage).toFixed(2)}
                    </p>
                  </div>

                  <div className="text-white/30">
                    {isExpanded ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-white/10 bg-[#11100e] p-6">
                    <div className="mb-5 grid gap-3 md:grid-cols-3">
                      <div className="border border-white/10 bg-[#151310] p-4">
                        <p className="text-[9px] tracking-[0.15em] text-white/25">
                          RAW AVERAGE
                        </p>

                        <p className="mt-2 font-mono text-2xl">
                          {Number(project.rawAverage).toFixed(2)}
                        </p>
                      </div>

                      <div className="border border-orange-500/20 bg-orange-500/[0.03] p-4">
                        <p className="text-[9px] tracking-[0.15em] text-orange-500/70">
                          NORMALIZED AVERAGE
                        </p>

                        <p className="mt-2 font-mono text-2xl text-orange-500">
                          {Number(
                            project.normalizedAverage
                          ).toFixed(2)}
                        </p>
                      </div>

                      <div className="border border-white/10 bg-[#151310] p-4">
                        <p className="text-[9px] tracking-[0.15em] text-white/25">
                          ADJUSTMENT
                        </p>

                        <p className="mt-2 font-mono text-2xl">
                          {difference >= 0 ? "+" : ""}
                          {difference.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <p className="mb-4 text-[9px] tracking-[0.2em] text-white/25">
                      JUDGE SCORE TRANSFORMATION
                    </p>

                    <div className="grid gap-px border border-white/10 bg-white/10">
                      {project.judges.map((judge) => (
                        <div
                          key={judge.judgeId}
                          className="grid gap-4 bg-[#151310] p-4 md:grid-cols-[1fr_140px_40px_140px] md:items-center"
                        >
                          <div>
                            <p className="text-sm text-white/60">
                              {judge.judgeName}
                            </p>
                          </div>

                          <div>
                            <p className="text-[9px] tracking-wider text-white/25">
                              RAW SCORE
                            </p>

                            <p className="mt-1 font-mono text-sm">
                              {Number(judge.rawScore).toFixed(2)}
                            </p>
                          </div>

                          <div className="text-orange-500">
                            →
                          </div>

                          <div>
                            <p className="text-[9px] tracking-wider text-orange-500/60">
                              NORMALIZED
                            </p>

                            <p className="mt-1 font-mono text-sm text-orange-500">
                              {Number(
                                judge.normalizedScore
                              ).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {projects.length === 0 && (
            <div className="p-10 text-center">
              <p className="text-sm text-white/30">
                No completed judgments are available for normalization yet.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="border border-white/10 bg-[#151310] p-6">
        <div className="flex items-start gap-4">
          <ShieldCheck
            size={18}
            className="mt-0.5 shrink-0 text-orange-500"
          />

          <div>
            <p className="text-[10px] tracking-[0.2em] text-orange-500">
              FAIRNESS PROOF
            </p>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/40">
              Normalization is calculated independently for each judge using
              their observed scoring distribution. The resulting project
              averages can be inspected alongside the original raw scores,
              making the transformation auditable rather than opaque.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="border border-white/10 p-4">
                <p className="text-[9px] tracking-[0.15em] text-white/25">
                  EVENT RAW MEAN
                </p>

                <p className="mt-2 font-mono text-xl">
                  {averageRawScore.toFixed(2)}
                </p>
              </div>

              <div className="border border-orange-500/20 bg-orange-500/[0.03] p-4">
                <p className="text-[9px] tracking-[0.15em] text-orange-500/70">
                  EVENT NORMALIZED MEAN
                </p>

                <p className="mt-2 font-mono text-xl text-orange-500">
                  {averageNormalizedScore.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default FairnessLab;