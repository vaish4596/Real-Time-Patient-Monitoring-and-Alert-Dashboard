import { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthContext } from './contexts/AuthContextValue';
import Login from './pages/Login';
import DoctorDashboard from './pages/DoctorDashboard';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />; // Or an unauthorized page
  }

  return children;
};

const DashboardRouter = () => {
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'DOCTOR':
    case 'ADMIN':
      return <DoctorDashboard />;
    default:
      return (
        <div className="min-h-screen flex items-center justify-center mesh-bg-light dark:mesh-bg-dark px-4">
          <div className="text-center p-10 rounded-2xl border border-slate-200/80 bg-white/85 shadow-xl shadow-slate-900/5 backdrop-blur-md dark:border-cyan-500/25 dark:bg-black dark:shadow-[0_0_50px_-12px_rgba(34,211,238,0.15)]">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Dashboard</h2>
            <p className="text-slate-500 dark:text-zinc-400 mt-2">
              Dashboard not implemented for role: {user.role}
            </p>
          </div>
        </div>
      );
  }
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <DashboardRouter />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
