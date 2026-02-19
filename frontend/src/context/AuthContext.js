import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API = `${(process.env.REACT_APP_BACKEND_URL || '')}/api`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [schoolId, setSchoolId] = useState(localStorage.getItem('schoolId') || null);
  const [schoolData, setSchoolData] = useState(null);

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
        // Fetch school data
        try {
          const schoolRes = await axios.get(`${API}/schools/${response.data.school_id}`);
          setSchoolData(schoolRes.data);
        } catch (e) {
          console.error('Failed to fetch school data:', e);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Making login request to:', `${API}/auth/login`);
      const response = await axios.post(`${API}/auth/login`, { email, password });
      console.log('Login response:', response.status);
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      setToken(access_token);
      setUser(userData);
      
      if (userData.school_id) {
        setSchoolId(userData.school_id);
        localStorage.setItem('schoolId', userData.school_id);
        try {
          const schoolRes = await axios.get(`${API}/schools/${userData.school_id}`);
          setSchoolData(schoolRes.data);
        } catch (e) {
          console.error('Failed to fetch school data:', e);
        }
      }
      
      return userData;
    } catch (error) {
      console.error('Login API error:', error.message, error.response?.status, error.response?.data);
      throw error;
    }
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

  const studentLogin = async (payload) => {
    const response = await axios.post(`${API}/students/login`, payload);
    const { access_token, student } = response.data;
    
    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    
    const userData = { ...student, role: 'student' };
    localStorage.setItem('user', JSON.stringify(userData));
    
    setToken(access_token);
    setUser(userData);
    
    if (student.school_id) {
      setSchoolId(student.school_id);
      localStorage.setItem('schoolId', student.school_id);
      try {
        const schoolRes = await axios.get(`${API}/schools/${student.school_id}`);
        setSchoolData(schoolRes.data);
      } catch (e) {
        console.error('Failed to fetch school data:', e);
      }
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

  const refreshSchoolData = async () => {
    if (!schoolId) return;
    try {
      const schoolRes = await axios.get(`${API}/schools/${schoolId}`);
      setSchoolData(schoolRes.data);
    } catch (e) {
      console.error('Failed to refresh school data:', e);
    }
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
      schoolData,
      login,
      studentLogin,
      setupDirector,
      logout,
      selectSchool,
      refreshSchoolData,
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
