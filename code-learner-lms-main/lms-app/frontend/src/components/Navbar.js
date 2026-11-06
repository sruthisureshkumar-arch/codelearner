import React from 'react';

const Navbar = ({ userName, userRole, onLogout, courses = [], activeCourseCode, activeCourseName, onSwitchCourse }) => {
  return (
    <header className="dash-header" style={{ background: '#0f6cbf', padding: '0 20px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.15)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
          <rect width="100" height="100" rx="8" fill="white" fillOpacity="0.2"/>
          <text x="50" y="68" textAnchor="middle" fontSize="52" fontWeight="bold" fill="white">M</text>
        </svg>
        <span style={{ color: 'white', fontSize: 18, fontWeight: 600 }}>Code Learner LMS</span>
        <span style={{ color: 'rgba(255,255,255,0.4)', margin: '0 6px' }}>|</span>
        {courses.length > 0 ? (
          <select
            value={activeCourseCode || ''}
            onChange={(e) => onSwitchCourse && onSwitchCourse(e.target.value)}
            title="Switch active course"
            aria-label="Switch active course"
            style={{
              background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 4, fontSize: 13, padding: '4px 8px', cursor: 'pointer',
            }}
          >
            {courses.map((c) => (
              <option key={c.code} value={c.code} style={{ color: '#333' }}>
                {c.code} – {c.name}
              </option>
            ))}
          </select>
        ) : (
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
            {activeCourseName || 'No courses yet'}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 600 }}>
            {userName ? userName.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <div style={{ color: 'white', fontSize: 13, fontWeight: 500, lineHeight: 1.2 }}>{userName}</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, lineHeight: 1.2 }}>{userRole === 'teacher' ? 'Teacher' : 'Student'}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '5px 14px', borderRadius: 4, fontSize: 13, cursor: 'pointer' }}
        >
          Log out
        </button>
      </div>
    </header>
  );
};

export default Navbar;
