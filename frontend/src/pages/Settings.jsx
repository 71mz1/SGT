import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Settings = () => {
  const [user, setUser] = useState(null);
  const [appearance, setAppearance] = useState('system');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const userResponse = await api.get('/me');
        setUser(userResponse.data);
        
        // Load appearance preference from localStorage
        const savedAppearance = localStorage.getItem('appearance') || 'system';
        setAppearance(savedAppearance);
        applyAppearance(savedAppearance);
      } catch (error) {
        setError('Failed to load settings');
        if (error.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const applyAppearance = (mode) => {
    const html = document.documentElement;
    
    if (mode === 'dark') {
      html.setAttribute('data-bs-theme', 'dark');
      document.body.style.backgroundColor = '#212529';
      document.body.style.color = '#f8f9fa';
    } else if (mode === 'light') {
      html.setAttribute('data-bs-theme', 'light');
      document.body.style.backgroundColor = '#f8f9fa';
      document.body.style.color = '#212529';
    } else {
      // System mode
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        html.setAttribute('data-bs-theme', 'dark');
        document.body.style.backgroundColor = '#212529';
        document.body.style.color = '#f8f9fa';
      } else {
        html.setAttribute('data-bs-theme', 'light');
        document.body.style.backgroundColor = '#f8f9fa';
        document.body.style.color = '#212529';
      }
    }
  };

  const handleAppearanceChange = (mode) => {
    setAppearance(mode);
    localStorage.setItem('appearance', mode);
    applyAppearance(mode);
  };

  if (loading) {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div>

      <main className="container py-5">
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}

        <div className="row">
          {/* Main Content */}
          <div className="col-lg-12">
            {/* Profile Section */}
            <div className="card border-0 shadow-sm rounded-3 mb-4" id="profile">
              <div className="card-header bg-white border-bottom py-3">
                <h5 className="card-title mb-0">Profile Information</h5>
              </div>
              <div className="card-body">
                <div className="row mb-4">
                  <div className="col-md-4 text-center mb-4 mb-md-0">
                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                         style={{ width: '100px', height: '100px', fontSize: '40px', fontWeight: '600' }}>
                      {(user?.name?.charAt(0) || 'U').toUpperCase()}
                    </div>
                    <h5 className="card-title mb-0">{user?.name || 'Unknown User'}</h5>
                  </div>
                  <div className="col-md-8">
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label text-muted small">Full Name</label>
                        <div className="form-control-plaintext fw-medium">{user?.name}</div>
                      </div>
                      <div className="col-12">
                        <label className="form-label text-muted small">Email Address</label>
                        <div className="form-control-plaintext fw-medium">{user?.email}</div>
                      </div>
                      <div className="col-12">
                        <label className="form-label text-muted small">Role</label>
                        <div className="form-control-plaintext">
                          <span className={`badge ${user?.role === 'admin' ? 'bg-primary' : 'bg-secondary'}`}>
                            {user?.role === 'admin' ? 'Administrator' : 'Member'}
                          </span>
                        </div>
                      </div>
                      <div className="col-12">
                        <label className="form-label text-muted small">Member Since</label>
                        <div className="form-control-plaintext fw-medium">
                          {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Appearance Section */}
            <div className="card border-0 shadow-sm rounded-3" id="appearance">
              <div className="card-header bg-white border-bottom py-3">
                <h5 className="card-title mb-0">Appearance</h5>
              </div>
              <div className="card-body">
                
                <div className="row g-3">
                  {/* Light Mode */}
                  <div className="col-md-4">
                    <div 
                      className={`card border-2 ${appearance === 'light' ? 'border-primary' : 'border-light'}`}
                      style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                      onClick={() => handleAppearanceChange('light')}
                      onMouseEnter={(e) => {
                        if (appearance !== 'light') {
                          e.currentTarget.style.borderColor = '#4a69bd';
                          e.currentTarget.style.backgroundColor = '#f8f9fa';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (appearance !== 'light') {
                          e.currentTarget.style.borderColor = '#e9ecef';
                          e.currentTarget.style.backgroundColor = '#f5f7fa';
                        }
                      }}
                    >
                      <div className="card-body text-center">
                        <div className="mb-3" style={{ fontSize: '44px', lineHeight: 1 }}>✨</div>

                        <h6 className="card-title mb-2">Light</h6>
                        <p className="small text-muted mb-3">Clean and bright interface</p>
                        {appearance === 'light' && (
                          <span className="badge bg-primary">Active</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dark Mode */}
                  <div className="col-md-4">
                    <div 
                      className={`card border-2 ${appearance === 'dark' ? 'border-primary' : 'border-light'}`}
                      style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                      onClick={() => handleAppearanceChange('dark')}
                      onMouseEnter={(e) => {
                        if (appearance !== 'dark') {
                          e.currentTarget.style.borderColor = '#0d6efd';
                          e.currentTarget.style.backgroundColor = '#f8f9fa';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (appearance !== 'dark') {
                          e.currentTarget.style.borderColor = '#e9ecef';
                          e.currentTarget.style.backgroundColor = 'white';
                        }
                      }}
                    >
                      <div className="card-body text-center">
                        <div className="mb-3" style={{ fontSize: '48px' }}>🌙</div>
                        <h6 className="card-title mb-2">Dark</h6>
                        <p className="small text-muted mb-3">Easy on the eyes</p>
                        {appearance === 'dark' && (
                          <span className="badge bg-primary">Active</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* System Mode */}
                  <div className="col-md-4">
                    <div 
                      className={`card border-2 ${appearance === 'system' ? 'border-primary' : 'border-light'}`}
                      style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                      onClick={() => handleAppearanceChange('system')}
                      onMouseEnter={(e) => {
                        if (appearance !== 'system') {
                          e.currentTarget.style.borderColor = '#0d6efd';
                          e.currentTarget.style.backgroundColor = '#f8f9fa';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (appearance !== 'system') {
                          e.currentTarget.style.borderColor = '#e9ecef';
                          e.currentTarget.style.backgroundColor = 'white';
                        }
                      }}
                    >
                      <div className="card-body text-center">
                        <div className="mb-3" style={{ fontSize: '48px' }}>🖥️</div>
                        <h6 className="card-title mb-2">System</h6>
                        <p className="small text-muted mb-3">Match system settings</p>
                        {appearance === 'system' && (
                          <span className="badge bg-primary">Active</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
