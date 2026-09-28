import { Activity, Circle } from "lucide-react";

function CommandHeader() {
  return (
    <header className="mb-10 flex items-center justify-between border-b border-white/10 pb-5">
      <div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold tracking-[0.25em] text-orange-500">
            RAPTOROS
          </span>

          <span className="text-xs text-white/20">/</span>

          <span className="text-xs tracking-[0.2em] text-white/40">
            EVENT CONTROL
          </span>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Circle size={7} fill="currentColor" className="text-orange-500" />
          <span className="text-xs uppercase tracking-widest text-white/50">
            System operational
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 border border-white/10 bg-white/[0.02] px-4 py-2">
        <Activity size={16} className="text-orange-500" />
        <span className="text-xs tracking-wider text-white/60">
          LIVE EVENT
        </span>
      </div>
    </header>
  );
}

export default CommandHeader;