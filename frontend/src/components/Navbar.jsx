import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem('token');

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
      console.error('Logout error:', error);

      // If the request failed due to auth middleware (e.g. token missing/invalid),
      // still clear client-side state.
    } finally {
      // Always clear localStorage and redirect, regardless of backend response
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);

      // Force route change even if state updates are blocked
      navigate('/login', { replace: true });
      window.location.reload();
    }
  };

  const hideNavbarRoutes = ['/login', '/register'];
  if (hideNavbarRoutes.includes(location.pathname)) {
    return null;
  }

  if (!token) {
    return null;
  }

  const isAdmin = user?.role === 'admin';

  const isActive = (path) => location.pathname === path;

  return (
<nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm fixed-top">
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
            <Link 
              to="/settings"
              className="text-decoration-none text-dark"
            >
              <div className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                     style={{ width: '35px', height: '35px', fontSize: '14px', fontWeight: '600' }}>
                  {(user?.name?.charAt(0) || 'U').toUpperCase()}
                </div>

              </div>
            </Link>

            <div className="dropdown">
              <button 
                className="btn btn-sm btn-outline-danger"
                type="button"
                id="logoutDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/>
                  <path fillRule="evenodd" d="M15.854 5.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708l2.147-2.146H5.5a.5.5 0 0 1 0-1h9.793l-2.147-2.146a.5.5 0 0 1 .708-.708l3 3z"/>
                </svg>
              </button>
              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="logoutDropdown">
                <li>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleLogout();
                    }}
                    className="dropdown-item text-danger"
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
