import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Gavel,
  ShieldCheck,
  FileSearch,
  Gauge,
  CalendarDays,
  Users,
  LogOut
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = [
    {
      to: "/dashboard",
      label: "Command",
      code: "01",
      icon: LayoutDashboard,
      roles: ["admin", "organizer"]
    },
    {
      to: "/events",
      label: "Events",
      code: "02",
      icon: CalendarDays,
      roles: ["admin", "organizer"]
    },
    {
      to: "/gallery",
      label: "Projects",
      code: "03",
      icon: FolderKanban,
      roles: ["admin", "organizer", "judge", "participant"]
    },
    {
      to: "/participant",
      label: "Participant",
      code: "04",
      icon: Users,
      roles: ["participant"]
    },
    {
      to: "/judge",
      label: "Judging",
      code: "04",
      icon: Gavel,
      roles: ["judge"]
    },
    {
      to: "/control-room",
      label: "Control",
      code: "05",
      icon: ShieldCheck,
      roles: ["admin", "organizer"]
    },
    {
      to: "/ledger",
      label: "Ledger",
      code: "06",
      icon: FileSearch,
      roles: ["admin", "organizer"]
    },
    {
      to: "/judge/simulator",
      label: "Simulator",
      code: "07",
      icon: Gauge,
      roles: ["admin", "organizer", "judge"]
    }
  ].filter((link) => link.roles.includes(user?.role));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#11100e] text-[#f4efe6]">
      <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-white/10 bg-[#151310]">
        {/* BRAND */}
        <div className="shrink-0 border-b border-white/10 p-6">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="RaptorOS"
              className="h-10 w-10 object-contain"
            />

            <div>
              <h1 className="text-lg font-bold tracking-tight">
                Raptor<span className="text-orange-500">OS</span>
              </h1>

              <p className="text-[10px] font-medium tracking-[0.2em] text-white/35">
                HACKATHON OPERATING SYSTEM
              </p>
            </div>
          </div>
        </div>

        {/* SCROLLABLE SIDEBAR CONTENT */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-8 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
          <div>
            <p className="mb-4 text-[10px] font-semibold tracking-[0.25em] text-white/35">
              NAVIGATION
            </p>

            <nav className="space-y-1">
              {links.map(({ to, label, code, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `group flex items-center justify-between border-l-2 px-3 py-3 transition ${
                      isActive
                        ? "border-orange-500 bg-orange-500/[0.06] text-[#f4efe6]"
                        : "border-transparent text-white/50 hover:border-white/20 hover:bg-white/[0.02] hover:text-white/80"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon size={17} />

                    <span className="text-[15px] font-medium">
                      {label}
                    </span>
                  </div>

                  <span className="font-mono text-[10px] font-medium text-white/25 group-hover:text-white/40">
                    {code}
                  </span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* SYSTEM STATUS */}
          <div className="mt-10 border-t border-white/10 pt-5">
            <p className="text-[10px] font-semibold tracking-[0.2em] text-white/25">
              SYSTEM STATUS
            </p>

            <div className="mt-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.6)]" />

              <span className="text-sm font-medium text-white/60">
                Operational
              </span>
            </div>
          </div>

          {/* CURRENT SESSION */}
          {user && (
            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="text-[10px] font-semibold tracking-[0.2em] text-white/25">
                CURRENT SESSION
              </p>

              <div className="mt-2 truncate text-sm font-medium text-white/65">
                {user.email || user.name}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 flex w-full items-center gap-2 border border-white/10 px-3 py-2 text-sm font-medium text-white/45 transition hover:border-orange-500/40 hover:bg-orange-500/[0.05] hover:text-orange-400"
              >
                <LogOut size={14} />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="ml-64 min-h-screen p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;