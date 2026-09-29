import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ChevronDown,
  Clock3,
  FileSearch,
  RefreshCw,
  ShieldCheck,
  UserRound
} from "lucide-react";
import CommandHeader from "../components/CommandHeader";
import api from "../services/api";

function DecisionLedger() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState("all");

  const loadLogs = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const eventId = localStorage.getItem("raptoros_event_id");

      const response = await api.get("/audit", {
        params: {
          ...(eventId ? { eventId } : {}),
          limit: 100
        }
      });

      setLogs(response.data.logs || []);
    } catch (error) {
      console.error("Failed to load audit logs:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load the decision ledger."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const actionTypes = useMemo(() => {
    const values = new Set(
      logs.map((log) => log.action).filter(Boolean)
    );

    return Array.from(values);
  }, [logs]);

  const filteredLogs = useMemo(() => {
    if (filter === "all") {
      return logs;
    }

    return logs.filter((log) => log.action === filter);
  }, [logs, filter]);

  const formatDate = (value) => {
    if (!value) {
      return "Unknown time";
    }

    return new Date(value).toLocaleString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatAction = (action) => {
    return String(action || "UNKNOWN")
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const getActionTone = (action) => {
    const value = String(action || "").toLowerCase();

    if (
      value.includes("conflict") ||
      value.includes("duplicate") ||
      value.includes("delete")
    ) {
      return "border-red-500/30 bg-red-500/[0.04] text-red-300";
    }

    if (
      value.includes("judge") ||
      value.includes("score") ||
      value.includes("assign")
    ) {
      return "border-orange-500/30 bg-orange-500/[0.04] text-orange-300";
    }

    if (
      value.includes("submit") ||
      value.includes("create") ||
      value.includes("accept")
    ) {
      return "border-emerald-500/20 bg-emerald-500/[0.04] text-emerald-300";
    }

    return "border-white/10 bg-white/[0.02] text-white/60";
  };

  return (
    <div>
      <CommandHeader />

      <section className="mb-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.3em] text-orange-400">
              INTEGRITY / 05
            </p>

            <h1 className="mt-3 text-5xl font-bold tracking-tight text-white">
              Decision Ledger
            </h1>

            <p className="mt-4 max-w-2xl text-base font-medium leading-6 text-white/60">
              A chronological record of event actions, judging decisions,
              assignments, submissions, and integrity events.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadLogs(true)}
            disabled={loading || refreshing}
            className="flex items-center gap-2 border border-white/15 bg-[#151310] px-4 py-3 text-[11px] font-semibold tracking-[0.15em] text-white/60 transition hover:border-orange-500/40 hover:text-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={refreshing ? "animate-spin" : ""}
            />
            REFRESH LEDGER
          </button>
        </div>
      </section>

      <section className="mb-8 grid gap-px border border-white/15 bg-white/10 md:grid-cols-3">
        <div className="bg-[#151310] p-6">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-white/50">
            RECORDED EVENTS
          </p>

          <p className="mt-3 font-mono text-3xl font-semibold text-white">
            {String(logs.length).padStart(2, "0")}
          </p>
        </div>

        <div className="bg-[#151310] p-6">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-white/50">
            EVENT ACTORS
          </p>

          <p className="mt-3 font-mono text-3xl font-semibold text-orange-400">
            {String(
              new Set(logs.map((log) => log.user_id).filter(Boolean)).size
            ).padStart(2, "0")}
          </p>
        </div>

        <div className="bg-[#151310] p-6">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-white/50">
            ACTION TYPES
          </p>

          <p className="mt-3 font-mono text-3xl font-semibold text-white">
            {String(actionTypes.length).padStart(2, "0")}
          </p>
        </div>
      </section>

      {error && (
        <div className="mb-8 flex items-center gap-3 border border-red-500/25 bg-red-500/[0.05] px-6 py-4">
          <AlertCircle size={17} className="text-red-400" />

          <p className="text-sm font-semibold text-red-300">
            {error}
          </p>
        </div>
      )}

      <section className="mb-6 flex flex-wrap items-center justify-between gap-4 border-y border-white/15 py-4">
        <div className="flex items-center gap-3">
          <ShieldCheck size={16} className="text-orange-400" />

          <span className="text-[11px] font-semibold tracking-[0.2em] text-white/55">
            EVENT INTEGRITY STREAM
          </span>
        </div>

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="border border-white/15 bg-[#151310] px-3 py-2 text-sm font-medium text-white/70 outline-none focus:border-orange-500/50"
        >
          <option value="all">ALL ACTIONS</option>

          {actionTypes.map((action) => (
            <option key={action} value={action}>
              {formatAction(action).toUpperCase()}
            </option>
          ))}
        </select>
      </section>

      {loading && (
        <div className="border border-white/10 bg-[#151310] px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 animate-pulse rounded-full bg-orange-400" />

            <p className="text-[11px] font-semibold tracking-[0.2em] text-white/50">
              READING DECISION LEDGER...
            </p>
          </div>
        </div>
      )}

      {!loading && filteredLogs.length === 0 && (
        <div className="border border-white/10 bg-[#151310] p-12 text-center">
          <FileSearch
            size={29}
            className="mx-auto text-white/35"
          />

          <p className="mt-4 text-sm font-medium text-white/60">
            No audit events found for the current filter.
          </p>
        </div>
      )}

      {!loading && filteredLogs.length > 0 && (
        <section className="relative border-l border-white/10">
          <div className="absolute bottom-0 left-[-1px] top-0 w-px bg-gradient-to-b from-orange-500/70 via-white/10 to-transparent" />

          {filteredLogs.map((log) => {
            const isExpanded = expandedId === log.id;

            return (
              <article
                key={log.id}
                className="relative border-b border-r border-t border-white/10 bg-[#151310] transition hover:bg-white/[0.02]"
              >
                <div className="absolute left-[-5px] top-7 h-2 w-2 border border-orange-500 bg-[#11100e]" />

                <button
                  type="button"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : log.id)
                  }
                  className="w-full px-6 py-6 text-left"
                >
                  <div className="grid gap-5 md:grid-cols-[180px_1fr_auto] md:items-start">
                    <div>
                      <div className="flex items-center gap-2 text-white/45">
                        <Clock3 size={14} />

                        <span className="font-mono text-[11px] font-medium">
                          {formatDate(log.created_at)}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <UserRound
                          size={14}
                          className="text-white/35"
                        />

                        <span className="text-sm font-medium text-white/60">
                          {log.user_name || "System"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`border px-2 py-1 text-[10px] font-semibold tracking-[0.15em] ${getActionTone(
                            log.action
                          )}`}
                        >
                          {formatAction(log.action).toUpperCase()}
                        </span>

                        <span className="font-mono text-[11px] font-medium text-white/40">
                          {log.entity_type || "system"}
                        </span>
                      </div>

                      <p className="mt-3 text-base font-medium text-white/70">
                        {log.entity_id
                          ? `Entity ${log.entity_id}`
                          : "System-level event"}
                      </p>
                    </div>

                    <ChevronDown
                      size={17}
                      className={`mt-1 text-white/35 transition ${
                        isExpanded ? "rotate-180 text-orange-400" : ""
                      }`}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-white/10 bg-black/10 px-6 py-5">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <p className="text-[10px] font-semibold tracking-[0.2em] text-white/40">
                          ACTOR
                        </p>

                        <p className="mt-2 text-sm font-medium text-white/70">
                          {log.user_name || "System"}
                        </p>

                        {log.user_email && (
                          <p className="mt-1 text-sm font-medium text-white/45">
                            {log.user_email}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold tracking-[0.2em] text-white/40">
                          ENTITY
                        </p>

                        <p className="mt-2 font-mono text-sm font-medium text-white/60">
                          {log.entity_type || "system"}
                          {log.entity_id
                            ? ` / ${log.entity_id}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <p className="text-[10px] font-semibold tracking-[0.2em] text-white/40">
                        EVENT METADATA
                      </p>

                      <pre className="mt-3 overflow-x-auto border border-white/10 bg-[#11100e] p-4 font-mono text-xs font-medium leading-5 text-white/55">
                        {JSON.stringify(
                          log.metadata || {},
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}

      <section className="mt-8 flex items-center gap-3 border border-orange-500/20 bg-orange-500/[0.03] px-5 py-4">
        <Activity size={16} className="text-orange-400" />

        <p className="text-sm font-medium leading-5 text-white/55">
          Every recorded action remains attributable to an actor and
          entity, creating a traceable event history for operational review.
        </p>
      </section>
    </div>
  );
}

export default DecisionLedger;