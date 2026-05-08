import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const userResponse = await api.get('/me');
        setUser(userResponse.data);
        const statsResponse = await api.get('/dashboard');
        setStats(statsResponse.data);
      } catch (error) {
        setError('Failed to load dashboard data');
        if (error.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const getStatusBadgeClass = (status) => {
    const classes = {
      en_attente: 'bg-warning text-dark',
      en_cours: 'bg-primary',
      validation: 'bg-info text-dark',
      terminee: 'bg-success'
    };
    return classes[status] || 'bg-secondary';
  };

  const getStatusLabel = (status) => {
    const labels = {
      en_attente: 'En Attente',
      en_cours: 'En Cours',
      validation: 'Validation',
      terminee: 'Terminée'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      {/* Page Header */}
      <div className="bg-white border-bottom py-4">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-1">Dashboard</h1>
              <p className="text-muted mb-0">Overview of your task management activity</p>
            </div>
            <span
              className={`badge ${user?.role === 'admin' ? 'bg-primary' : 'bg-secondary'} fs-6`}
              aria-label={`Current user role: ${user?.role === 'admin' ? 'Admin' : 'Member'}`}
            >
              {user?.role === 'admin' ? 'Admin' : 'Member'}
            </span>
          </div>
        </div>
      </div>

      <main className="container py-4">
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError('')}
              aria-label="Close alert"
            ></button>
          </div>
        )}

        {/* ADMIN DASHBOARD */}
        {user?.role === 'admin' ? (
          <>
            {/* Welcome Card */}
            <div className="card border-0 shadow-sm rounded-3 mb-4">
              <div className="card-body">
                <h2 className="h5 mb-1">Welcome back, {user?.name}!</h2>
                <p className="text-muted mb-0">Here is your admin overview</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="row g-4 mb-4">
              <div className="col-12 col-sm-6 col-lg-3">
                <div className="card border-0 shadow-sm rounded-3 h-100">
                  <div className="card-body d-flex align-items-center">
                    <div className="flex-shrink-0">
                      <div className="bg-primary bg-opacity-10 text-primary rounded-3 p-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                          <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM6.936 9.28a5.76 5.76 0 0 0-1.22-.703 6.514 6.514 0 0 0-2.2-.42c-.38-.028-.76-.028-1.14 0-.76.057-1.516.19-2.2.42a5.76 5.76 0 0 0-1.22.703A4.002 4.002 0 0 0 0 12.004V14a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-.996A4.002 4.002 0 0 0 2.936 9.28z"/>
                        </svg>
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <p className="text-muted mb-1 small">Total Members</p>
                      <h3 className="h4 mb-0">{stats?.total_members || 0}</h3>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-3">
                <div className="card border-0 shadow-sm rounded-3 h-100">
                  <div className="card-body d-flex align-items-center">
                    <div className="flex-shrink-0">
                      <div className="bg-success bg-opacity-10 text-success rounded-3 p-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                          <path d="M6 1v3H1V1h5zM1 0a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1H1zm14 12v3h-5v-3h5zm-5-1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-5zM6 8v7H1V8h5zM1 7a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H1zm14-6v7h-5V1h5zm-5-1a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1h-5z"/>
                        </svg>
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <p className="text-muted mb-1 small">Total Groups</p>
                      <h3 className="h4 mb-0">{stats?.total_groups || 0}</h3>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-3">
                <div className="card border-0 shadow-sm rounded-3 h-100">
                  <div className="card-body d-flex align-items-center">
                    <div className="flex-shrink-0">
                      <div className="bg-info bg-opacity-10 text-info rounded-3 p-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                          <path d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h13zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-13z"/>
                          <path d="M5 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 5 8zm0-2.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0 5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-1-5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1zm0 2.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1zm0 2.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/>
                        </svg>
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <p className="text-muted mb-1 small">Total Projects</p>
                      <h3 className="h4 mb-0">{stats?.total_projects || 0}</h3>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-3">
                <div className="card border-0 shadow-sm rounded-3 h-100">
                  <div className="card-body d-flex align-items-center">
                    <div className="flex-shrink-0">
                      <div className="bg-warning bg-opacity-10 text-warning rounded-3 p-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                          <path d="M3 14.5A1.5 1.5 0 0 1 1.5 13V3A1.5 1.5 0 0 1 3 1.5h8a.5.5 0 0 1 0 1H3a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5V8a.5.5 0 0 1 1 0v5a1.5 1.5 0 0 1-1.5 1.5H3z"/>
                          <path d="m8.354 10.354 7-7a.5.5 0 0 0-.708-.708L8 9.293 5.354 6.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0z"/>
                        </svg>
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <p className="text-muted mb-1 small">Total Tasks</p>
                      <h3 className="h4 mb-0">{stats?.total_tasks || 0}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Task Status Overview */}
            {stats?.tasks_by_status && (
              <div className="card border-0 shadow-sm rounded-3 mb-4">
                <div className="card-header bg-white border-bottom py-3">
                  <h5 className="card-title mb-0">Tasks by Status</h5>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    {Object.entries(stats.tasks_by_status).map(([status, count]) => {
                      const percentage = Math.round((count / (stats?.total_tasks || 1)) * 100);
                      return (
                        <div key={status} className="col-12 col-sm-6 col-lg-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="small fw-medium">{getStatusLabel(status)}</span>
                            <span className={`badge ${getStatusBadgeClass(status)}`} aria-label={`${getStatusLabel(status)} tasks: ${count}`}>{count}</span>
                          </div>
                          <div className="progress" style={{ height: '8px' }}>
                            <div
                              className={`progress-bar ${getStatusBadgeClass(status).replace('bg-', 'bg-').replace('text-dark', '')}`}
                              role="progressbar"
                              style={{ width: `${percentage}%` }}
                              aria-valuenow={percentage}
                              aria-valuemin="0"
                              aria-valuemax="100"
                              aria-label={`${getStatusLabel(status)} tasks progress: ${percentage}%`}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Recent Tasks */}
            {stats?.recent_tasks && stats.recent_tasks.length > 0 && (
              <div className="card border-0 shadow-sm rounded-3 mb-4">
                <div className="card-header bg-white border-bottom py-3">
                  <h5 className="card-title mb-0">Recent Tasks</h5>
                </div>
                <div className="card-body p-0">
                  <div className="list-group list-group-flush">
                    {stats.recent_tasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="list-group-item d-flex justify-content-between align-items-center py-3">
                        <div>
                          <h6 className="mb-1">{task.title}</h6>
                          <small className="text-muted">Project: {task.project?.name || 'N/A'}</small>
                        </div>
                        <span className={`badge ${getStatusBadgeClass(task.status)}`} aria-label={`Task status: ${getStatusLabel(task.status)}`}>
                          {getStatusLabel(task.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </>
        ) : (
          /* MEMBER DASHBOARD */
          <>
            {/* Welcome Card */}
            <div className="card border-0 shadow-sm rounded-3 mb-4">
              <div className="card-body">
                <h2 className="h5 mb-1">Welcome back, {user?.name}!</h2>
                <p className="text-muted mb-0">Here is your task summary</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="row g-4 mb-4">
              <div className="col-12 col-sm-6 col-lg-3">
                <div className="card border-0 shadow-sm rounded-3 h-100">
                  <div className="card-body text-center">
                    <h3 className="h2 text-primary mb-1">{stats?.total_tasks || 0}</h3>
                    <p className="text-muted mb-0 small">My Tasks</p>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-3">
                <div className="card border-0 shadow-sm rounded-3 h-100">
                  <div className="card-body text-center">
                    <h3 className="h2 text-warning mb-1">{stats?.tasks_by_status?.en_attente || 0}</h3>
                    <p className="text-muted mb-0 small">En Attente</p>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-3">
                <div className="card border-0 shadow-sm rounded-3 h-100">
                  <div className="card-body text-center">
                    <h3 className="h2 text-info mb-1">{stats?.tasks_by_status?.en_cours || 0}</h3>
                    <p className="text-muted mb-0 small">En Cours</p>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-3">
                <div className="card border-0 shadow-sm rounded-3 h-100">
                  <div className="card-body text-center">
                    <h3 className="h2 text-success mb-1">{stats?.tasks_by_status?.terminee || 0}</h3>
                    <p className="text-muted mb-0 small">Terminée</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Task Categories */}
            <div className="card border-0 shadow-sm rounded-3 mb-4">
              <div className="card-header bg-white border-bottom py-3">
                <h5 className="card-title mb-0">My Tasks by Status</h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12 col-sm-6 col-xl-3">
                    <div className="border rounded-3 p-3 text-center">
                      <h6 className="text-warning mb-2">En Attente</h6>
                      <h4 className="mb-1">{stats?.tasks_by_status?.en_attente || 0}</h4>
                      <small className="text-muted">Waiting to start</small>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6 col-xl-3">
                    <div className="border rounded-3 p-3 text-center">
                      <h6 className="text-info mb-2">En Cours</h6>
                      <h4 className="mb-1">{stats?.tasks_by_status?.en_cours || 0}</h4>
                      <small className="text-muted">Currently working</small>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6 col-xl-3">
                    <div className="border rounded-3 p-3 text-center">
                      <h6 className="text-primary mb-2">Validation</h6>
                      <h4 className="mb-1">{stats?.tasks_by_status?.validation || 0}</h4>
                      <small className="text-muted">Under review</small>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6 col-xl-3">
                    <div className="border rounded-3 p-3 text-center">
                      <h6 className="text-success mb-2">Terminée</h6>
                      <h4 className="mb-1">{stats?.tasks_by_status?.terminee || 0}</h4>
                      <small className="text-muted">Completed</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Assigned Tasks */}
            {stats?.recent_tasks && stats.recent_tasks.length > 0 && (
              <div className="card border-0 shadow-sm rounded-3 mb-4">
                <div className="card-header bg-white border-bottom py-3">
                  <h5 className="card-title mb-0">Recently Assigned Tasks</h5>
                </div>
                <div className="card-body p-0">
                  <div className="list-group list-group-flush">
                    {stats.recent_tasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="list-group-item d-flex justify-content-between align-items-center py-3">
                        <div>
                          <h6 className="mb-1">{task.title}</h6>
                          <small className="text-muted">
                            {task.project?.name || 'N/A'} • {task.priority || 'Normal'}
                          </small>
                        </div>
                        <span className={`badge ${getStatusBadgeClass(task.status)}`} aria-label={`Task status: ${getStatusLabel(task.status)}`}>
                          {getStatusLabel(task.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
