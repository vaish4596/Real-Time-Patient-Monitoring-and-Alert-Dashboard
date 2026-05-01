import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
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
      return <DoctorDashboard />;
    // Other roles to be implemented in full version
    default:
      return <div>Dashboard not implemented for this role</div>;
  }
};

function App() {
  return (
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
  );
}

export default App;
