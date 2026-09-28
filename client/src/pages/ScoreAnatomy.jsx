import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileSearch,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import CommandHeader from "../components/CommandHeader";
import api from "../services/api";

function ScoreAnatomy() {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedJudge, setExpandedJudge] = useState(null);

  useEffect(() => {
    const loadScoreExplanation = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(
          `/judging/explain/${projectId}`
        );

        setResult(response.data);

        if (response.data.judges?.length > 0) {
          setExpandedJudge(response.data.judges[0].judgeId);
        }
      } catch (error) {
        console.error("Failed to load score explanation:", error);

        setError(
          error.response?.data?.message ||
            "Unable to load score explanation."
        );
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadScoreExplanation();
    }
  }, [projectId]);

  if (loading) {
    return (
      <div>
        <CommandHeader />

        <div className="border border-white/10 bg-[#151310] px-6 py-10">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />

            <p className="text-[10px] tracking-[0.2em] text-white/40">
              RECONSTRUCTING SCORE...
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
        onClick={() => navigate(-1)}
        className="mb-8 flex items-center gap-2 text-[10px] tracking-[0.15em] text-white/40 transition hover:text-orange-500"
      >
        <ArrowLeft size={14} />
        BACK
      </button>

      <section className="mb-10">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-[10px] tracking-[0.3em] text-orange-500">
              SCORE / ANATOMY
            </p>

            <h1 className="mt-3 text-5xl font-semibold tracking-tight">
              Explain Score
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/40">
              Inspect exactly how every judge and rubric criterion
              contributed to this project's final raw score.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[10px] tracking-[0.15em] text-orange-500">
            <CheckCircle2 size={14} />
            AUDITABLE
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

      {result && (
        <>
          <section className="mb-8 grid gap-px border border-white/10 bg-white/10 md:grid-cols-3">
            <div className="bg-[#151310] p-6">
              <p className="text-[10px] tracking-[0.2em] text-white/30">
                JUDGES
              </p>

              <p className="mt-3 font-mono text-3xl">
                {String(result.judgeCount).padStart(2, "0")}
              </p>

              <p className="mt-2 text-[10px] tracking-wider text-white/25">
                SUBMITTED EVALUATIONS
              </p>
            </div>

            <div className="bg-[#151310] p-6">
              <p className="text-[10px] tracking-[0.2em] text-white/30">
                RAW AVERAGE
              </p>

              <p className="mt-3 font-mono text-3xl text-orange-500">
                {Number(result.rawAverage).toFixed(2)}
              </p>

              <p className="mt-2 text-[10px] tracking-wider text-white/25">
                BEFORE NORMALIZATION
              </p>
            </div>

            <div className="bg-[#151310] p-6">
              <p className="text-[10px] tracking-[0.2em] text-white/30">
                PROJECT
              </p>

              <p className="mt-3 font-mono text-xl">
                P-{String(result.projectId).padStart(3, "0")}
              </p>

              <p className="mt-2 text-[10px] tracking-wider text-white/25">
                PROJECT IDENTIFIER
              </p>
            </div>
          </section>

          <section className="mb-8 border border-orange-500/20 bg-[#151310]">
            <div className="border-b border-white/10 p-6">
              <div className="flex items-center gap-3">
                <FileSearch size={17} className="text-orange-500" />

                <div>
                  <p className="text-[10px] tracking-[0.25em] text-orange-500">
                    SCORE TRACE
                  </p>

                  <h2 className="mt-2 text-xl font-medium">
                    Judge Contributions
                  </h2>
                </div>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/40">
                Expand a judge to inspect every criterion, its raw score,
                weighting, and resulting weighted contribution.
              </p>
            </div>

            <div className="divide-y divide-white/10">
              {result.judges.map((judge, index) => {
                const expanded =
                  expandedJudge === judge.judgeId;

                return (
                  <div key={judge.judgeId}>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedJudge(
                          expanded ? null : judge.judgeId
                        )
                      }
                      className="flex w-full items-center justify-between gap-5 p-6 text-left transition hover:bg-white/[0.02]"
                    >
                      <div className="flex min-w-0 items-center gap-5">
                        <span className="font-mono text-xs text-white/20">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <div>
                          <p className="text-sm font-medium">
                            {judge.judgeName}
                          </p>

                          <p className="mt-1 text-[9px] tracking-[0.15em] text-white/25">
                            {judge.rubricName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-[9px] tracking-[0.15em] text-white/25">
                            TOTAL
                          </p>

                          <p className="mt-1 font-mono text-lg text-orange-500">
                            {Number(judge.totalScore).toFixed(2)}
                          </p>
                        </div>

                        {expanded ? (
                          <ChevronUp
                            size={16}
                            className="text-white/30"
                          />
                        ) : (
                          <ChevronDown
                            size={16}
                            className="text-white/30"
                          />
                        )}
                      </div>
                    </button>

                    {expanded && (
                      <div className="border-t border-white/10 bg-[#11100e] p-6">
                        <div className="mb-5 flex flex-wrap gap-5 text-[9px] tracking-[0.15em] text-white/25">
                          <span>
                            SUBMITTED{" "}
                            {judge.submittedAt
                              ? new Date(
                                  judge.submittedAt
                                ).toLocaleString()
                              : "—"}
                          </span>

                          <span>
                            CRITERIA {judge.criteria.length}
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <div className="min-w-[650px] border border-white/10">
                            <div className="grid grid-cols-[1.5fr_90px_90px_110px_120px] gap-4 border-b border-white/10 bg-[#151310] px-5 py-4">
                              <span className="text-[9px] tracking-[0.15em] text-white/25">
                                CRITERION
                              </span>

                              <span className="text-[9px] tracking-[0.15em] text-white/25">
                                WEIGHT
                              </span>

                              <span className="text-[9px] tracking-[0.15em] text-white/25">
                                MAX
                              </span>

                              <span className="text-[9px] tracking-[0.15em] text-white/25">
                                RAW
                              </span>

                              <span className="text-[9px] tracking-[0.15em] text-orange-500/70">
                                CONTRIBUTION
                              </span>
                            </div>

                            {judge.criteria.map((criterion) => (
                              <div
                                key={criterion.criterionId}
                                className="grid grid-cols-[1.5fr_90px_90px_110px_120px] gap-4 border-b border-white/10 px-5 py-5 last:border-b-0"
                              >
                                <div>
                                  <p className="text-sm text-white/70">
                                    {criterion.criterionName}
                                  </p>
                                </div>

                                <div>
                                  <p className="font-mono text-xs text-white/50">
                                    {Number(
                                      criterion.weight
                                    ).toFixed(1)}
                                  </p>
                                </div>

                                <div>
                                  <p className="font-mono text-xs text-white/50">
                                    {Number(
                                      criterion.maxScore
                                    ).toFixed(1)}
                                  </p>
                                </div>

                                <div>
                                  <p className="font-mono text-sm">
                                    {Number(
                                      criterion.rawScore
                                    ).toFixed(2)}
                                  </p>
                                </div>

                                <div>
                                  <p className="font-mono text-sm text-orange-500">
                                    {Number(
                                      criterion.weightedScore
                                    ).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            ))}

                            <div className="grid grid-cols-[1.5fr_90px_90px_110px_120px] gap-4 border-t border-orange-500/20 bg-orange-500/[0.03] px-5 py-5">
                              <span className="text-[9px] tracking-[0.15em] text-orange-500">
                                JUDGE TOTAL
                              </span>

                              <span />
                              <span />
                              <span />

                              <span className="font-mono text-lg text-orange-500">
                                {Number(
                                  judge.totalScore
                                ).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="border border-white/10 bg-[#151310] p-6">
            <p className="text-[10px] tracking-[0.25em] text-orange-500">
              SCORE FORMULA
            </p>

            <h2 className="mt-2 text-lg font-medium">
              How the raw score is constructed
            </h2>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="border border-white/10 p-5">
                <p className="text-[9px] tracking-[0.15em] text-white/25">
                  STEP 01
                </p>

                <p className="mt-3 text-sm text-white/60">
                  Judge assigns a raw score to each criterion.
                </p>
              </div>

              <div className="border border-white/10 p-5">
                <p className="text-[9px] tracking-[0.15em] text-white/25">
                  STEP 02
                </p>

                <p className="mt-3 text-sm text-white/60">
                  Each criterion is converted into its weighted contribution.
                </p>
              </div>

              <div className="border border-orange-500/20 bg-orange-500/[0.03] p-5">
                <p className="text-[9px] tracking-[0.15em] text-orange-500">
                  STEP 03
                </p>

                <p className="mt-3 text-sm text-white/60">
                  Weighted contributions are summed into the judge's total.
                </p>
              </div>
            </div>

            <div className="mt-5 border-l-2 border-orange-500 px-5 py-4">
              <p className="font-mono text-sm text-white/60">
                PROJECT RAW AVERAGE = Σ JUDGE TOTALS ÷ NUMBER OF JUDGES
              </p>

              <p className="mt-2 text-xs leading-5 text-white/30">
                This page explains the raw judging result. Final
                cross-judge normalization is handled separately in the
                Fairness Lab.
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default ScoreAnatomy;
