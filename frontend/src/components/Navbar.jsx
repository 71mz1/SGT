import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = async () => {
    try {
      // Call backend to revoke the Sanctum token
      await api.post('/logout');
    } catch (error) {
      // Even if logout fails, clear client-side storage to avoid keeping user stuck
      console.error('Logout error:', error.message);
    } finally {
      // Always clear localStorage and redirect, regardless of backend response
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      navigate('/login');
    }
  };

  // Don't show navbar on login/register pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  if (!user) {
    return null;
  }

  const isAdmin = user.role === 'admin';

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
      <div className="container">
        <Link to="/dashboard" className="navbar-brand fw-bold text-primary">
          SGT System
        </Link>

        <button
          className="navbar-toggler border-0"
          type="button"
          onClick={() => setIsNavCollapsed(!isNavCollapsed)}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`collapse navbar-collapse ${!isNavCollapsed ? 'show' : ''}`}>
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link
                to="/dashboard"
                className={`nav-link ${isActive('/dashboard') ? 'active fw-semibold' : ''}`}
                onClick={() => setIsNavCollapsed(true)}
              >
                Dashboard
              </Link>
            </li>

            {isAdmin ? (
              <>
                <li className="nav-item">
                  <Link
                    to="/members"
                    className={`nav-link ${isActive('/members') ? 'active fw-semibold' : ''}`}
                    onClick={() => setIsNavCollapsed(true)}
                  >
                    Members
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/groups"
                    className={`nav-link ${isActive('/groups') ? 'active fw-semibold' : ''}`}
                    onClick={() => setIsNavCollapsed(true)}
                  >
                    Groups
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/projects"
                    className={`nav-link ${isActive('/projects') ? 'active fw-semibold' : ''}`}
                    onClick={() => setIsNavCollapsed(true)}
                  >
                    Projects
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/tasks"
                    className={`nav-link ${isActive('/tasks') ? 'active fw-semibold' : ''}`}
                    onClick={() => setIsNavCollapsed(true)}
                  >
                    Tasks
                  </Link>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <Link
                  to="/tasks"
                  className={`nav-link ${isActive('/tasks') ? 'active fw-semibold' : ''}`}
                  onClick={() => setIsNavCollapsed(true)}
                >
                  My Tasks
                </Link>
              </li>
            )}
          </ul>

          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                   style={{ width: '35px', height: '35px', fontSize: '14px', fontWeight: '600' }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="d-none d-lg-block">
                <div className="small fw-medium">{user.name}</div>
                <div className="small text-muted text-capitalize">{user.role}</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="btn btn-outline-danger btn-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
