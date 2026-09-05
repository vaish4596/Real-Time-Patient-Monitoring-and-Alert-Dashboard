import { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContextValue';
import { useNavigate } from 'react-router-dom';
import { Activity, Lock, User, ShieldCheck, HeartPulse } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const success = await login(username, password);

    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">

      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(6,182,212,0.15),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.18),transparent_35%)]" />

      {/* Animated glowing circles */}
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />

      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '45px 45px',
        }}
      />

      {/* Theme toggle */}
      <div className="absolute right-6 top-6 z-20 sm:right-10 sm:top-10">
        <ThemeToggle />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">

        <div className="w-full max-w-md">

          {/* Logo + Heading */}
          <div className="mb-8 text-center">

            {/* Logo */}
            <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">

              {/* Glow */}
              <div className="absolute inset-0 rounded-3xl bg-cyan-400/30 blur-xl" />

              {/* Logo container */}
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 shadow-[0_0_45px_rgba(6,182,212,0.35)]">

                <Activity
                  size={40}
                  strokeWidth={2}
                  className="text-white"
                />

              </div>

              {/* Heart pulse badge */}
              <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-cyan-300/40 bg-slate-900 shadow-lg">
                <HeartPulse
                  size={15}
                  className="text-cyan-300"
                />
              </div>
            </div>

            {/* Heading */}
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Real-Time Patient
              <span className="block bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Monitoring Dashboard
              </span>
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-400">
              Real-time vitals, AI risk scoring, and intelligent
              clinical alerts in one secure platform.
            </p>

          </div>

          {/* Login Card */}
          <div className="relative">

            {/* Card glow */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 blur-xl" />

            <div className="relative rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl sm:p-8">

              {/* Card header */}
              <div className="mb-7">
                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 ring-1 ring-cyan-400/20">
                    <ShieldCheck
                      size={21}
                      className="text-cyan-300"
                    />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Secure Sign In
                    </h2>

                    <p className="text-xs text-slate-500">
                      Access your clinical monitoring console
                    </p>
                  </div>

                </div>
              </div>

              <form
                className="space-y-5"
                onSubmit={handleSubmit}
              >

                {/* Error */}
                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300"
                  >
                    {error}
                  </div>
                )}

                {/* Username */}
                <div>
                  <label
                    htmlFor="login-username"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Username
                  </label>

                  <div className="group relative">

                    <User
                      size={18}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 transition group-focus-within:text-cyan-400"
                    />

                    <input
                      id="login-username"
                      type="text"
                      required
                      autoComplete="username"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 hover:border-white/20 focus:border-cyan-400/50 focus:bg-black/30 focus:ring-4 focus:ring-cyan-400/10"
                    />

                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="login-password"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Password
                  </label>

                  <div className="group relative">

                    <Lock
                      size={18}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 transition group-focus-within:text-cyan-400"
                    />

                    <input
                      id="login-password"
                      type="password"
                      required
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 hover:border-white/20 focus:border-cyan-400/50 focus:bg-black/30 focus:ring-4 focus:ring-cyan-400/10"
                    />

                  </div>
                </div>

                {/* Login button */}
                <button
                  type="submit"
                  className="group relative mt-2 w-full overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                >

                  {/* Shine animation */}
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                  <span className="relative flex items-center justify-center gap-2">
                    Sign in to dashboard
                    <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </span>

                </button>

              </form>

              {/* Security information */}
              <div className="mt-7 border-t border-white/10 pt-5">

                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                  <ShieldCheck
                    size={14}
                    className="text-cyan-500"
                  />
                  Secure access · Role-based monitoring
                </div>

              </div>

            </div>
          </div>

          {/* Footer */}
          <p className="mt-7 text-center text-xs text-slate-600">
            Patient Monitoring & Alert System
          </p>

        </div>
      </div>
    </div>
  );
}