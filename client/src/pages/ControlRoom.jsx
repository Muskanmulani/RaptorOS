import CommandHeader from "../components/CommandHeader";
import {
  Users,
  GitBranch,
  Scale,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";

function ControlRoom() {
  const systems = [
    {
      code: "01",
      title: "PARTICIPANTS",
      value: "084",
      detail: "REGISTERED",
      icon: Users
    },
    {
      code: "02",
      title: "ASSIGNMENTS",
      value: "096",
      detail: "GENERATED",
      icon: GitBranch
    },
    {
      code: "03",
      title: "NORMALIZATION",
      value: "READY",
      detail: "ENGINE ONLINE",
      icon: Scale
    },
    {
      code: "04",
      title: "INTEGRITY",
      value: "NOMINAL",
      detail: "NO CRITICAL ISSUES",
      icon: ShieldCheck
    }
  ];

  return (
    <div>
      <CommandHeader />

      <section className="mb-10">
        <p className="text-[10px] tracking-[0.3em] text-orange-500">
          CONTROL / 04
        </p>

        <h1 className="mt-3 text-5xl font-semibold tracking-tight">
          Control Room
        </h1>

        <p className="mt-4 max-w-xl text-sm leading-6 text-white/40">
          Operate the event, monitor judging integrity, and inspect critical
          system signals.
        </p>
      </section>

      <section className="grid border-l border-t border-white/10 md:grid-cols-2">
        {systems.map(({ code, title, value, detail, icon: Icon }) => (
          <div
            key={code}
            className="border-b border-r border-white/10 p-7 transition hover:bg-white/[0.02]"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-white/20">
                {code}
              </span>

              <Icon size={18} className="text-orange-500/70" />
            </div>

            <p className="mt-10 text-[10px] tracking-[0.2em] text-white/30">
              {title}
            </p>

            <p className="mt-2 font-mono text-3xl">{value}</p>

            <p className="mt-3 text-[10px] tracking-wider text-orange-500/70">
              {detail}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-8 border border-white/10 bg-[#151310]">
        <div className="flex items-center gap-3 border-b border-white/10 p-6">
          <AlertTriangle size={17} className="text-orange-500" />

          <div>
            <p className="text-[10px] tracking-[0.25em] text-orange-500">
              SYSTEM SIGNALS
            </p>
            <h2 className="mt-1 text-lg font-medium">Attention Required</h2>
          </div>
        </div>

        <div className="divide-y divide-white/10">
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-white/70">
                03 projects have insufficient judge coverage
              </p>
              <p className="mt-1 text-[10px] text-white/25">
                ASSIGNMENT ENGINE
              </p>
            </div>

            <span className="text-[10px] tracking-wider text-orange-500">
              REVIEW
            </span>
          </div>

          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-white/70">
                02 judges exceed normal workload
              </p>
              <p className="mt-1 text-[10px] text-white/25">
                FAIRNESS MONITOR
              </p>
            </div>

            <span className="text-[10px] tracking-wider text-orange-500">
              REVIEW
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ControlRoom;