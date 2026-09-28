import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, ArrowLeft, ShieldCheck } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [isRegistering, setIsRegistering] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (isRegistering) {
        const response = await api.post("/auth/register", {
          name: form.name,
          email: form.email,
          password: form.password,
          role: "participant"
        });

        const { token, user } = response.data;

        login(token, user);
        navigate("/participant");
      } else {
        const response = await api.post("/auth/login", {
          email: form.email,
          password: form.password
        });

        const { token, user } = response.data;

        login(token, user);

        if (user.role === "judge") {
          navigate("/judge");
        } else if (
          user.role === "organizer" ||
          user.role === "admin"
        ) {
          navigate("/control-room");
        } else {
          navigate("/participant");
        }
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          (isRegistering
            ? "Registration failed. Please try again."
            : "Login failed. Please check your credentials.")
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering((current) => !current);
    setError("");
    setMessage("");

    setForm({
      name: "",
      email: "",
      password: ""
    });
  };

  return (
    <div className="min-h-screen bg-[#0b0705] text-[#f4efe6]">
      <nav className="flex items-center justify-between border-b border-[#3d261b] px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center border border-orange-500/30 bg-orange-500/[0.05]">
            <Activity size={17} className="text-orange-500" />
          </div>

          <div>
            <h1 className="text-lg font-bold tracking-tight">
              RaptorOS
            </h1>

            <p className="text-[9px] tracking-[0.2em] text-[#665348]">
              EVENT OPERATING SYSTEM
            </p>
          </div>
        </div>

        <span className="hidden text-[9px] tracking-[0.25em] text-[#665348] sm:block">
          SECURE EVENT ACCESS
        </span>
      </nav>

      <main className="relative flex min-h-[calc(100vh-78px)] items-center justify-center overflow-hidden px-6 py-16">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/[0.025] blur-3xl" />

        <div className="relative w-full max-w-md">
          <div className="mb-7 text-center">
            <p className="text-[10px] tracking-[0.3em] text-orange-500">
              {isRegistering
                ? "PARTICIPANT REGISTRATION"
                : "PLATFORM ACCESS"}
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              {isRegistering
                ? "Create your account."
                : "Enter RaptorOS."}
            </h2>

            <p className="mt-2 text-sm text-[#806f63]">
              {isRegistering
                ? "Join a hackathon, build your team, and submit your work."
                : "Access the event control system."}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="border border-[#3d261b] bg-[#15100d] p-7 shadow-[0_20px_80px_rgba(0,0,0,0.35)]"
          >
            <div className="flex items-center justify-between border-b border-[#3d261b] pb-5">
              <div>
                <p className="text-[9px] tracking-[0.25em] text-[#665348]">
                  ACCESS NODE
                </p>

                <h3 className="mt-1 text-lg font-medium">
                  {isRegistering
                    ? "New participant"
                    : "Sign in"}
                </h3>
              </div>

              <div className="flex h-9 w-9 items-center justify-center border border-orange-500/20">
                <ShieldCheck
                  size={16}
                  className="text-orange-500"
                />
              </div>
            </div>

            {error && (
              <div className="mt-5 border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {message && (
              <div className="mt-5 border border-green-500/20 bg-green-500/[0.06] px-4 py-3 text-sm text-green-300">
                {message}
              </div>
            )}

            {isRegistering && (
              <div className="mt-6">
                <label className="text-[10px] tracking-[0.18em] text-[#806f63]">
                  FULL NAME
                </label>

                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                  className="mt-2 w-full border border-[#3d261b] bg-[#0d0805] px-4 py-3 text-sm text-[#f4efe6] outline-none transition placeholder:text-[#4f4037] focus:border-orange-500/50"
                />
              </div>
            )}

            <div className={isRegistering ? "mt-5" : "mt-6"}>
              <label className="text-[10px] tracking-[0.18em] text-[#806f63]">
                EMAIL
              </label>

              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="mt-2 w-full border border-[#3d261b] bg-[#0d0805] px-4 py-3 text-sm text-[#f4efe6] outline-none transition placeholder:text-[#4f4037] focus:border-orange-500/50"
              />
            </div>

            <div className="mt-5">
              <label className="text-[10px] tracking-[0.18em] text-[#806f63]">
                PASSWORD
              </label>

              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                minLength={6}
                className="mt-2 w-full border border-[#3d261b] bg-[#0d0805] px-4 py-3 text-sm text-[#f4efe6] outline-none transition placeholder:text-[#4f4037] focus:border-orange-500/50"
              />

              {isRegistering && (
                <p className="mt-2 text-[10px] text-[#5f4d43]">
                  Minimum 6 characters.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-7 flex w-full items-center justify-center gap-2 bg-orange-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? isRegistering
                  ? "Creating account..."
                  : "Authenticating..."
                : isRegistering
                  ? "Create participant account"
                  : "Enter RaptorOS"}
            </button>

            <button
              type="button"
              onClick={toggleMode}
              className="mt-5 w-full text-center text-xs text-[#806f63] transition hover:text-orange-400"
            >
              {isRegistering
                ? "Already have an account? Sign in"
                : "New participant? Create an account"}
            </button>
          </form>

          <Link
            to="/"
            className="mt-6 flex items-center justify-center gap-2 text-xs text-[#665348] transition hover:text-[#a98d7c]"
          >
            <ArrowLeft size={13} />
            Back to RaptorOS
          </Link>

          <div className="mt-8 flex items-center justify-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />

            <span className="font-mono text-[8px] tracking-[0.2em] text-[#4f4037]">
              RAPTOROS AUTHENTICATION NODE
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;