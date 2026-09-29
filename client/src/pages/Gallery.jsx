import { useEffect, useState } from "react";
import CommandHeader from "../components/CommandHeader";
import { ArrowUpRight, Search } from "lucide-react";
import api from "../services/api";

function Gallery() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await api.get("/projects?limit=50");

        setProjects(
          (response.data?.projects || []).map((project, index) => ({
            id: String(index + 1).padStart(3, "0"),
            title: project.title,
            team: project.team_name || project.team || "—",
            category: project.category || "—",
            status: project.status || "SUBMITTED",
            score: project.score ?? "—"
          }))
        );
      } catch (error) {
        console.error("Failed to load projects:", error);
        setProjects([]);
      }
    };

    loadProjects();
  }, []);

  return (
    <div>
      <CommandHeader />

      <section className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.3em] text-orange-400">
            PROJECTS / 02
          </p>

          <h1 className="mt-3 text-5xl font-bold tracking-tight text-white">
            Project Explorer
          </h1>

          <p className="mt-4 max-w-xl text-base font-medium leading-6 text-white/60">
            Browse submitted projects, inspect their status, and explore the
            public event portfolio.
          </p>
        </div>

        <div className="flex items-center gap-3 border border-white/15 bg-[#151310] px-4 py-3">
          <Search size={16} className="text-white/50" />

          <input
            placeholder="Search projects..."
            className="w-48 bg-transparent text-sm font-medium text-white outline-none placeholder:text-white/40"
          />
        </div>
      </section>

      <section className="border-l border-t border-white/15">
        {projects.map((project) => (
          <div
            key={project.id}
            className="group grid border-b border-r border-white/15 p-6 transition hover:bg-white/[0.03] md:grid-cols-[70px_1.5fr_1fr_140px_100px_30px] md:items-center md:gap-6"
          >
            <span className="font-mono text-sm font-semibold text-white/45">
              {project.id}
            </span>

            <div>
              <h2 className="text-xl font-semibold text-white">
                {project.title}
              </h2>

              <p className="mt-1 text-sm font-medium text-white/50">
                {project.team}
              </p>
            </div>

            <span className="text-[11px] font-semibold tracking-[0.15em] text-white/55">
              {project.category}
            </span>

            <span
              className={`text-[11px] font-semibold tracking-[0.15em] ${
                project.status === "JUDGING"
                  ? "text-orange-400"
                  : "text-white/55"
              }`}
            >
              {project.status}
            </span>

            <span className="font-mono text-base font-semibold text-white/75">
              {project.score}
            </span>

            <ArrowUpRight
              size={17}
              className="text-white/40 transition group-hover:text-orange-400"
            />
          </div>
        ))}
      </section>

      <div className="mt-6 flex justify-between text-[11px] font-semibold tracking-[0.2em] text-white/45">
        <span>
          {String(projects.length).padStart(2, "0")} PROJECTS DISPLAYED
        </span>

        <span>PUBLIC GALLERY</span>
      </div>
    </div>
  );
}

export default Gallery;