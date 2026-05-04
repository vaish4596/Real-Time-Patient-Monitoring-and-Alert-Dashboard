import { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContextValue';
import { useNavigate } from 'react-router-dom';
import { Activity, Lock, User } from 'lucide-react';
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
    <div className="relative min-h-screen mesh-bg-light dark:mesh-bg-dark flex flex-col justify-center py-16 px-4 sm:px-6 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2240%22%20height=%2240%22%20viewBox=%220%200%2040%2040%22%3E%3Cg%20fill=%22none%22%20stroke=%22%2394a3b8%22%20stroke-opacity=%220.08%22%20stroke-width=%221%22%3E%3Cpath%20d=%22M0%20h40M40%200%20v40%22/%3E%3C/g%3E%3C/svg%3E')] opacity-60 dark:opacity-25 dark:[filter:invert(1)]" />

      <div className="absolute right-4 top-4 sm:right-8 sm:top-8 z-10">
        <ThemeToggle />
      </div>

      <div className="relative sm:mx-auto w-full max-w-md">
        <div className="text-center mb-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-teal-400 to-fuchsia-600 text-white shadow-lg shadow-cyan-500/35 ring-4 ring-white/50 dark:ring-cyan-500/35 dark:shadow-[0_0_40px_-6px_rgba(34,211,238,0.45)]">
            <Activity size={34} strokeWidth={2.25} />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Real-Time Patient Monitoring and Alert Dashboard 
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
            Real-time vitals, AI risk scoring, and clinical alerts
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white/80 p-8 shadow-xl shadow-slate-900/[0.06] backdrop-blur-xl dark:border-cyan-500/25 dark:bg-black dark:shadow-[0_0_50px_-12px_rgba(34,211,238,0.18)] dark:backdrop-blur-sm">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700 dark:border-red-500/40 dark:bg-black dark:text-red-300 dark:shadow-[inset_0_0_0_1px_rgba(248,113,113,0.15)]"
              >
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="login-username"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-zinc-300"
              >
                Username
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-cyan-500/70"
                  size={18}
                  aria-hidden
                />
                <input
                  id="login-username"
                  type="text"
                  required
                  autoComplete="username"
                  className="block w-full rounded-xl border border-slate-200 bg-white/90 py-2.5 pl-10 pr-3 text-slate-900 shadow-inner placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-cyan-500/25 dark:bg-black dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-cyan-400 dark:focus:ring-cyan-500/30 sm:text-sm"
                  placeholder="doctor1"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-zinc-300"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-cyan-500/70"
                  size={18}
                  aria-hidden
                />
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="block w-full rounded-xl border border-slate-200 bg-white/90 py-2.5 pl-10 pr-3 text-slate-900 shadow-inner placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-cyan-500/25 dark:bg-black dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-cyan-400 dark:focus:ring-cyan-500/30 sm:text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-fuchsia-600 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-600/35 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 dark:focus:ring-offset-black"
            >
              Sign in to dashboard
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-slate-500 dark:text-zinc-600">
          Secure access · Role-based monitoring console
        </p>
      </div>
    </div>
  );
}
