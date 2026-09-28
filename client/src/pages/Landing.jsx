import { Link } from "react-router-dom";
import { ArrowRight, Activity, Gavel, ShieldCheck } from "lucide-react";

function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="flex items-center justify-between border-b border-slate-800 px-8 py-5">
        <div>
          <h1 className="text-xl font-bold">RaptorOS</h1>
          <p className="text-xs text-slate-500">Run. Judge. Ship.</p>
        </div>

        <Link
          to="/login"
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-900"
        >
          Enter Platform
        </Link>
      </nav>

      <main className="mx-auto max-w-6xl px-8 py-24">
        <div className="max-w-3xl">
          <p className="text-sm font-medium tracking-widest text-slate-500">
            OPEN-SOURCE HACKATHON OPERATING SYSTEM
          </p>

          <h2 className="mt-6 text-6xl font-bold leading-tight tracking-tight">
            Run the event.
            <br />
            Judge the work.
            <br />
            Ship the results.
          </h2>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
            RaptorOS brings event management, submissions, judging, fairness,
            auditability, and public project discovery into one control system.
          </p>

          <div className="mt-8 flex gap-4">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 rounded-lg bg-white px-5 py-3 font-medium text-slate-950 hover:bg-slate-200"
            >
              Open Control Center
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/gallery"
              className="rounded-lg border border-slate-700 px-5 py-3 font-medium hover:bg-slate-900"
            >
              Explore Projects
            </Link>
          </div>
        </div>

        <div className="mt-24 grid gap-4 md:grid-cols-3">
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
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-6"
            >
              <Icon size={22} className="text-slate-300" />
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Landing;