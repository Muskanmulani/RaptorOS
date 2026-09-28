import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  BrainCircuit,
  Search,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileSearch
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import CommandHeader from "../components/CommandHeader";
import api from "../services/api";

function formatAnalysis(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value, null, 2);
}

function ProjectReview() {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const [data, setData] = useState(null);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [evidenceQuery, setEvidenceQuery] = useState("");
  const [expandedCriterion, setExpandedCriterion] = useState(null);

  useEffect(() => {
    const loadProject = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(
          `/judging/project/${projectId}`
        );

        setData(response.data);

        const initialScores = {};

        response.data.rubric?.criteria?.forEach((criterion) => {
          initialScores[criterion.id] = "";
        });

        setScores(initialScores);
      } catch (error) {
        console.error("Failed to load project:", error);

        setError(
          error.response?.data?.message ||
            "Unable to load project judging data."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  const criteria = data?.rubric?.criteria || [];

  const totalScore = useMemo(() => {
    return criteria.reduce((total, criterion) => {
      const rawScore = Number(scores[criterion.id]);

      if (!Number.isFinite(rawScore)) {
        return total;
      }

      const maxScore = Number(criterion.maxScore);
      const weight = Number(criterion.weight);

      if (!maxScore || !weight) {
        return total;
      }

      return total + (rawScore / maxScore) * weight;
    }, 0);
  }, [criteria, scores]);

  const completedCriteria = criteria.filter((criterion) => {
    const value = Number(scores[criterion.id]);
    return Number.isFinite(value) && value >= 0;
  }).length;

  const handleScoreChange = (criterionId, value, maxScore) => {
    if (value === "") {
      setScores((current) => ({
        ...current,
        [criterionId]: ""
      }));

      return;
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return;
    }

    setScores((current) => ({
      ...current,
      [criterionId]: Math.min(
        Math.max(numericValue, 0),
        Number(maxScore)
      )
    }));
  };

  const runAiAnalysis = async () => {
    setAiLoading(true);
    setError("");

    try {
      const response = await api.get(
        `/jev/project/${projectId}/analyze`
      );

      setAiAnalysis(response.data);
    } catch (error) {
      console.error("Jev analysis failed:", error);

      setError(
        error.response?.data?.message ||
          "Raptor Intelligence could not analyze this project."
      );
    } finally {
      setAiLoading(false);
    }
  };

  const searchEvidence = async (query) => {
    const searchTerm =
      query?.trim() ||
      data?.project?.description?.slice(0, 120) ||
      "project implementation";

    setEvidenceLoading(true);
    setError("");

    try {
      const response = await api.get(
        `/jev/project/${projectId}/search`,
        {
          params: {
            query: searchTerm,
            limit: 6
          }
        }
      );

      setEvidence(response.data.evidence || []);
      setEvidenceQuery(searchTerm);
    } catch (error) {
      console.error("Evidence search failed:", error);

      setError(
        error.response?.data?.message ||
          "Evidence retrieval failed."
      );
    } finally {
      setEvidenceLoading(false);
    }
  };

  const analyzeCriterion = async (criterionId) => {
    setExpandedCriterion(criterionId);
    setError("");

    try {
      const response = await api.get(
        `/jev/project/${projectId}/criterion/${criterionId}`
      );

      setAiAnalysis((current) => ({
        ...(current || {}),
        criterionAnalyses: {
          ...(current?.criterionAnalyses || {}),
          [criterionId]: response.data.analysis
        }
      }));
    } catch (error) {
      console.error("Criterion analysis failed:", error);

      setError(
        error.response?.data?.message ||
          "Criterion analysis failed."
      );
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!data?.rubric?.id) {
      setError("No judging rubric is available for this project.");
      return;
    }

    const incomplete = criteria.some((criterion) => {
      const value = Number(scores[criterion.id]);

      return (
        !Number.isFinite(value) ||
        value < 0 ||
        value > Number(criterion.maxScore)
      );
    });

    if (incomplete) {
      setError("A valid score is required for every criterion.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        projectId: projectId,
        rubricId: data.rubric.id,
        scores: criteria.map((criterion) => ({
          criterionId: criterion.id,
          rawScore: Number(scores[criterion.id])
        }))
      };

      const response = await api.post(
        "/judging/judgments",
        payload
      );

      setSuccess(
        `Judgment submitted successfully. Final score: ${Number(
          response.data.totalScore
        ).toFixed(2)}`
      );
    } catch (error) {
      console.error("Failed to submit judgment:", error);

      setError(
        error.response?.data?.message ||
          "Failed to submit judgment."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <CommandHeader />

        <div className="border border-white/10 bg-[#151310] px-6 py-10">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />

            <p className="text-[10px] tracking-[0.2em] text-white/40">
              LOADING PROJECT EVIDENCE...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div>
        <CommandHeader />

        <button
          type="button"
          onClick={() => navigate("/judge")}
          className="mb-8 flex items-center gap-2 text-[10px] tracking-[0.15em] text-white/40 transition hover:text-orange-500"
        >
          <ArrowLeft size={14} />
          BACK TO JUDGING DESK
        </button>

        <div className="flex items-center gap-3 border border-red-500/20 bg-red-500/[0.04] px-6 py-5">
          <AlertCircle size={16} className="text-red-400" />

          <p className="text-sm text-red-300">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <CommandHeader />

      <button
        type="button"
        onClick={() => navigate("/judge")}
        className="mb-8 flex items-center gap-2 text-[10px] tracking-[0.15em] text-white/40 transition hover:text-orange-500"
      >
        <ArrowLeft size={14} />
        BACK TO JUDGING DESK
      </button>

      <section className="mb-10">
        <p className="text-[10px] tracking-[0.3em] text-orange-500">
          JUDGING / REVIEW
        </p>

        <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              {data?.project?.title}
            </h1>

            <p className="mt-3 text-sm text-white/40">
              {data?.project?.team_name}
            </p>

            {data?.project?.tagline && (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
                {data.project.tagline}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/judge/project/${projectId}/explain`
                )
              }
              className="flex items-center gap-2 border border-white/10 bg-[#151310] px-4 py-3 text-[10px] tracking-[0.15em] text-white/50 transition hover:border-orange-500/40 hover:text-orange-500"
            >
              <FileSearch size={14} />
              EXPLAIN SCORE
            </button>

            <div className="border border-white/10 bg-[#151310] px-5 py-4">
              <p className="text-[9px] tracking-[0.2em] text-white/30">
                LIVE SCORE
              </p>

              <p className="mt-2 font-mono text-3xl text-orange-500">
                {totalScore.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-6 flex items-center gap-3 border border-red-500/20 bg-red-500/[0.04] px-6 py-4">
          <AlertCircle size={16} className="text-red-400" />

          <p className="text-sm text-red-300">
            {error}
          </p>
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-center gap-3 border border-orange-500/20 bg-orange-500/[0.04] px-6 py-4">
          <CheckCircle2 size={16} className="text-orange-500" />

          <p className="text-sm text-orange-400">
            {success}
          </p>
        </div>
      )}

      <section className="mb-8 grid gap-px border border-white/10 bg-white/10 md:grid-cols-3">
        <div className="bg-[#151310] p-6">
          <p className="text-[10px] tracking-[0.2em] text-white/30">
            RUBRIC
          </p>

          <p className="mt-3 text-sm font-medium">
            {data?.rubric?.name || "No rubric"}
          </p>
        </div>

        <div className="bg-[#151310] p-6">
          <p className="text-[10px] tracking-[0.2em] text-white/30">
            CRITERIA
          </p>

          <p className="mt-3 font-mono text-3xl">
            {criteria.length}
          </p>
        </div>

        <div className="bg-[#151310] p-6">
          <p className="text-[10px] tracking-[0.2em] text-white/30">
            EVALUATED
          </p>

          <p className="mt-3 font-mono text-3xl text-orange-500">
            {completedCriteria}/{criteria.length}
          </p>
        </div>
      </section>

      <section className="mb-8 border border-orange-500/20 bg-[#151310]">
        <div className="flex flex-col gap-5 border-b border-white/10 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-orange-500/30 bg-orange-500/[0.06]">
              <BrainCircuit size={19} className="text-orange-500" />
            </div>

            <div>
              <p className="text-[10px] tracking-[0.25em] text-orange-500">
                RAPTOR INTELLIGENCE
              </p>

              <h2 className="mt-1 text-xl font-medium">
                Evidence-assisted review
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
                Retrieve project evidence and analyze it against the judging
                rubric before making your human scoring decision.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={runAiAnalysis}
            disabled={aiLoading}
            className="flex items-center justify-center gap-2 border border-orange-500/40 bg-orange-500/10 px-5 py-3 text-[10px] tracking-[0.15em] text-orange-500 transition hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles size={14} />

            {aiLoading
              ? "ANALYZING..."
              : "ANALYZE PROJECT"}
          </button>
        </div>

        <div className="grid gap-px bg-white/10 md:grid-cols-[1fr_1fr]">
          <div className="bg-[#11100e] p-6">
            <div className="flex items-center gap-2">
              <Search size={14} className="text-orange-500" />

              <p className="text-[10px] tracking-[0.2em] text-white/40">
                EVIDENCE RETRIEVAL
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={evidenceQuery}
                onChange={(event) =>
                  setEvidenceQuery(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    searchEvidence(evidenceQuery);
                  }
                }}
                placeholder="Search project evidence..."
                className="min-w-0 flex-1 border border-white/10 bg-[#151310] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-orange-500/40"
              />

              <button
                type="button"
                onClick={() => searchEvidence(evidenceQuery)}
                disabled={evidenceLoading}
                className="flex items-center justify-center gap-2 border border-white/10 px-4 py-3 text-[10px] tracking-[0.15em] text-white/50 transition hover:border-orange-500/40 hover:text-orange-500 disabled:opacity-50"
              >
                {evidenceLoading ? "SEARCHING" : "RETRIEVE"}
              </button>
            </div>

            {evidence.length > 0 && (
              <div className="mt-5 space-y-3">
                {evidence.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="border border-white/10 bg-[#151310] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[9px] text-orange-500">
                        EVIDENCE {String(index + 1).padStart(2, "0")}
                      </span>

                      {item.score !== undefined && (
                        <span className="font-mono text-[9px] text-white/30">
                          {Number(item.score).toFixed(3)}
                        </span>
                      )}
                    </div>

                    <p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-white/50">
                      {item.content ||
                        item.text ||
                        item.chunk ||
                        formatAnalysis(item)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {!evidenceLoading && evidence.length === 0 && (
              <p className="mt-5 text-xs leading-6 text-white/25">
                Search the indexed project evidence to retrieve relevant
                material for the judge.
              </p>
            )}
          </div>

          <div className="bg-[#151310] p-6">
            <div className="flex items-center gap-2">
              <BrainCircuit size={14} className="text-orange-500" />

              <p className="text-[10px] tracking-[0.2em] text-white/40">
                JEV ANALYSIS
              </p>
            </div>

            {!aiAnalysis && (
              <div className="mt-5 border border-white/10 p-5">
                <p className="text-sm text-white/40">
                  Run project analysis to inspect rubric-aware evidence
                  signals.
                </p>
              </div>
            )}

            {aiAnalysis && (
              <div className="mt-5">
                <div className="border border-orange-500/20 bg-orange-500/[0.03] p-5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={15} className="text-orange-500" />

                    <p className="text-[10px] tracking-[0.15em] text-orange-500">
                      HUMAN DECISION REQUIRED
                    </p>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-white/50">
                    Raptor Intelligence provides evidence and analysis only.
                    The judge remains responsible for the final score.
                  </p>
                </div>

                <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap border border-white/10 bg-[#11100e] p-5 font-mono text-[10px] leading-6 text-white/40">
                  {formatAnalysis(
                    aiAnalysis.analysis || aiAnalysis
                  )}
                </pre>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mb-8 border border-white/10 bg-[#151310]">
        <div className="border-b border-white/10 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] tracking-[0.25em] text-orange-500">
                PROJECT EVIDENCE
              </p>

              <h2 className="mt-2 text-xl font-medium">
                Submission
              </h2>
            </div>

            {data?.latestSubmission && (
              <span className="font-mono text-[10px] text-white/30">
                VERSION {data.latestSubmission.version}
              </span>
            )}
          </div>
        </div>

        <div className="p-6">
          <p className="max-w-4xl text-sm leading-7 text-white/50">
            {data?.project?.description ||
              "No project description provided."}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {data?.project?.repository_url && (
              <a
                href={data.project.repository_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 border border-white/10 px-4 py-3 text-[10px] tracking-[0.15em] text-white/50 transition hover:border-orange-500/40 hover:text-orange-500"
              >
                REPOSITORY
                <ExternalLink size={13} />
              </a>
            )}

            {data?.project?.demo_url && (
              <a
                href={data.project.demo_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 border border-white/10 px-4 py-3 text-[10px] tracking-[0.15em] text-white/50 transition hover:border-orange-500/40 hover:text-orange-500"
              >
                LIVE DEMO
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        </div>
      </section>

      {!data?.rubric && (
        <div className="mb-8 border border-yellow-500/20 bg-yellow-500/[0.03] px-6 py-5">
          <p className="text-sm text-yellow-300">
            No rubric has been configured for this event yet.
          </p>
        </div>
      )}

      {data?.rubric && (
        <form onSubmit={handleSubmit}>
          <section className="border-l border-t border-white/10">
            {criteria.map((criterion, index) => {
              const value = scores[criterion.id];
              const isExpanded = expandedCriterion === criterion.id;
              const criterionAnalysis =
                aiAnalysis?.criterionAnalyses?.[criterion.id];

              return (
                <div
                  key={criterion.id}
                  className="border-b border-r border-white/10 transition hover:bg-white/[0.015]"
                >
                  <div className="p-6">
                    <div className="grid gap-6 md:grid-cols-[70px_1fr_150px] md:items-start">
                      <span className="font-mono text-xs text-white/20">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-lg font-medium">
                            {criterion.name}
                          </h2>

                          <span className="font-mono text-[10px] text-orange-500">
                            WT {Number(criterion.weight).toFixed(0)}
                          </span>
                        </div>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
                          {criterion.description ||
                            "Evaluate this criterion based on the submitted project evidence."}
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            isExpanded
                              ? setExpandedCriterion(null)
                              : analyzeCriterion(criterion.id)
                          }
                          className="mt-4 flex items-center gap-2 text-[9px] tracking-[0.15em] text-orange-500/70 transition hover:text-orange-500"
                        >
                          <BrainCircuit size={13} />

                          {criterionAnalysis
                            ? "HIDE JEV ANALYSIS"
                            : "ANALYZE WITH JEV"}

                          {isExpanded ? (
                            <ChevronUp size={13} />
                          ) : (
                            <ChevronDown size={13} />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="mt-4 border border-orange-500/20 bg-orange-500/[0.025] p-5">
                            <div className="flex items-center gap-2">
                              <Sparkles
                                size={13}
                                className="text-orange-500"
                              />

                              <p className="text-[9px] tracking-[0.2em] text-orange-500">
                                CRITERION ANALYSIS
                              </p>
                            </div>

                            {criterionAnalysis ? (
                              <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap font-mono text-[10px] leading-6 text-white/40">
                                {formatAnalysis(criterionAnalysis)}
                              </pre>
                            ) : (
                              <p className="mt-4 text-xs text-white/30">
                                Loading criterion evidence...
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor={`criterion-${criterion.id}`}
                          className="text-[9px] tracking-[0.2em] text-white/30"
                        >
                          SCORE / {criterion.maxScore}
                        </label>

                        <input
                          id={`criterion-${criterion.id}`}
                          type="number"
                          min="0"
                          max={criterion.maxScore}
                          step="0.1"
                          value={value}
                          onChange={(event) =>
                            handleScoreChange(
                              criterion.id,
                              event.target.value,
                              criterion.maxScore
                            )
                          }
                          className="mt-2 w-full border border-white/10 bg-[#11100e] px-4 py-3 font-mono text-lg text-white outline-none transition focus:border-orange-500/50"
                          required
                        />

                        <p className="mt-2 text-[9px] text-white/20">
                          Weight contributes to final score
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="mt-8 flex flex-col gap-5 border border-white/10 bg-[#151310] p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] tracking-[0.2em] text-white/30">
                FINAL WEIGHTED SCORE
              </p>

              <p className="mt-2 font-mono text-4xl text-orange-500">
                {totalScore.toFixed(2)}
              </p>
            </div>

            <button
              type="submit"
              disabled={
                submitting ||
                completedCriteria !== criteria.length
              }
              className="flex items-center justify-center gap-3 border border-orange-500/40 bg-orange-500/10 px-7 py-4 text-[10px] tracking-[0.2em] text-orange-500 transition hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-transparent disabled:text-white/20"
            >
              {submitting
                ? "SUBMITTING JUDGMENT..."
                : "SUBMIT JUDGMENT"}

              {!submitting && <ArrowLeft size={14} />}
            </button>
          </section>
        </form>
      )}
    </div>
  );
}

export default ProjectReview;