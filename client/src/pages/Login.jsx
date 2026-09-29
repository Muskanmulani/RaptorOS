import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
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
    <div className="min-h-screen overflow-hidden bg-[#0b0705] text-[#f4efe6]">

      {/* NAVBAR */}
      <nav className="flex items-center justify-between border-b border-white/10 bg-[#0f0907] px-6 py-4 lg:px-8">

        <Link
          to="/"
          className="flex items-center gap-3"
        >
          <img
            src="/logo.png"
            alt="RaptorOS"
            className="h-14 w-14 object-contain"
          />

          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Raptor<span className="text-orange-500">OS</span>
            </h1>

            <p className="text-[10px] tracking-[0.18em] text-white/30">
              HACKATHON OPERATING SYSTEM
            </p>
          </div>
        </Link>

        <span className="hidden text-[9px] font-medium tracking-[0.25em] text-white/30 sm:block">
          SECURE EVENT ACCESS
        </span>
      </nav>

      {/* MAIN */}
      <main className="relative flex min-h-[calc(100vh-78px)] items-center justify-center overflow-hidden px-6 py-12">

        {/* BACKGROUND GLOW */}
        <div
          className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/[0.035] blur-3xl"
        />

        {/* SUBTLE ORBIT */}
        <div className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-500/[0.035]" />

        <div className="relative w-full max-w-md">

          {/* HEADING */}
          <div className="mb-7 text-center">

            <div className="mb-4 flex items-center justify-center gap-2">

              <span className="h-px w-8 bg-orange-500/30" />

              <span className="text-[9px] font-medium tracking-[0.3em] text-orange-500">
                {isRegistering
                  ? "PARTICIPANT REGISTRATION"
                  : "PLATFORM ACCESS"}
              </span>

              <span className="h-px w-8 bg-orange-500/30" />

            </div>

            <h2 className="text-3xl font-semibold tracking-tight">
              {isRegistering
                ? "Create your account."
                : "Enter RaptorOS."}
            </h2>

            <p className="mt-3 text-sm leading-6 text-white/35">
              {isRegistering
                ? "Join a hackathon, build your team, and submit your work."
                : "Access the event control system."}
            </p>

          </div>

          {/* LOGIN CARD */}
          <form
            onSubmit={handleSubmit}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#15100d]/95 p-7 shadow-[0_25px_100px_rgba(0,0,0,0.55)] backdrop-blur-sm"
          >

            {/* CARD TOP GLOW */}
            <div className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />

            {/* CARD INNER GLOW */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-orange-500/[0.035] blur-3xl" />

            {/* ACCESS NODE HEADER */}
            <div className="relative flex items-center justify-between border-b border-white/[0.07] pb-5">

              <div>

                <div className="flex items-center gap-2">

                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]" />

                  <p className="text-[9px] font-semibold tracking-[0.25em] text-orange-400">
                    ACCESS NODE
                  </p>

                </div>

                <h3 className="mt-2 text-lg font-medium text-[#f4efe6]">
                  {isRegistering
                    ? "New participant"
                    : "Sign in"}
                </h3>

              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/[0.04]">
                <ShieldCheck
                  size={17}
                  className="text-orange-500"
                />
              </div>

            </div>

            {/* ERROR */}
            {error && (
              <div className="mt-5 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* MESSAGE */}
            {message && (
              <div className="mt-5 rounded-lg border border-green-500/20 bg-green-500/[0.06] px-4 py-3 text-sm text-green-300">
                {message}
              </div>
            )}

            {/* NAME */}
            {isRegistering && (
              <div className="relative mt-6">

                <label className="text-[10px] font-semibold tracking-[0.18em] text-white/55">
                  FULL NAME
                </label>

                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                  className="mt-2 w-full rounded-lg border border-white/[0.08] bg-[#0d0805] px-4 py-3 text-sm text-[#f4efe6] outline-none transition duration-300 placeholder:text-white/20 hover:border-orange-500/20 focus:border-orange-500/50 focus:bg-[#110a07] focus:shadow-[0_0_25px_rgba(249,115,22,0.06)]"
                />

              </div>
            )}

            {/* EMAIL */}
            <div className={isRegistering ? "mt-5" : "mt-6"}>

              <label className="text-[10px] font-semibold tracking-[0.18em] text-white/55">
                EMAIL
              </label>

              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="mt-2 w-full rounded-lg border border-white/[0.08] bg-[#0d0805] px-4 py-3 text-sm text-[#f4efe6] outline-none transition duration-300 placeholder:text-white/20 hover:border-orange-500/20 focus:border-orange-500/50 focus:bg-[#110a07] focus:shadow-[0_0_25px_rgba(249,115,22,0.06)]"
              />

            </div>

            {/* PASSWORD */}
            <div className="mt-5">

              <label className="text-[10px] font-semibold tracking-[0.18em] text-white/55">
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
                className="mt-2 w-full rounded-lg border border-white/[0.08] bg-[#0d0805] px-4 py-3 text-sm text-[#f4efe6] outline-none transition duration-300 placeholder:text-white/20 hover:border-orange-500/20 focus:border-orange-500/50 focus:bg-[#110a07] focus:shadow-[0_0_25px_rgba(249,115,22,0.06)]"
              />

              {isRegistering && (
                <p className="mt-2 text-[10px] text-white/25">
                  Minimum 6 characters.
                </p>
              )}

            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-[#0b0705] shadow-[0_0_25px_rgba(249,115,22,0.08)] transition duration-300 hover:bg-orange-400 hover:shadow-[0_0_35px_rgba(249,115,22,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? isRegistering
                  ? "Creating account..."
                  : "Authenticating..."
                : isRegistering
                  ? "Create participant account"
                  : "Enter RaptorOS"}
            </button>

            {/* TOGGLE */}
            <button
              type="button"
              onClick={toggleMode}
              className="mt-5 w-full text-center text-xs text-white/35 transition duration-300 hover:text-orange-400"
            >
              {isRegistering
                ? "Already have an account? Sign in"
                : "New participant? Create an account"}
            </button>

          </form>

          {/* BACK TO LANDING */}
          <Link
            to="/"
            className="mt-6 flex items-center justify-center gap-2 text-xs text-white/25 transition duration-300 hover:text-orange-400"
          >
            <ArrowLeft size={13} />
            Back to RaptorOS
          </Link>

          {/* STATUS */}
          <div className="mt-7 flex items-center justify-center gap-2">

            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.7)]" />

            <span className="font-mono text-[8px] tracking-[0.2em] text-white/20">
              RAPTOROS AUTHENTICATION NODE
            </span>

          </div>

        </div>
      </main>
    </div>
  );
}

export default Login;