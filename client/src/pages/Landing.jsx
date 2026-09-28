import { Link } from "react-router-dom";
import {
  ArrowRight,
  Activity,
  Gavel,
  ShieldCheck,
  Zap,
  CircleDot
} from "lucide-react";

function Landing() {
  const nodes = [
    { x: "18%", y: "22%", delay: "0s" },
    { x: "76%", y: "18%", delay: "0.5s" },
    { x: "82%", y: "66%", delay: "1s" },
    { x: "20%", y: "76%", delay: "1.5s" },
    { x: "50%", y: "48%", delay: "0.25s" }
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-[#0b0705] text-[#f4efe6]">
      <nav className="flex items-center justify-between border-b border-white/10 bg-[#0f0907] px-8 py-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            RaptorOS
          </h1>

          <p className="text-xs tracking-wide text-white/30">
            Run. Judge. Ship.
          </p>
        </div>

        <Link
          to="/login"
          className="rounded-lg border border-orange-500/20 px-4 py-2 text-sm text-white/80 transition hover:border-orange-500/50 hover:bg-orange-500/[0.05] hover:text-orange-400"
        >
          Enter Platform
        </Link>
      </nav>

      <main className="mx-auto max-w-7xl px-8 py-20 lg:py-24">
        <section className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-[10px] font-medium tracking-[0.3em] text-orange-500">
              OPEN-SOURCE HACKATHON OPERATING SYSTEM
            </p>

            <h2 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.5rem]">
              Run the event.
              <br />
              Judge the work.
              <br />
              Ship the results.
            </h2>

            <p className="mt-7 max-w-2xl text-base leading-8 text-white/40 lg:text-lg">
              RaptorOS brings event management, submissions, judging,
              fairness, auditability, and public project discovery into
              one control system.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 rounded-lg bg-[#f4efe6] px-5 py-3 font-medium text-[#0b0705] transition hover:bg-orange-400"
              >
                Open Control Center
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/gallery"
                className="rounded-lg border border-white/10 px-5 py-3 font-medium text-white/70 transition hover:border-orange-500/40 hover:bg-orange-500/[0.05] hover:text-orange-400"
              >
                Explore Projects
              </Link>
            </div>
          </div>

          <div className="relative flex min-h-[430px] items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.10),transparent_55%)]" />

            <div
              className="absolute h-[360px] w-[360px] rounded-full border border-orange-500/10"
              style={{
                animation: "landingOrbit 12s linear infinite"
              }}
            />

            <div
              className="absolute h-[280px] w-[280px] rounded-full border border-orange-500/10"
              style={{
                animation: "landingOrbitReverse 9s linear infinite"
              }}
            />

            <div
              className="absolute h-[190px] w-[190px] rounded-full border border-orange-500/15"
              style={{
                animation: "landingPulse 3s ease-in-out infinite"
              }}
            />

            <svg
              className="absolute h-[390px] w-[390px]"
              viewBox="0 0 100 100"
            >
              <line
                x1="18"
                y1="22"
                x2="50"
                y2="48"
                stroke="rgba(249,115,22,0.25)"
                strokeWidth="0.35"
              />

              <line
                x1="76"
                y1="18"
                x2="50"
                y2="48"
                stroke="rgba(249,115,22,0.25)"
                strokeWidth="0.35"
              />

              <line
                x1="82"
                y1="66"
                x2="50"
                y2="48"
                stroke="rgba(249,115,22,0.18)"
                strokeWidth="0.35"
              />

              <line
                x1="20"
                y1="76"
                x2="50"
                y2="48"
                stroke="rgba(249,115,22,0.18)"
                strokeWidth="0.35"
              />

              <line
                x1="18"
                y1="22"
                x2="76"
                y2="18"
                stroke="rgba(249,115,22,0.08)"
                strokeWidth="0.25"
              />

              <line
                x1="76"
                y1="18"
                x2="82"
                y2="66"
                stroke="rgba(249,115,22,0.08)"
                strokeWidth="0.25"
              />

              <circle r="0.8" fill="#f97316">
                <animateMotion
                  dur="2.8s"
                  repeatCount="indefinite"
                  path="M 18 22 L 50 48"
                />
              </circle>

              <circle r="0.8" fill="#fb923c">
                <animateMotion
                  dur="3.4s"
                  repeatCount="indefinite"
                  path="M 76 18 L 50 48"
                />
              </circle>

              <circle r="0.8" fill="#f97316">
                <animateMotion
                  dur="3s"
                  repeatCount="indefinite"
                  path="M 82 66 L 50 48"
                />
              </circle>

              <circle r="0.8" fill="#fb923c">
                <animateMotion
                  dur="3.6s"
                  repeatCount="indefinite"
                  path="M 20 76 L 50 48"
                />
              </circle>
            </svg>

            {nodes.map((node, index) => (
              <span
                key={index}
                className="absolute h-2.5 w-2.5 rounded-full bg-orange-500"
                style={{
                  left: node.x,
                  top: node.y,
                  animation: "landingNode 2s ease-in-out infinite",
                  animationDelay: node.delay,
                  boxShadow: "0 0 18px rgba(249,115,22,0.7)"
                }}
              />
            ))}

            <div
              className="absolute flex h-36 w-36 items-center justify-center rounded-full border border-orange-500/20"
              style={{
                animation: "landingCore 3s ease-in-out infinite"
              }}
            >
              <div className="absolute h-28 w-28 rounded-full border border-orange-500/20" />

              <div className="absolute h-20 w-20 rounded-full border border-orange-500/20" />

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/10 shadow-[0_0_45px_rgba(249,115,22,0.25)]">
                <Zap
                  size={22}
                  className="text-orange-400"
                />
              </div>
            </div>

            <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="text-lg font-semibold tracking-[0.12em] text-white">
                RAPTOR
              </p>

              <p className="mt-1 text-[9px] font-medium tracking-[0.22em] text-orange-500">
                CORE ONLINE
              </p>
            </div>

            <div className="absolute left-[8%] top-[17%] border border-white/10 bg-[#15100d]/90 px-3 py-2 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Activity
                  size={13}
                  className="text-orange-500"
                />

                <span className="text-[10px] font-medium tracking-[0.12em] text-white/55">
                  EVENT ENGINE
                </span>
              </div>
            </div>

            <div className="absolute right-[5%] top-[13%] border border-white/10 bg-[#15100d]/90 px-3 py-2 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Gavel
                  size={13}
                  className="text-orange-500"
                />

                <span className="text-[10px] font-medium tracking-[0.12em] text-white/55">
                  JUDGING
                </span>
              </div>
            </div>

            <div className="absolute bottom-[14%] left-[8%] border border-white/10 bg-[#15100d]/90 px-3 py-2 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck
                  size={13}
                  className="text-orange-500"
                />

                <span className="text-[10px] font-medium tracking-[0.12em] text-white/55">
                  AUDIT LEDGER
                </span>
              </div>
            </div>

            <div className="absolute bottom-[11%] right-[7%] border border-white/10 bg-[#15100d]/90 px-3 py-2 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <CircleDot
                  size={13}
                  className="text-orange-500"
                />

                <span className="text-[10px] font-medium tracking-[0.12em] text-white/55">
                  LIVE SYSTEM
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-20 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Activity,
              title: "Hackathon Health",
              text: "See event activity, submission progress, and system health."
            },
            {
              icon: Gavel,
              title: "Fair Judging",
              text: "Manage assignments, scoring, normalization, and judge progress."
            },
            {
              icon: ShieldCheck,
              title: "Decision Ledger",
              text: "Keep important event actions traceable and auditable."
            }
          ].map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="group rounded-xl border border-white/10 bg-[#15100d] p-6 transition duration-300 hover:border-orange-500/30 hover:bg-orange-500/[0.025]"
            >
              <Icon
                size={22}
                className="text-orange-500 transition duration-300 group-hover:scale-110"
              />

              <h3 className="mt-5 text-lg font-semibold">
                {title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/35">
                {text}
              </p>
            </div>
          ))}
        </section>
      </main>

      <style>
        {`
          @keyframes landingOrbit {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }

          @keyframes landingOrbitReverse {
            from {
              transform: rotate(360deg);
            }

            to {
              transform: rotate(0deg);
            }
          }

          @keyframes landingPulse {
            0%, 100% {
              transform: scale(0.92);
              opacity: 0.45;
            }

            50% {
              transform: scale(1.08);
              opacity: 1;
            }
          }

          @keyframes landingNode {
            0%, 100% {
              transform: scale(0.75);
              opacity: 0.5;
            }

            50% {
              transform: scale(1.35);
              opacity: 1;
            }
          }

          @keyframes landingCore {
            0%, 100% {
              transform: scale(0.94);
              box-shadow: 0 0 20px rgba(249,115,22,0.05);
            }

            50% {
              transform: scale(1.06);
              box-shadow: 0 0 45px rgba(249,115,22,0.15);
            }
          }
        `}
      </style>
    </div>
  );
}

export default Landing;