import { useEffect, useState } from "react";
import {
  CalendarDays,
  Plus,
  Trash2,
  Trophy,
  Layers3,
  Clock3,
  Users,
  FolderKanban
} from "lucide-react";
import api from "../services/api";

const emptyForm = {
  name: "",
  description: "",
  start_date: "",
  end_date: "",
  submission_deadline: "",
  tracks: [
    {
      name: "",
      description: ""
    }
  ],
  prizes: [
    {
      position: 1,
      name: "",
      description: "",
      amount: ""
    }
  ]
};

function EventManagement() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadEvents = async () => {
    try {
      setLoading(true);

      const response = await api.get("/events");

      setEvents(response.data?.events || []);
    } catch (err) {
      console.error("Failed to load events:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load events."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const updateTrack = (index, field, value) => {
    setForm((current) => {
      const tracks = [...current.tracks];

      tracks[index] = {
        ...tracks[index],
        [field]: value
      };

      return {
        ...current,
        tracks
      };
    });
  };

  const addTrack = () => {
    setForm((current) => ({
      ...current,
      tracks: [
        ...current.tracks,
        {
          name: "",
          description: ""
        }
      ]
    }));
  };

  const removeTrack = (index) => {
    setForm((current) => ({
      ...current,
      tracks: current.tracks.filter(
        (_, trackIndex) => trackIndex !== index
      )
    }));
  };

  const updatePrize = (index, field, value) => {
    setForm((current) => {
      const prizes = [...current.prizes];

      prizes[index] = {
        ...prizes[index],
        [field]: value
      };

      return {
        ...current,
        prizes
      };
    });
  };

  const addPrize = () => {
    setForm((current) => ({
      ...current,
      prizes: [
        ...current.prizes,
        {
          position: current.prizes.length + 1,
          name: "",
          description: "",
          amount: ""
        }
      ]
    }));
  };

  const removePrize = (index) => {
    setForm((current) => ({
      ...current,
      prizes: current.prizes.filter(
        (_, prizeIndex) => prizeIndex !== index
      )
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setCreating(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),

        start_date: form.start_date,
        end_date: form.end_date,
        submission_deadline: form.submission_deadline,

        status: "draft",

        tracks: form.tracks
          .filter((track) => track.name.trim())
          .map((track) => ({
            name: track.name.trim(),
            description:
              track.description.trim() || null
          })),

        prizes: form.prizes
          .filter((prize) => prize.name.trim())
          .map((prize) => ({
            position:
              prize.position === ""
                ? null
                : Number(prize.position),

            name: prize.name.trim(),

            description:
              prize.description.trim() || null,

            amount:
              prize.amount === ""
                ? null
                : Number(prize.amount)
          }))
      };

      const response = await api.post(
        "/events",
        payload
      );

      setMessage(
        response.data?.message ||
          "Event created successfully."
      );

      setForm(emptyForm);

      await loadEvents();
    } catch (err) {
      console.error("Failed to create event:", err);

      setError(
        err.response?.data?.message ||
          "Failed to create event."
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0705] text-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="text-xs tracking-[0.35em] text-orange-400 mb-2">
              EVENT MANAGEMENT / 01
            </div>

            <h1 className="text-3xl md:text-4xl font-bold">
              Create & Configure Event
            </h1>

            <p className="text-slate-400 mt-2 max-w-2xl">
              Configure hackathon dates, submission deadlines,
              tracks, prizes, and event details.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CalendarDays
              size={16}
              className="text-orange-400"
            />

            {events.length} EVENT
            {events.length === 1 ? "" : "S"} REGISTERED
          </div>
        </div>

        {message && (
          <div className="border border-orange-500/30 bg-orange-500/10 text-orange-300 px-4 py-3 rounded-lg text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="border border-red-400/30 bg-red-400/10 text-red-300 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-8">

          <form
            onSubmit={handleSubmit}
            className="border border-orange-500/20 bg-[#1a0f0a] rounded-2xl p-6 space-y-7 shadow-[0_0_30px_rgba(249,115,22,0.04)]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Plus
                  size={20}
                  className="text-orange-400"
                />
              </div>

              <div>
                <h2 className="font-semibold text-lg">
                  New Event
                </h2>

                <p className="text-xs text-slate-500">
                  Create a fresh hackathon configuration
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Event name"
                className="w-full bg-[#0d0805] border border-[#3d261b] rounded-lg px-4 py-3 outline-none focus:border-orange-500"
              />

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="3"
                placeholder="Event description"
                className="w-full bg-[#0d0805] border border-[#3d261b] rounded-lg px-4 py-3 outline-none focus:border-orange-500 resize-none"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock3
                  size={16}
                  className="text-orange-400"
                />

                <span className="text-sm font-semibold">
                  Event Timeline
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                <label className="text-xs text-slate-400">
                  Start date

                  <input
                    type="datetime-local"
                    name="start_date"
                    value={form.start_date}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-[#3d261b] bg-[#0d0805] px-4 py-3.5 text-base text-white outline-none focus:border-orange-500"
                  />
                </label>

                <label className="text-xs text-slate-400">
                  End date

                  <input
                    type="datetime-local"
                    name="end_date"
                    value={form.end_date}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-[#3d261b] bg-[#0d0805] px-4 py-3.5 text-base text-white outline-none focus:border-orange-500"
                  />
                </label>

                <label className="text-xs text-slate-400 md:col-span-2">
                  Submission deadline

                  <input
                    type="datetime-local"
                    name="submission_deadline"
                    value={form.submission_deadline}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-[#3d261b] bg-[#0d0805] px-4 py-3.5 text-base text-white outline-none focus:border-orange-500"
                  />
                </label>

              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers3
                    size={16}
                    className="text-orange-400"
                  />

                  <span className="text-sm font-semibold">
                    Tracks
                  </span>
                </div>

                <button
                  type="button"
                  onClick={addTrack}
                  className="text-xs text-orange-400 hover:text-orange-300"
                >
                  + Add track
                </button>
              </div>

              <div className="space-y-3">
                {form.tracks.map((track, index) => (
                  <div
                    key={index}
                    className="border border-[#3d261b] rounded-lg p-3 space-y-2 bg-[#0d0805]"
                  >
                    <div className="flex gap-2">
                      <input
                        value={track.name}
                        onChange={(e) =>
                          updateTrack(
                            index,
                            "name",
                            e.target.value
                          )
                        }
                        placeholder={`Track ${index + 1} name`}
                        className="flex-1 bg-[#0d0805] border border-[#3d261b] rounded-lg px-3 py-2.5 outline-none focus:border-orange-500"
                      />

                      {form.tracks.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeTrack(index)
                          }
                          className="px-2 text-slate-500 hover:text-orange-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <input
                      value={track.description}
                      onChange={(e) =>
                        updateTrack(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                      placeholder="Track description"
                      className="w-full bg-[#0d0805] border border-[#3d261b] rounded-lg px-3 py-2.5 outline-none focus:border-orange-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Trophy
                    size={16}
                    className="text-orange-400"
                  />

                  <span className="text-sm font-semibold">
                    Prizes
                  </span>
                </div>

                <button
                  type="button"
                  onClick={addPrize}
                  className="text-xs text-orange-400 hover:text-orange-300"
                >
                  + Add prize
                </button>
              </div>

              <div className="space-y-3">
                {form.prizes.map((prize, index) => (
                  <div
                    key={index}
                    className="border border-[#3d261b] rounded-lg p-3 space-y-2 bg-[#0d0805]"
                  >
                    <div className="grid grid-cols-[70px_1fr_120px_auto] gap-2">

                      <input
                        type="number"
                        min="1"
                        value={prize.position}
                        onChange={(e) =>
                          updatePrize(
                            index,
                            "position",
                            e.target.value
                          )
                        }
                        placeholder="#"
                        className="bg-[#0d0805] border border-[#3d261b] rounded-lg px-3 py-2.5 outline-none focus:border-orange-500"
                      />

                      <input
                        value={prize.name}
                        onChange={(e) =>
                          updatePrize(
                            index,
                            "name",
                            e.target.value
                          )
                        }
                        placeholder={`Prize ${index + 1} name`}
                        className="bg-[#0d0805] border border-[#3d261b] rounded-lg px-3 py-2.5 outline-none focus:border-orange-500"
                      />

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={prize.amount}
                        onChange={(e) =>
                          updatePrize(
                            index,
                            "amount",
                            e.target.value
                          )
                        }
                        placeholder="Amount"
                        className="bg-[#0d0805] border border-[#3d261b] rounded-lg px-3 py-2.5 outline-none focus:border-orange-500"
                      />

                      {form.prizes.length > 1 ? (
                        <button
                          type="button"
                          onClick={() =>
                            removePrize(index)
                          }
                          className="px-2 text-slate-500 hover:text-orange-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <div />
                      )}
                    </div>

                    <input
                      value={prize.description}
                      onChange={(e) =>
                        updatePrize(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                      placeholder="Prize description"
                      className="w-full bg-[#0d0805] border border-[#3d261b] rounded-lg px-3 py-2.5 outline-none focus:border-orange-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-black font-bold py-3 rounded-lg transition"
            >
              <Plus size={18} />

              {creating
                ? "Creating event..."
                : "Create event"}
            </button>
          </form>

          <div className="border border-orange-500/20 bg-[#1a0f0a] rounded-2xl p-6 shadow-[0_0_30px_rgba(249,115,22,0.04)]">

            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-semibold text-lg">
                  Registered Events
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Seeded and newly created hackathons
                </p>
              </div>

              <button
                type="button"
                onClick={loadEvents}
                className="text-xs text-orange-400 hover:text-orange-300"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-sm text-slate-500">
                Loading events...
              </div>
            ) : events.length === 0 ? (
              <div className="text-sm text-slate-500">
                No events found.
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="border border-[#3d261b] rounded-xl p-4 bg-[#0d0805]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">
                          {event.name}
                        </h3>

                        <p className="text-xs text-slate-500 mt-1">
                          {event.description ||
                            "No description"}
                        </p>
                      </div>

                      <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-orange-500/10 text-orange-400">
                        {event.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-5">
                      <div className="flex items-center gap-2">
                        <Users
                          size={14}
                          className="text-orange-400"
                        />

                        <div>
                          <div className="text-[10px] text-slate-500 uppercase">
                            Teams
                          </div>

                          <div className="text-sm font-medium">
                            {event.team_count ?? 0}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <FolderKanban
                          size={14}
                          className="text-orange-400"
                        />

                        <div>
                          <div className="text-[10px] text-slate-500 uppercase">
                            Projects
                          </div>

                          <div className="text-sm font-medium">
                            {event.project_count ?? 0}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                      <div className="border border-[#2d1a12] rounded-lg p-3">
                        <div className="text-slate-500">
                          Tracks
                        </div>

                        <div className="mt-1 font-semibold text-orange-300">
                          {event.track_count ?? 0}
                        </div>
                      </div>

                      <div className="border border-[#2d1a12] rounded-lg p-3">
                        <div className="text-slate-500">
                          Prizes
                        </div>

                        <div className="mt-1 font-semibold text-orange-300">
                          {event.prize_count ?? 0}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 text-[10px] text-slate-500 uppercase tracking-wider">
                      Organizer: {event.organizer_name || "—"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default EventManagement;