import CommandHeader from "../components/CommandHeader";
import { ArrowUpRight, Search } from "lucide-react";

function Gallery() {
  const projects = [
    {
      id: "001",
      title: "EcoRoute",
      team: "Team Nova",
      category: "SUSTAINABILITY",
      status: "JUDGING",
      score: "8.42"
    },
    {
      id: "002",
      title: "PulseGrid",
      team: "Team Vector",
      category: "HEALTH",
      status: "SUBMITTED",
      score: "—"
    },
    {
      id: "003",
      title: "CivicLens",
      team: "Team Orbit",
      category: "CIVIC TECH",
      status: "JUDGING",
      score: "7.91"
    },
    {
      id: "004",
      title: "FarmSense",
      team: "Team Terra",
      category: "AGRI TECH",
      status: "SUBMITTED",
      score: "—"
    }
  ];

  return (
    <div>
      <CommandHeader />

      <section className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="text-[10px] tracking-[0.3em] text-orange-500">
            PROJECTS / 02
          </p>

          <h1 className="mt-3 text-5xl font-semibold tracking-tight">
            Project Explorer
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-white/40">
            Browse submitted projects, inspect their status, and explore the
            public event portfolio.
          </p>
        </div>

        <div className="flex items-center gap-3 border border-white/10 bg-[#151310] px-4 py-3">
          <Search size={15} className="text-white/30" />
          <input
            placeholder="Search projects..."
            className="w-48 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
          />
        </div>
      </section>

      <section className="border-l border-t border-white/10">
        {projects.map((project) => (
          <div
            key={project.id}
            className="group grid border-b border-r border-white/10 p-6 transition hover:bg-white/[0.02] md:grid-cols-[70px_1.5fr_1fr_140px_100px_30px] md:items-center md:gap-6"
          >
            <span className="font-mono text-xs text-white/20">
              {project.id}
            </span>

            <div>
              <h2 className="text-xl font-medium">{project.title}</h2>
              <p className="mt-1 text-xs text-white/30">{project.team}</p>
            </div>

            <span className="text-[10px] tracking-[0.15em] text-white/40">
              {project.category}
            </span>

            <span
              className={`text-[10px] tracking-[0.15em] ${
                project.status === "JUDGING"
                  ? "text-orange-500"
                  : "text-white/30"
              }`}
            >
              {project.status}
            </span>

            <span className="font-mono text-sm text-white/60">
              {project.score}
            </span>

            <ArrowUpRight
              size={16}
              className="text-white/20 transition group-hover:text-orange-500"
            />
          </div>
        ))}
      </section>

      <div className="mt-6 flex justify-between text-[10px] tracking-[0.2em] text-white/25">
        <span>04 PROJECTS DISPLAYED</span>
        <span>PUBLIC GALLERY</span>
      </div>
    </div>
  );
}

export default Gallery;