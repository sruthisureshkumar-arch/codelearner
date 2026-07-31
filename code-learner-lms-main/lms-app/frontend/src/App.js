import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';

function App() {
  const [auth, setAuth] = useState(null);
  const [checking, setChecking] = useState(true);

  // Auto-logout when any request gets a 401 (expired/invalid token)
  useEffect(() => {
    const id = axios.interceptors.response.use(
      res => res,
      err => {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          delete axios.defaults.headers.common['Authorization'];
          setAuth(null);
        }
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(id);
  }, []);
  const [courses, setCourses] = useState([]);
  const [activeCourseCode, setActiveCourseCode] = useState(null);

  // Load this user's courses (teacher: created courses, student: enrolled courses)
  const fetchCourses = useCallback(async (currentUser) => {
    if (!currentUser) return;
    try {
      const endpoint = currentUser.role === 'teacher' ? '/api/courses/mine' : '/api/courses/enrolled';
      const res = await axios.get(endpoint);
      setCourses(res.data);
      setActiveCourseCode((prev) => {
        if (prev && res.data.some((c) => c.code === prev)) return prev;
        return res.data.length > 0 ? res.data[0].code : null;
      });
    } catch (e) {
      console.error('fetchCourses error:', e);
    }
  }, []);

  // Restore session on load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) {
      setChecking(false);
      return;
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    // Verify the token is still valid
    axios.get('/api/auth/me')
      .then((res) => {
        setAuth({ token, user: res.data.user });
        localStorage.setItem('user', JSON.stringify(res.data.user));
        fetchCourses(res.data.user);
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
      })
      .finally(() => setChecking(false));
  }, [fetchCourses]);

  const handleLogin = ({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setAuth({ token, user });
    fetchCourses(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setAuth(null);
    setCourses([]);
    setActiveCourseCode(null);
  };

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        Loading…
      </div>
    );
  }

  if (!auth) {
    return <Login onLogin={handleLogin} />;
  }

  const { user } = auth;
  // Active course = the one the user picked, falling back to their legacy
  // single-course assignment (or the original demo course) if they haven't
  // created/joined any course yet.
  const activeCourse = courses.find((c) => c.code === activeCourseCode);
  const courseId = activeCourseCode || user.courseId || 'course-001';
  const refreshCourses = () => fetchCourses(user);

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Navbar
        userName={user.name}
        userRole={user.role}
        onLogout={handleLogout}
        courses={courses}
        activeCourseCode={activeCourseCode}
        activeCourseName={activeCourse?.name}
        onSwitchCourse={setActiveCourseCode}
      />
      {user.role === 'teacher'
        ? <TeacherDashboard courseId={courseId} user={user} courses={courses} activeCourseCode={activeCourseCode} onCoursesChanged={refreshCourses} onSwitchCourse={setActiveCourseCode} />
        : <StudentDashboard courseId={courseId} user={user} courses={courses} activeCourseCode={activeCourseCode} onCoursesChanged={refreshCourses} onSwitchCourse={setActiveCourseCode} />}
    </div>
  );
}

export default App;
