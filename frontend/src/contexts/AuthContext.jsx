import { useState } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContextValue';

const getStoredUser = () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (token && role) {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    return { token, role };
  }

  return null;
};

function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const loading = false;

  const login = async (username, password) => {
    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        username,
        password
      });
      
      const { token, role } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      setUser({ token, role });
      
      return true;
    } catch (error) {
      console.error("Login failed", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    delete axios.defaults.headers.common.Authorization;
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export { AuthProvider, AuthContext };
export default AuthProvider;
