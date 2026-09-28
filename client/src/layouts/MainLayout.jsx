
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Gavel,
  ShieldCheck,
  Activity,
  FileSearch,
  Gauge,
  CalendarDays,
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
      <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-white/10 bg-[#151310] p-6">
        <div className="border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center border border-orange-500/50 text-orange-500">
              <Activity size={18} />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight">
                RaptorOS
              </h1>

              <p className="text-[10px] tracking-[0.2em] text-white/30">
                EVENT OPERATING SYSTEM
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <p className="mb-4 text-[10px] tracking-[0.25em] text-white/30">
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
                      : "border-transparent text-white/40 hover:border-white/20 hover:bg-white/[0.02] hover:text-white/80"
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} />
                  <span className="text-sm">{label}</span>
                </div>

                <span className="font-mono text-[10px] text-white/20 group-hover:text-white/40">
                  {code}
                </span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mt-auto border-t border-white/10 pt-5">
          <p className="text-[10px] tracking-[0.2em] text-white/20">
            SYSTEM STATUS
          </p>

          <div className="mt-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.6)]" />

            <span className="text-xs text-white/50">
              Operational
            </span>
          </div>

          {user && (
            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="text-[10px] tracking-[0.2em] text-white/20">
                CURRENT SESSION
              </p>

              <div className="mt-2 truncate text-xs text-white/60">
                {user.email || user.name}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 flex w-full items-center gap-2 border border-white/10 px-3 py-2 text-xs text-white/40 transition hover:border-orange-500/40 hover:bg-orange-500/[0.05] hover:text-orange-400"
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
