import React from 'react';
import { useSystemStats } from '../hooks/useSystemStats';
import '../styles/SystemOverview.css';

const SystemOverview = ({ users = [], activityLog = [] }) => {
  const { totalUsers, totalPlants, healthyPlants, needsAttentionPlants, averageMoisture, loading } = useSystemStats();

  const usersList = Array.isArray(users) ? users : [];
  const totalAdmins = usersList.filter(u => u.is_staff || u.role === 'admin').length;
  const totalRegularUsers = usersList.filter(u => !u.is_staff && u.role !== 'admin').length;
  const totalActions = activityLog.length;

  if (loading) {
    return (
      <div className="admin-system-overview">
        <div className="overview-header">
          <h2>System Overview</h2>
          <p>Loading system statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-system-overview">

      {/* Header */}
      <div className="overview-header">
        <h2>System Overview</h2>
        <p>Key metrics and statistics</p>
      </div>

      {/* Body: stat cards (left) + distributions (right) */}
      <div className="overview-body">

        <div className="metrics-panel">
          {/* Stat cards */}
          <div className="overview-grid">
            <div className="overview-card total-users">
              <div className="card-icon">👥</div>
              <div className="card-content">
                <h3>Total Users</h3>
                <p className="card-value">{totalUsers}</p>
                <div className="card-label-vertical">
                  <span>{totalAdmins} admins</span>
                  <span>{totalRegularUsers} users</span>
                </div>
              </div>
            </div>

            <div className="overview-card total-plants">
            <div className="card-icon">🌱</div>
            <div className="card-content">
              <h3>Total Plants</h3>
              <p className="card-value">{totalPlants}</p>
              <span className="card-label">Across all users</span>
            </div>
          </div>

          <div className="overview-card healthy-plants">
            <div className="card-icon">✅</div>
            <div className="card-content">
              <h3>Healthy Plants</h3>
              <p className="card-value">{healthyPlants}</p>
              <span className="card-label">Moisture ≥ 50%</span>
            </div>
          </div>

          <div className="overview-card needs-attention">
            <div className="card-icon">⚠️</div>
            <div className="card-content">
              <h3>Needs Attention</h3>
              <p className="card-value">{needsAttentionPlants}</p>
              <span className="card-label">Moisture &lt; 50%</span>
            </div>
          </div>

          <div className="overview-card average-moisture">
            <div className="card-icon">💧</div>
            <div className="card-content">
              <h3>Avg Moisture</h3>
              <p className="card-value">{averageMoisture}%</p>
              <span className="card-label">System average</span>
            </div>
          </div>

          <div className="overview-card activity-count">
            <div className="card-icon">📊</div>
            <div className="card-content">
              <h3>Total Actions</h3>
              <p className="card-value">{totalActions}</p>
              <span className="card-label">System activity</span>
            </div>
          </div>
        </div>
      </div>

        {/* Distribution panels */}
        <div className="distributions-wrapper">
          <div className="system-health-distribution">
            <h3>Plant Health Distribution</h3>
            <div className="distribution-chart">
              <div className="distribution-item">
                <div className="distribution-bar">
                  <div className="bar-segment healthy" style={{ width: `${totalPlants > 0 ? (healthyPlants / totalPlants) * 100 : 0}%` }}></div>
                  <div className="bar-segment needs-attention" style={{ width: `${totalPlants > 0 ? (needsAttentionPlants / totalPlants) * 100 : 0}%` }}></div>
                </div>
                <div className="distribution-legend">
                  <span><span className="legend-box healthy"></span>Healthy ({healthyPlants})</span>
                  <span><span className="legend-box needs-attention"></span>Needs Attention ({needsAttentionPlants})</span>
                </div>
              </div>
            </div>
          </div>

          <div className="user-distribution">
            <h3>User Role Distribution</h3>
            <div className="distribution-chart">
              <div className="distribution-item">
                <div className="distribution-bar">
                  <div className="bar-segment admin" style={{ width: `${totalUsers > 0 ? (totalAdmins / totalUsers) * 100 : 0}%` }}></div>
                  <div className="bar-segment user" style={{ width: `${totalUsers > 0 ? (totalRegularUsers / totalUsers) * 100 : 0}%` }}></div>
                </div>
                <div className="distribution-legend">
                  <span><span className="legend-box admin"></span>Admins ({totalAdmins})</span>
                  <span><span className="legend-box user"></span>Users ({totalRegularUsers})</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SystemOverview;
