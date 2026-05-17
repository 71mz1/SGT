import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { token, user, role, isAdmin, authLoading, logout } = useAuth();

  const hideNavbarRoutes = ['/login', '/register'];

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (hideNavbarRoutes.includes(location.pathname)) {
    return null;
  }

  if (authLoading) {
    return null;
  }

  if (!token || !user) {
    return null;
  }

  const navLinks = isAdmin
    ? [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Members', path: '/members' },
        { label: 'Groups', path: '/groups' },
        { label: 'Projects', path: '/projects' },
        { label: 'Tasks', path: '/tasks' },
      ]
    : [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'My Tasks', path: '/tasks' },
        { label: 'My Projects', path: '/projects' },
        { label: 'My Groups', path: '/groups' },
      ];

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm fixed-top" aria-label="Main navigation">
      <div className="container">
        <Link to="/dashboard" className="navbar-brand fw-bold text-primary">
          SGT System
        </Link>

        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="mainNavbar">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {navLinks.map((link) => (
              <li className="nav-item" key={link.path}>
                <Link
                  to={link.path}
                  className={`nav-link ${isActive(link.path) ? 'active fw-semibold text-primary' : ''}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <div
                className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: '35px',
                  height: '35px',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                {user.name?.charAt(0).toUpperCase()}
              </div>

              <div className="d-none d-lg-block">
                <div className="small fw-medium">{user.name}</div>
                <div className="small text-muted text-capitalize">{role}</div>
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
