import { Link } from "react-router-dom";
import {
  ArrowRight,
  Trophy,
  Gavel,
  Users,
  FileCheck2,
  ShieldCheck,
  Sparkles
} from "lucide-react";

function Landing() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#0b0705] text-[#f4efe6]">
      {/* NAVBAR */}
      <nav className="flex items-center justify-between border-b border-white/10 bg-[#0f0907] px-6 py-4 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="RaptorOS"
            className="h-14 w-14 object-contain"
          />

          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Raptor<span className="text-orange-500">OS</span>
            </h1>

            <p className="text-[10px] tracking-[0.18em] text-white/30">
              HACKATHON OPERATING SYSTEM
            </p>
          </div>
        </Link>

        <Link
          to="/login"
          className="rounded-lg border border-orange-500/20 px-4 py-2 text-sm text-white/80 transition hover:border-orange-500/50 hover:bg-orange-500/[0.05] hover:text-orange-400"
        >
          Enter Platform
        </Link>
      </nav>

      {/* HERO */}
      <main className="mx-auto max-w-7xl px-6 py-5 lg:px-8 lg:py-6">
        <section className="grid items-center gap-4 lg:min-h-[560px] lg:grid-cols-[0.95fr_1.05fr]">

          {/* LEFT CONTENT */}
          <div className="max-w-2xl">
            <p className="text-[10px] font-medium tracking-[0.3em] text-orange-500">
              OPEN-SOURCE HACKATHON OPERATING SYSTEM
            </p>

            <h2 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-[4.1rem]">
              Run the event.
              <br />
              Judge the work.
              <br />
              Ship the results.
            </h2>

            <p className="mt-5 max-w-xl text-base leading-7 text-white/40 lg:text-[17px]">
              RaptorOS brings event management, submissions, judging,
              fairness, auditability, and public project discovery into
              one control system.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 rounded-lg bg-[#f4efe6] px-5 py-3 text-sm font-semibold text-[#0b0705] transition hover:bg-orange-400"
              >
                Open Control Center
                <ArrowRight size={17} />
              </Link>

              <Link
                to="/gallery"
                className="rounded-lg border border-white/10 px-5 py-3 text-sm font-medium text-white/70 transition hover:border-orange-500/40 hover:bg-orange-500/[0.05] hover:text-orange-400"
              >
                Explore Projects
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-5 text-[11px] text-white/30">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                Self-hostable
              </div>

              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                Role-based
              </div>

              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                Audit-ready
              </div>
            </div>
          </div>

          {/* RIGHT HERO VISUAL */}
          <div className="relative flex min-h-[620px] -translate-y-12 items-center justify-center overflow-visible">

            {/* MASSIVE AMBIENT GLOW */}
            <div
              className="absolute h-[560px] w-[560px] rounded-full bg-orange-500/[0.035] blur-[100px]"
              style={{
                animation: "megaGlow 4s ease-in-out infinite"
              }}
            />

            {/* OUTER ROTATING RINGS */}
            <div
              className="absolute h-[520px] w-[520px] rounded-full border border-orange-500/[0.07]"
              style={{
                animation: "crazySpin 14s linear infinite"
              }}
            />

            <div
              className="absolute h-[440px] w-[440px] rounded-full border border-white/[0.04]"
              style={{
                animation: "crazySpinReverse 10s linear infinite"
              }}
            />

            <div
              className="absolute h-[350px] w-[350px] rounded-full border border-orange-500/[0.12]"
              style={{
                animation: "crazySpin 7s linear infinite"
              }}
            />

            {/* ORBIT DOTS */}
            <div
              className="absolute h-[520px] w-[520px]"
              style={{
                animation: "crazySpin 8s linear infinite"
              }}
            >
              <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-orange-400 shadow-[0_0_18px_#f97316]" />

              <span className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-orange-500 shadow-[0_0_15px_#f97316]" />
            </div>

            <div
              className="absolute h-[440px] w-[440px]"
              style={{
                animation: "crazySpinReverse 6s linear infinite"
              }}
            >
              <span className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-orange-300 shadow-[0_0_20px_#f97316]" />

              <span className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-orange-500" />
            </div>

            {/* MAIN HERO CORE */}
            <div
              className="relative z-20 flex h-[430px] w-[430px] items-center justify-center"
              style={{
                animation: "heroFloat 4s ease-in-out infinite"
              }}
            >

              {/* PULSING CORE RINGS */}
              <div
                className="absolute h-[390px] w-[390px] rounded-full border border-orange-500/10"
                style={{
                  animation: "pulseRing 2.5s ease-in-out infinite"
                }}
              />

              <div
                className="absolute h-[330px] w-[330px] rounded-full border border-orange-500/15"
                style={{
                  animation: "pulseRingReverse 2s ease-in-out infinite"
                }}
              />

              <div
                className="absolute h-[270px] w-[270px] rounded-full border border-orange-500/20"
                style={{
                  animation: "pulseRing 1.7s ease-in-out infinite"
                }}
              />

              {/* ENERGY PARTICLES */}
              <div className="absolute inset-0">
                {[
                  ["left-[18%] top-[22%]", "2s"],
                  ["left-[75%] top-[18%]", "2.7s"],
                  ["left-[12%] top-[65%]", "3.2s"],
                  ["right-[14%] top-[62%]", "2.4s"],
                  ["left-[45%] top-[8%]", "1.8s"],
                  ["left-[82%] top-[42%]", "3.5s"],
                  ["left-[28%] bottom-[8%]", "2.2s"],
                  ["right-[30%] bottom-[12%]", "3s"]
                ].map(([position, duration], index) => (
                  <span
                    key={index}
                    className={`absolute ${position} h-1.5 w-1.5 rounded-full bg-orange-400`}
                    style={{
                      animation: `particleFloat ${duration} ease-in-out infinite`,
                      boxShadow: "0 0 14px rgba(249,115,22,0.9)"
                    }}
                  />
                ))}
              </div>

              {/* TEAMS */}
              <div
                className="absolute left-[-25px] top-[70px]"
                style={{
                  animation: "moduleFloat 3s ease-in-out infinite"
                }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/25 bg-[#15100d] shadow-[0_0_35px_rgba(249,115,22,0.12)]">
                  <Users
                    size={21}
                    className="text-orange-400"
                  />
                </div>

                <p className="mt-2 text-center text-[8px] font-medium tracking-[0.16em] text-white/30">
                  TEAMS
                </p>
              </div>

              {/* PROJECTS */}
              <div
                className="absolute right-[-25px] top-[80px]"
                style={{
                  animation: "moduleFloatReverse 3.5s ease-in-out infinite"
                }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/25 bg-[#15100d] shadow-[0_0_35px_rgba(249,115,22,0.12)]">
                  <FileCheck2
                    size={21}
                    className="text-orange-400"
                  />
                </div>

                <p className="mt-2 text-center text-[8px] font-medium tracking-[0.16em] text-white/30">
                  PROJECTS
                </p>
              </div>

              {/* JUDGING */}
              <div
                className="absolute bottom-[65px] left-[-5px]"
                style={{
                  animation: "moduleFloatReverse 3.2s ease-in-out infinite"
                }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/25 bg-[#15100d] shadow-[0_0_35px_rgba(249,115,22,0.12)]">
                  <Gavel
                    size={21}
                    className="text-orange-400"
                  />
                </div>

                <p className="mt-2 text-center text-[8px] font-medium tracking-[0.16em] text-white/30">
                  JUDGING
                </p>
              </div>

              {/* AUDIT */}
              <div
                className="absolute bottom-[60px] right-[-5px]"
                style={{
                  animation: "moduleFloat 3.7s ease-in-out infinite"
                }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/25 bg-[#15100d] shadow-[0_0_35px_rgba(249,115,22,0.12)]">
                  <ShieldCheck
                    size={21}
                    className="text-orange-400"
                  />
                </div>

                <p className="mt-2 text-center text-[8px] font-medium tracking-[0.16em] text-white/30">
                  AUDIT
                </p>
              </div>

              {/* CENTRAL HACKATHON CORE */}
              <div
                className="relative flex h-[190px] w-[190px] items-center justify-center"
                style={{
                  animation: "coreFloat 2.8s ease-in-out infinite"
                }}
              >

                {/* GLOW */}
                <div
                  className="absolute inset-0 rounded-full bg-orange-500/[0.07] blur-2xl"
                  style={{
                    animation: "coreGlow 1.8s ease-in-out infinite"
                  }}
                />

                {/* CORE ROTATING RING */}
                <div
                  className="absolute inset-[-20px] rounded-full border border-orange-500/10"
                  style={{
                    animation: "coreSpin 5s linear infinite"
                  }}
                />

                {/* CORE */}
                <div className="relative flex h-[150px] w-[150px] flex-col items-center justify-center rounded-[38px] border border-orange-500/35 bg-[#15100d] shadow-[0_0_90px_rgba(249,115,22,0.18)]">

                  <div
                    className="absolute inset-0 rounded-[38px] bg-orange-500/[0.025]"
                    style={{
                      animation: "innerFlash 1.5s ease-in-out infinite"
                    }}
                  />

                  <Trophy
                    size={62}
                    strokeWidth={1.25}
                    className="relative text-orange-400"
                    style={{
                      animation: "trophyPulse 2s ease-in-out infinite"
                    }}
                  />

                  <div className="mt-4 flex items-center gap-2">
                    <Sparkles
                      size={11}
                      className="text-orange-500"
                      style={{
                        animation: "sparkSpin 2s linear infinite"
                      }}
                    />

                    <span className="text-[10px] font-semibold tracking-[0.25em] text-white/60">
                      HACKATHON
                    </span>

                    <Sparkles
                      size={11}
                      className="text-orange-500"
                      style={{
                        animation: "sparkSpinReverse 2s linear infinite"
                      }}
                    />
                  </div>

                  <div className="mt-2 flex items-center gap-1.5">
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-orange-500"
                      style={{
                        animation: "statusBlink 1s ease-in-out infinite"
                      }}
                    />

                    <span className="text-[8px] tracking-[0.2em] text-white/30">
                      EVENT ENGINE
                    </span>
                  </div>
                </div>
              </div>

              {/* CONNECTION LINES */}
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox="0 0 430 430"
              >
                <path
                  d="M55 105 C120 115 135 145 170 185"
                  stroke="rgba(249,115,22,0.22)"
                  strokeWidth="1"
                  fill="none"
                  strokeDasharray="5 7"
                  style={{
                    animation: "dashMove 2s linear infinite"
                  }}
                />

                <path
                  d="M375 110 C310 120 295 150 260 185"
                  stroke="rgba(249,115,22,0.22)"
                  strokeWidth="1"
                  fill="none"
                  strokeDasharray="5 7"
                  style={{
                    animation: "dashMoveReverse 2s linear infinite"
                  }}
                />

                <path
                  d="M80 335 C135 310 150 275 180 245"
                  stroke="rgba(249,115,22,0.18)"
                  strokeWidth="1"
                  fill="none"
                  strokeDasharray="5 7"
                  style={{
                    animation: "dashMove 2.5s linear infinite"
                  }}
                />

                <path
                  d="M350 335 C300 310 285 275 250 245"
                  stroke="rgba(249,115,22,0.18)"
                  strokeWidth="1"
                  fill="none"
                  strokeDasharray="5 7"
                  style={{
                    animation: "dashMoveReverse 2.5s linear infinite"
                  }}
                />

                {/* CONNECTION NODES */}
                <circle
                  cx="55"
                  cy="105"
                  r="2"
                  fill="#f97316"
                />

                <circle
                  cx="375"
                  cy="110"
                  r="2"
                  fill="#f97316"
                />

                <circle
                  cx="80"
                  cy="335"
                  r="2"
                  fill="#f97316"
                />

                <circle
                  cx="350"
                  cy="335"
                  r="2"
                  fill="#f97316"
                />
              </svg>
            </div>

            {/* STATUS */}
            <div className="absolute bottom-[2%] left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-2 rounded-full border border-orange-500/15 bg-[#15100d]/90 px-5 py-2.5 shadow-[0_0_30px_rgba(249,115,22,0.08)]">

                <span
                  className="h-1.5 w-1.5 rounded-full bg-orange-500"
                  style={{
                    animation: "statusBlink 1s ease-in-out infinite"
                  }}
                />

                <span className="text-[9px] font-medium tracking-[0.2em] text-white/40">
                  RAPTOROS EVENT ENGINE ONLINE
                </span>

              </div>
            </div>
          </div>
        </section>

        {/* FEATURE CARDS */}
        <section className="mt-1 grid gap-4 pb-8 md:grid-cols-3 lg:mt-2">

          {[
            {
              icon: Trophy,
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
              className="group rounded-xl border border-white/10 bg-[#15100d] p-5 transition duration-300 hover:border-orange-500/30 hover:bg-orange-500/[0.025]"
            >
              <Icon
                size={21}
                className="text-orange-500 transition duration-300 group-hover:scale-110"
              />

              <h3 className="mt-4 text-base font-semibold">
                {title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/35">
                {text}
              </p>
            </div>
          ))}

        </section>
      </main>

      {/* ANIMATIONS */}
      <style>
        {`
          @keyframes megaGlow {
            0%, 100% {
              transform: scale(0.85);
              opacity: 0.35;
            }

            50% {
              transform: scale(1.15);
              opacity: 0.8;
            }
          }

          @keyframes crazySpin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }

          @keyframes crazySpinReverse {
            from {
              transform: rotate(360deg);
            }

            to {
              transform: rotate(0deg);
            }
          }

          @keyframes heroFloat {
            0%, 100% {
              transform: translateY(0) scale(1);
            }

            50% {
              transform: translateY(-12px) scale(1.025);
            }
          }

          @keyframes pulseRing {
            0%, 100% {
              transform: scale(0.92);
              opacity: 0.25;
            }

            50% {
              transform: scale(1.08);
              opacity: 0.9;
            }
          }

          @keyframes pulseRingReverse {
            0%, 100% {
              transform: scale(1.05);
              opacity: 0.15;
            }

            50% {
              transform: scale(0.9);
              opacity: 0.65;
            }
          }

          @keyframes particleFloat {
            0%, 100% {
              transform: translate(0, 0) scale(0.6);
              opacity: 0.25;
            }

            50% {
              transform: translate(10px, -18px) scale(1.4);
              opacity: 1;
            }
          }

          @keyframes moduleFloat {
            0%, 100% {
              transform: translateY(0) rotate(0deg);
            }

            50% {
              transform: translateY(-12px) rotate(2deg);
            }
          }

          @keyframes moduleFloatReverse {
            0%, 100% {
              transform: translateY(0) rotate(0deg);
            }

            50% {
              transform: translateY(12px) rotate(-2deg);
            }
          }

          @keyframes coreFloat {
            0%, 100% {
              transform: translateY(0) scale(1);
            }

            50% {
              transform: translateY(-7px) scale(1.035);
            }
          }

          @keyframes coreGlow {
            0%, 100% {
              opacity: 0.2;
              transform: scale(0.85);
            }

            50% {
              opacity: 1;
              transform: scale(1.15);
            }
          }

          @keyframes coreSpin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(-360deg);
            }
          }

          @keyframes trophyPulse {
            0%, 100% {
              transform: scale(1);
              filter: drop-shadow(0 0 0 rgba(249,115,22,0));
            }

            50% {
              transform: scale(1.12);
              filter: drop-shadow(0 0 14px rgba(249,115,22,0.65));
            }
          }

          @keyframes innerFlash {
            0%, 100% {
              opacity: 0.1;
            }

            50% {
              opacity: 0.8;
            }
          }

          @keyframes sparkSpin {
            from {
              transform: rotate(0deg) scale(0.8);
            }

            to {
              transform: rotate(360deg) scale(1.2);
            }
          }

          @keyframes sparkSpinReverse {
            from {
              transform: rotate(360deg) scale(1.2);
            }

            to {
              transform: rotate(0deg) scale(0.8);
            }
          }

          @keyframes dashMove {
            from {
              stroke-dashoffset: 0;
            }

            to {
              stroke-dashoffset: -24;
            }
          }

          @keyframes dashMoveReverse {
            from {
              stroke-dashoffset: -24;
            }

            to {
              stroke-dashoffset: 0;
            }
          }

          @keyframes statusBlink {
            0%, 100% {
              opacity: 0.25;
              transform: scale(0.7);
            }

            50% {
              opacity: 1;
              transform: scale(1.3);
              box-shadow: 0 0 12px rgba(249,115,22,0.8);
            }
          }
        `}
      </style>
    </div>
  );
}

export default Landing;