import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [schoolId, setSchoolId] = useState(localStorage.getItem('schoolId') || null);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
      if (response.data.school_id) {
        setSchoolId(response.data.school_id);
        localStorage.setItem('schoolId', response.data.school_id);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    const { access_token, user: userData } = response.data;
    
    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    
    setToken(access_token);
    setUser(userData);
    
    if (userData.school_id) {
      setSchoolId(userData.school_id);
      localStorage.setItem('schoolId', userData.school_id);
    }
    
    return userData;
  };

  const setupDirector = async (userData) => {
    const response = await axios.post(`${API}/auth/setup-director`, userData);
    const { access_token, user: newUser } = response.data;
    
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(newUser));
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    
    setToken(access_token);
    setUser(newUser);
    
    return newUser;
  };

  const studentLogin = async (studentId, password) => {
    const response = await axios.post(`${API}/students/login?student_id=${encodeURIComponent(studentId)}&password=${encodeURIComponent(password)}`);
    const { access_token, student } = response.data;
    
    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    
    // Add role to student object for consistency
    const userData = { ...student, role: 'student' };
    
    setToken(access_token);
    setUser(userData);
    
    if (student.school_id) {
      setSchoolId(student.school_id);
      localStorage.setItem('schoolId', student.school_id);
    }
    
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('schoolId');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setSchoolId(null);
  };

  const selectSchool = (id) => {
    setSchoolId(id);
    localStorage.setItem('schoolId', id);
  };

  const hasPermission = (allowedRoles) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      token,
      setToken,
      loading,
      schoolId,
      login,
      studentLogin,
      setupDirector,
      logout,
      selectSchool,
      hasPermission,
      isAuthenticated: !!token && !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
