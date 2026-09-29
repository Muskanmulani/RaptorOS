import { useEffect, useState } from "react";
import CommandHeader from "../components/CommandHeader";
import api from "../services/api";
import {
  Activity,
  AlertTriangle,
  Radio,
  Zap,
  ArrowUpRight,
  Gavel,
  FolderKanban
} from "lucide-react";

function Dashboard() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [judgeData, setJudgeData] = useState([]);
  const [assignmentData, setAssignmentData] = useState([]);
  const [projectData, setProjectData] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const storedEventId = localStorage.getItem("raptoros_event_id");

        let eventId = storedEventId;

        if (!eventId) {
          const eventsResponse = await api.get("/events");
          const events =
            eventsResponse.data?.events || eventsResponse.data || [];

          if (events.length > 0) {
            eventId = events[0].id;
            localStorage.setItem("raptoros_event_id", eventId);
          }
        }

        if (!eventId) {
          return;
        }

        const [
          healthResponse,
          judgesResponse,
          assignmentsResponse,
          projectsResponse
        ] = await Promise.all([
          api.get(`/health/${eventId}`),
          api.get("/judging/judges"),
          api.get(`/judging/assignments?eventId=${eventId}`),
          api.get(`/projects?eventId=${eventId}&limit=50`)
        ]);

        setHealth(healthResponse.data);
        setJudgeData(judgesResponse.data?.judges || []);
        setAssignmentData(assignmentsResponse.data?.assignments || []);
        setProjectData(projectsResponse.data?.projects || []);
      } catch (error) {
        console.error("Dashboard load error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const totalProjects = health?.submissions?.totalProjects ?? 0;
  const submittedProjects =
    health?.submissions?.submittedProjects ?? 0;
  const submissionPercentage =
    health?.submissions?.submissionPercentage ?? 0;

  const activeJudges = health?.judging?.activeJudges ?? 0;
  const judgingCompletion =
    health?.judging?.judgingCompletion ?? 0;
  const activeConflicts =
    health?.integrity?.activeConflicts ?? 0;

  const stats = [
    {
      code: "01",
      label: "PROJECTS",
      value: String(totalProjects).padStart(3, "0"),
      detail: "REGISTERED"
    },
    {
      code: "02",
      label: "SUBMISSIONS",
      value: String(submittedProjects).padStart(3, "0"),
      detail: `${submissionPercentage}% COMPLETE`
    },
    {
      code: "03",
      label: "JUDGES",
      value: String(activeJudges).padStart(3, "0"),
      detail: "ACTIVE"
    },
    {
      code: "04",
      label: "JUDGING",
      value: `${String(
        Math.round(judgingCompletion)
      ).padStart(2, "0")}%`,
      detail: "IN PROGRESS"
    }
  ];

  const nodes = [
    { className: "left-[27%] top-[34%]", delay: "0s" },
    { className: "left-[68%] top-[27%]", delay: "0.4s" },
    { className: "left-[59%] top-[70%]", delay: "0.8s" },
    { className: "left-[33%] top-[67%]", delay: "1.1s" },
    { className: "left-[48%] top-[48%]", delay: "0.2s" }
  ];

  const signals = [
    {
      code: "SIG-01",
      title: `${health?.judging?.unassignedProjects ?? 3} projects need judge coverage`,
      source: "ASSIGNMENT ENGINE",
      level:
        (health?.judging?.unassignedProjects ?? 3) > 0
          ? "HIGH"
          : "CLEAR"
    },
    {
      code: "SIG-02",
      title: "Judge workload monitoring active",
      source: "FAIRNESS MONITOR",
      level: "MEDIUM"
    },
    {
      code: "SIG-03",
      title: `${activeConflicts} assignment conflict detected`,
      source: "INTEGRITY MONITOR",
      level:
        activeConflicts > 0 ? "CRITICAL" : "CLEAR"
    }
  ];

  const judges = judgeData.map((judge) => {
    const judgeAssignments = assignmentData.filter(
      (assignment) => assignment.judge_id === judge.id
    );

    return {
      id: judge.id,
      name: judge.name,
      load: 0,
      projects: judgeAssignments.length,
      status: "ACTIVE"
    };
  });

  const projects = projectData.map((project) => {
    const projectAssignments = assignmentData.filter(
      (assignment) => assignment.project_id === project.id
    );

    return {
      id: project.id,
      name: project.title,
      score: "—",
      coverage: `${projectAssignments.length}/${activeJudges}`
    };
  });

  const submissionFlow =
    health?.submissions?.submissionPercentage ?? 87;

  const judgingCoverage =
    health?.judging?.judgingCompletion ?? 74;

  const integrity = activeConflicts > 0 ? 0 : 100;

  return (
    <div>
      <CommandHeader />

      <section className="mb-12">
        <p className="text-[11px] font-semibold tracking-[0.3em] text-orange-500">
          COMMAND / 01
        </p>

        <h1 className="mt-3 text-5xl font-semibold tracking-tight">
          Event Overview
        </h1>

        <p className="mt-4 max-w-xl text-[15px] font-medium leading-7 text-white/50">
          A live operational view of submissions, judging coverage,
          event activity, and system integrity.
        </p>

        {loading && (
          <p className="mt-3 font-mono text-[10px] font-medium tracking-[0.2em] text-orange-500/60">
            SYNCHRONIZING EVENT DATA...
          </p>
        )}
      </section>

      <section className="grid border-l border-t border-white/10 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.code}
            className="group border-b border-r border-white/10 p-6 transition duration-300 hover:bg-orange-500/[0.025]"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold text-white/30">
                {stat.code}
              </span>

              <span
                className="h-1.5 w-1.5 rounded-full bg-orange-500"
                style={{
                  animation: "statusPulse 2s ease-in-out infinite"
                }}
              />
            </div>

            <p className="mt-8 text-[11px] font-semibold tracking-[0.2em] text-white/40">
              {stat.label}
            </p>

            <p className="mt-2 font-mono text-4xl font-medium tracking-tight text-[#f4efe6]">
              {stat.value}
            </p>

            <p className="mt-3 text-[11px] font-semibold tracking-wider text-orange-500/80">
              {stat.detail}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-10 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="relative overflow-hidden border border-white/10 bg-[#151310] p-6">
          <div className="absolute inset-0 opacity-30">
            <div
              className="h-full w-full"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
                backgroundSize: "36px 36px"
              }}
            />
          </div>

          <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-5">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.25em] text-orange-500">
                EVENT PULSE
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Live Activity Field
              </h2>
            </div>

            <div className="flex items-center gap-2 border border-orange-500/20 px-3 py-1.5">
              <Radio size={13} className="text-orange-500" />

              <span className="text-[10px] font-semibold tracking-[0.18em] text-orange-500">
                LIVE
              </span>
            </div>
          </div>

          <div className="relative z-10 flex min-h-[330px] items-center justify-center">
            <div className="relative h-64 w-64 rounded-full border border-white/10">
              <div className="absolute inset-7 rounded-full border border-white/10" />

              <div className="absolute inset-16 rounded-full border border-white/10" />

              <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/5" />

              <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/5" />

              <div
                className="absolute inset-2 rounded-full"
                style={{
                  background:
                    "conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(249,115,22,0.45) 315deg, transparent 345deg)",
                  animation: "raptorSpin 4s linear infinite"
                }}
              />

              <svg
                className="absolute inset-0 h-full w-full overflow-visible"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <line
                  x1="27"
                  y1="34"
                  x2="48"
                  y2="48"
                  stroke="rgba(249,115,22,0.18)"
                  strokeWidth="0.35"
                />

                <line
                  x1="68"
                  y1="27"
                  x2="48"
                  y2="48"
                  stroke="rgba(249,115,22,0.18)"
                  strokeWidth="0.35"
                />

                <line
                  x1="59"
                  y1="70"
                  x2="48"
                  y2="48"
                  stroke="rgba(249,115,22,0.18)"
                  strokeWidth="0.35"
                />

                <line
                  x1="33"
                  y1="67"
                  x2="48"
                  y2="48"
                  stroke="rgba(249,115,22,0.18)"
                  strokeWidth="0.35"
                />

                <circle r="0.9" fill="#f97316">
                  <animateMotion
                    dur="2.4s"
                    repeatCount="indefinite"
                    path="M 27 34 L 48 48"
                  />
                </circle>

                <circle r="0.9" fill="#f97316">
                  <animateMotion
                    dur="3s"
                    repeatCount="indefinite"
                    path="M 68 27 L 48 48"
                  />
                </circle>

                <circle r="0.9" fill="#f97316">
                  <animateMotion
                    dur="2.7s"
                    repeatCount="indefinite"
                    path="M 59 70 L 48 48"
                  />
                </circle>

                <circle r="0.9" fill="#f97316">
                  <animateMotion
                    dur="3.2s"
                    repeatCount="indefinite"
                    path="M 33 67 L 48 48"
                  />
                </circle>
              </svg>

              {nodes.map((node, index) => (
                <span
                  key={index}
                  className={`absolute ${node.className} h-2.5 w-2.5 rounded-full bg-orange-500`}
                  style={{
                    animation:
                      "raptorPulse 1.8s ease-in-out infinite",
                    animationDelay: node.delay,
                    boxShadow:
                      "0 0 0 5px rgba(249,115,22,0.08)"
                  }}
                />
              ))}

              <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2">
                <div
                  className="absolute inset-0 rounded-full border border-orange-500/10"
                  style={{
                    animation: "corePulse 2.4s ease-out infinite"
                  }}
                />

                <div
                  className="absolute inset-3 rounded-full border border-orange-500/20"
                  style={{
                    animation:
                      "corePulse 2.4s ease-out infinite 0.8s"
                  }}
                />

                <div
                  className="absolute inset-7 rounded-full border border-orange-500/30"
                  style={{
                    animation:
                      "corePulse 2.4s ease-out infinite 1.6s"
                  }}
                />

                <div
                  className="absolute inset-10 rounded-full border border-orange-500/40"
                  style={{
                    animation: "coreGlow 2s ease-in-out infinite"
                  }}
                />

                <div className="absolute inset-[42px] rounded-full bg-orange-500 shadow-[0_0_25px_rgba(249,115,22,0.8)]" />

                <div
                  className="absolute inset-0"
                  style={{
                    animation: "orbit 3s linear infinite"
                  }}
                >
                  <div className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-orange-300 shadow-[0_0_8px_rgba(249,115,22,0.9)]" />
                </div>
              </div>

              <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 text-center">
                <Zap
                  size={14}
                  className="mx-auto text-[#f4efe6]"
                />

                <p className="mt-1 font-mono text-lg font-medium text-[#f4efe6]">
                  CORE
                </p>

                <p className="text-[8px] font-semibold tracking-[0.2em] text-orange-500">
                  ONLINE
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-3 border-t border-white/10">
            <div className="border-r border-white/10 px-3 pt-4">
              <p className="text-[10px] font-semibold tracking-wider text-white/40">
                SUBMISSION FLOW
              </p>

              <p className="mt-1 font-mono text-lg font-medium">
                {submissionFlow}%
              </p>
            </div>

            <div className="border-r border-white/10 px-3 pt-4">
              <p className="text-[10px] font-semibold tracking-wider text-white/40">
                JUDGING COVERAGE
              </p>

              <p className="mt-1 font-mono text-lg font-medium">
                {judgingCoverage}%
              </p>
            </div>

            <div className="px-3 pt-4">
              <p className="text-[10px] font-semibold tracking-wider text-white/40">
                INTEGRITY
              </p>

              <p className="mt-1 font-mono text-lg font-medium text-orange-500">
                {integrity}%
              </p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden border border-white/10 bg-[#151310]">
          <div className="relative z-10 flex items-center justify-between border-b border-white/10 p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle
                size={17}
                className="text-orange-500"
              />

              <div>
                <p className="text-[11px] font-semibold tracking-[0.25em] text-orange-500">
                  SYSTEM SIGNALS
                </p>

                <h2 className="mt-1 text-lg font-semibold">
                  Attention Required
                </h2>
              </div>
            </div>

            <span className="font-mono text-[10px] font-medium text-white/25">
              03 ACTIVE
            </span>
          </div>

          <div className="relative z-10 divide-y divide-white/10">
            {signals.map((signal, index) => (
              <div
                key={signal.code}
                className="group relative overflow-hidden p-5 transition duration-300 hover:bg-orange-500/[0.035]"
                style={{
                  animation: "signalEntry 0.7s ease-out both",
                  animationDelay: `${index * 0.15}s`
                }}
              >
                <div
                  className="absolute left-0 top-0 h-full w-[2px] bg-orange-500"
                  style={{
                    animation:
                      "signalBar 2.5s ease-in-out infinite",
                    animationDelay: `${index * 0.3}s`
                  }}
                />

                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="relative mt-1">
                      <span
                        className="block h-2 w-2 rounded-full bg-orange-500"
                        style={{
                          animation:
                            "statusPulse 1.6s ease-in-out infinite"
                        }}
                      />

                      <span className="absolute inset-[-4px] rounded-full border border-orange-500/20" />
                    </div>

                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] font-semibold text-white/25">
                          {signal.code}
                        </span>

                        <span className="text-[9px] font-semibold tracking-[0.18em] text-orange-500/80">
                          {signal.level}
                        </span>
                      </div>

                      <p className="mt-2 text-[15px] font-medium text-white/75 transition group-hover:text-white">
                        {signal.title}
                      </p>

                      <p className="mt-1 text-[10px] font-medium tracking-[0.16em] text-white/30">
                        {signal.source}
                      </p>
                    </div>
                  </div>

                  <ArrowUpRight
                    size={15}
                    className="text-white/15 transition duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-orange-500"
                  />
                </div>

                <div className="mt-4 h-px bg-white/5">
                  <div
                    className="h-px w-1/3 bg-orange-500/40"
                    style={{
                      animation:
                        "signalScan 2.8s ease-in-out infinite",
                      animationDelay: `${index * 0.4}s`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="relative z-10 border-t border-white/10 px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-[0.18em] text-white/30">
                MONITORING ENGINE
              </span>

              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-orange-500"
                  style={{
                    animation:
                      "statusPulse 1.5s ease-in-out infinite"
                  }}
                />

                <span className="font-mono text-[10px] font-semibold text-orange-500">
                  ACTIVE
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 overflow-hidden border border-white/10 bg-[#151310]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.25em] text-orange-500">
              JUDGING NETWORK
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              Assignment Topology
            </h2>

            <p className="mt-1 text-sm font-medium text-white/40">
              Live judge workload and project coverage
            </p>
          </div>

          <div className="hidden items-center gap-5 md:flex">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />

              <span className="text-[10px] font-semibold tracking-wider text-white/35">
                ACTIVE
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-px w-5 bg-orange-500/40" />

              <span className="text-[10px] font-semibold tracking-wider text-white/35">
                ASSIGNED
              </span>
            </div>
          </div>
        </div>

        <div className="grid min-h-[420px] lg:grid-cols-[1fr_1.4fr_1fr]">
          <div className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center border border-orange-500/20">
                <Gavel
                  size={15}
                  className="text-orange-500"
                />
              </div>

              <div>
                <p className="text-[10px] font-semibold tracking-[0.2em] text-white/35">
                  JUDGES
                </p>

                <p className="font-mono text-sm font-medium text-white/65">
                  {String(activeJudges).padStart(2, "0")} ACTIVE NODES
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {judges.map((judge, index) => (
                <div
                  key={judge.id}
                  className="group border border-white/10 p-4 transition duration-300 hover:border-orange-500/30 hover:bg-orange-500/[0.025]"
                  style={{
                    animation:
                      "networkEntry 0.6s ease-out both",
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-2 w-2 rounded-full bg-orange-500"
                        style={{
                          animation:
                            judge.status === "ACTIVE"
                              ? "statusPulse 1.8s ease-in-out infinite"
                              : "none",
                          opacity:
                            judge.status === "ACTIVE" ? 1 : 0.25
                        }}
                      />

                      <div>
                        <p className="text-[15px] font-medium text-white/75">
                          {judge.name}
                        </p>

                        <p className="font-mono text-[9px] font-medium text-white/25">
                          {judge.id}
                        </p>
                      </div>
                    </div>

                    <span className="text-[9px] font-semibold tracking-wider text-white/30">
                      {judge.status}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[9px] font-semibold tracking-wider text-white/30">
                      WORKLOAD
                    </span>

                    <span className="font-mono text-[11px] font-medium text-white/55">
                      {judge.load}%
                    </span>
                  </div>

                  <div className="mt-2 h-1 bg-white/5">
                    <div
                      className="h-full bg-orange-500/70"
                      style={{
                        width: `${judge.load}%`,
                        animation:
                          "loadReveal 1.2s ease-out both"
                      }}
                    />
                  </div>

                  <div className="mt-3 flex justify-between">
                    <span className="text-[9px] font-semibold text-white/25">
                      ASSIGNED PROJECTS
                    </span>

                    <span className="font-mono text-[10px] font-medium text-orange-500/80">
                      {judge.projects}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-center overflow-hidden border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
            <div className="absolute inset-0 opacity-20">
              <div
                className="h-full w-full"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
                  backgroundSize: "30px 30px"
                }}
              />
            </div>

            <div className="relative h-[330px] w-full max-w-[500px]">
              <div className="absolute left-[18%] top-[12%]">
                <div
                  className="h-3 w-3 rounded-full bg-orange-500"
                  style={{
                    animation:
                      "statusPulse 1.8s ease-in-out infinite"
                  }}
                />
              </div>

              <div className="absolute left-[18%] top-[36%]">
                <div
                  className="h-3 w-3 rounded-full bg-orange-500"
                  style={{
                    animation:
                      "statusPulse 1.8s ease-in-out infinite 0.3s"
                  }}
                />
              </div>

              <div className="absolute left-[18%] top-[60%]">
                <div
                  className="h-3 w-3 rounded-full bg-orange-500"
                  style={{
                    animation:
                      "statusPulse 1.8s ease-in-out infinite 0.6s"
                  }}
                />
              </div>

              <div className="absolute left-[18%] top-[84%]">
                <div className="h-3 w-3 rounded-full bg-orange-500 opacity-30" />
              </div>

              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <line
                  x1="18"
                  y1="13"
                  x2="82"
                  y2="18"
                  stroke="rgba(249,115,22,0.28)"
                  strokeWidth="0.3"
                />

                <line
                  x1="18"
                  y1="13"
                  x2="82"
                  y2="43"
                  stroke="rgba(249,115,22,0.12)"
                  strokeWidth="0.3"
                />

                <line
                  x1="18"
                  y1="37"
                  x2="82"
                  y2="18"
                  stroke="rgba(249,115,22,0.14)"
                  strokeWidth="0.3"
                />

                <line
                  x1="18"
                  y1="37"
                  x2="82"
                  y2="68"
                  stroke="rgba(249,115,22,0.25)"
                  strokeWidth="0.3"
                />

                <line
                  x1="18"
                  y1="61"
                  x2="82"
                  y2="43"
                  stroke="rgba(249,115,22,0.25)"
                  strokeWidth="0.3"
                />

                <line
                  x1="18"
                  y1="61"
                  x2="82"
                  y2="68"
                  stroke="rgba(249,115,22,0.14)"
                  strokeWidth="0.3"
                />

                <line
                  x1="18"
                  y1="85"
                  x2="82"
                  y2="93"
                  stroke="rgba(249,115,22,0.08)"
                  strokeWidth="0.3"
                />

                <circle r="0.8" fill="#f97316">
                  <animateMotion
                    dur="2.5s"
                    repeatCount="indefinite"
                    path="M 18 13 L 82 18"
                  />
                </circle>

                <circle r="0.8" fill="#f97316">
                  <animateMotion
                    dur="3.2s"
                    repeatCount="indefinite"
                    path="M 18 37 L 82 68"
                  />
                </circle>

                <circle r="0.8" fill="#f97316">
                  <animateMotion
                    dur="2.9s"
                    repeatCount="indefinite"
                    path="M 18 61 L 82 43"
                  />
                </circle>
              </svg>

              {projects.slice(0, 4).map((project, index) => {
                const positions = ["8%", "33%", "58%", "83%"];

                return (
                  <div
                    key={project.id}
                    className={`absolute right-[10%] flex items-center gap-3 ${
                      index === 3 ? "opacity-50" : ""
                    }`}
                    style={{ top: positions[index] }}
                  >
                    <div className="flex h-9 w-9 items-center justify-center border border-orange-500/20 bg-[#151310]">
                      <FolderKanban
                        size={14}
                        className="text-orange-500"
                      />
                    </div>

                    <div>
                      <p className="text-[13px] font-medium text-white/65">
                        {project.name}
                      </p>

                      <p className="font-mono text-[9px] font-medium text-white/25">
                        {project.id}
                      </p>
                    </div>
                  </div>
                );
              })}

              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full border border-orange-500/20"
                  style={{
                    animation:
                      "networkCore 2.5s ease-in-out infinite"
                  }}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/10">
                    <Activity
                      size={15}
                      className="text-orange-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center border border-orange-500/20">
                <FolderKanban
                  size={15}
                  className="text-orange-500"
                />
              </div>

              <div>
                <p className="text-[10px] font-semibold tracking-[0.2em] text-white/35">
                  PROJECTS
                </p>

                <p className="font-mono text-sm font-medium text-white/65">
                  COVERAGE MATRIX
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {projects.map((project, index) => (
                <div
                  key={project.id}
                  className="border border-white/10 p-4 transition duration-300 hover:border-orange-500/30 hover:bg-orange-500/[0.025]"
                  style={{
                    animation:
                      "networkEntry 0.6s ease-out both",
                    animationDelay: `${index * 0.12}s`
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[15px] font-medium text-white/75">
                        {project.name}
                      </p>

                      <p className="font-mono text-[9px] font-medium text-white/25">
                        {project.id}
                      </p>
                    </div>

                    <span className="font-mono text-sm font-medium text-white/55">
                      {project.score}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[9px] font-semibold tracking-wider text-white/30">
                      JUDGE COVERAGE
                    </span>

                    <span
                      className={`font-mono text-[10px] font-medium ${
                        project.coverage === "3/3"
                          ? "text-orange-500"
                          : "text-white/55"
                      }`}
                    >
                      {project.coverage}
                    </span>
                  </div>

                  <div className="mt-2 flex gap-1">
                    {[0, 1, 2].map((slot) => {
                      const filled =
                        Number(project.coverage.charAt(0)) > slot;

                      return (
                        <div
                          key={slot}
                          className={`h-1 flex-1 ${
                            filled
                              ? "bg-orange-500/70"
                              : "bg-white/5"
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-[10px] font-semibold tracking-[0.18em] text-white/25">
          <span>JUDGING ENGINE / TOPOLOGY ACTIVE</span>

          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            NETWORK SYNCHRONIZED
          </span>
        </div>
      </section>

      <style>
        {`
          @keyframes raptorSpin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }

          @keyframes raptorPulse {
            0%, 100% {
              transform: scale(0.75);
              opacity: 0.55;
            }

            50% {
              transform: scale(1.45);
              opacity: 1;
            }
          }

          @keyframes corePulse {
            0% {
              transform: scale(0.65);
              opacity: 0.8;
            }

            100% {
              transform: scale(1.35);
              opacity: 0;
            }
          }

          @keyframes coreGlow {
            0%, 100% {
              opacity: 0.35;
              box-shadow: 0 0 10px rgba(249,115,22,0.2);
            }

            50% {
              opacity: 1;
              box-shadow: 0 0 25px rgba(249,115,22,0.65);
            }
          }

          @keyframes orbit {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }

          @keyframes statusPulse {
            0%, 100% {
              opacity: 0.45;
              transform: scale(0.8);
            }

            50% {
              opacity: 1;
              transform: scale(1.15);
            }
          }

          @keyframes signalEntry {
            from {
              opacity: 0;
              transform: translateX(12px);
            }

            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes signalBar {
            0%, 100% {
              opacity: 0.25;
            }

            50% {
              opacity: 1;
            }
          }

          @keyframes signalScan {
            0% {
              transform: translateX(0);
              opacity: 0;
            }

            20% {
              opacity: 1;
            }

            80% {
              opacity: 1;
            }

            100% {
              transform: translateX(200%);
              opacity: 0;
            }
          }

          @keyframes networkEntry {
            from {
              opacity: 0;
              transform: translateY(8px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes loadReveal {
            from {
              transform: scaleX(0);
              transform-origin: left;
            }

            to {
              transform: scaleX(1);
              transform-origin: left;
            }
          }

          @keyframes networkCore {
            0%, 100% {
              transform: scale(0.9);
              box-shadow: 0 0 0 rgba(249,115,22,0);
            }

            50% {
              transform: scale(1.08);
              box-shadow: 0 0 25px rgba(249,115,22,0.12);
            }
          }
        `}
      </style>
    </div>
  );
}

export default Dashboard;