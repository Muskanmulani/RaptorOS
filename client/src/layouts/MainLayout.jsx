import { Outlet, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Gavel,
  ShieldCheck,
  Activity
} from "lucide-react";

function MainLayout() {
  const links = [
    { to: "/dashboard", label: "Command", code: "01", icon: LayoutDashboard },
    { to: "/gallery", label: "Projects", code: "02", icon: FolderKanban },
    { to: "/judge", label: "Judging", code: "03", icon: Gavel },
    { to: "/control-room", label: "Control", code: "04", icon: ShieldCheck }
  ];

  return (
    <div className="min-h-screen bg-[#11100e] text-[#f4efe6]">
      <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-white/10 bg-[#151310] p-6">
        <div className="border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center border border-orange-500/50 text-orange-500">
              <Activity size={18} />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight">RaptorOS</h1>
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
            <span className="text-xs text-white/50">Operational</span>
          </div>
        </div>
      </aside>

      <main className="ml-64 min-h-screen p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;