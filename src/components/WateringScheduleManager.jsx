import React, { useState, useEffect } from 'react';
import '../styles/WateringScheduleManager.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const WateringScheduleManager = () => {
  const [schedules, setSchedules] = useState([]);
  const [plantTypes, setPlantTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    plant_type: '',
    frequency: 'weekly',
    water_amount: 50,
    optimal_time_of_day: '06:00',
    notes: ''
  });

  useEffect(() => {
    fetchSchedules();
    fetchPlantTypes();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/watering-schedules/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch schedules');
      const data = await response.json();
      setSchedules(Array.isArray(data) ? data : data.results || []);
      setError('');
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlantTypes = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/plant-types/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch plant types');
      const data = await response.json();
      setPlantTypes(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error('Error fetching plant types:', err);
    }
  };

  const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'every-2-days', label: 'Every 2 Days' },
    { value: 'every-3-days', label: 'Every 3 Days' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'bi-weekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSchedule = async () => {
    if (!formData.name || !formData.plant_type) {
      setError('Please fill in required fields');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token');
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId 
        ? `${API_BASE_URL}/watering-schedules/${editingId}/`
        : `${API_BASE_URL}/watering-schedules/`;

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save schedule');
      
      setMessage(editingId ? '✅ Schedule updated!' : '✅ Schedule created!');
      setTimeout(() => setMessage(''), 3000);
      
      fetchSchedules();
      resetForm();
    } catch (err) {
      console.error('Error saving schedule:', err);
      setError('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      plant_type: '',
      frequency: 'weekly',
      water_amount: 50,
      optimal_time_of_day: '06:00',
      notes: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEditSchedule = (schedule) => {
    setFormData(schedule);
    setEditingId(schedule.id);
    setShowForm(true);
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('Delete this schedule?')) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/watering-schedules/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete schedule');
      
      setMessage('✅ Schedule deleted!');
      setTimeout(() => setMessage(''), 3000);
      fetchSchedules();
    } catch (err) {
      console.error('Error deleting schedule:', err);
      setError('Failed to delete schedule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="watering-schedule-manager">
      <header className="schedule-header">
        <h2>💧 Watering Schedule Manager</h2>
        <p>Create and manage watering schedules for different plant types</p>
      </header>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      {loading ? (
        <div className="loading">Loading schedules...</div>
      ) : (
        <>
          {/* Add/Edit Schedule Form */}
          {showForm && (
            <div className="schedule-form-container">
              <div className="schedule-form">
                <h3>{editingId ? 'Edit Schedule' : 'Create New Schedule'}</h3>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Schedule Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Summer Succulent Care"
                    />
                  </div>

                  <div className="form-group">
                    <label>Plant Type *</label>
                    <select
                      name="plant_type"
                      value={formData.plant_type}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Plant Type</option>
                      {plantTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Watering Frequency *</label>
                    <select
                      name="frequency"
                      value={formData.frequency}
                      onChange={handleInputChange}
                    >
                      {frequencyOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Water Amount (%) *</label>
                    <div className="water-amount-input">
                      <input
                        type="range"
                        name="water_amount"
                        min="10"
                        max="100"
                        value={formData.water_amount}
                        onChange={handleInputChange}
                      />
                      <span className="water-value">{formData.water_amount}%</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Optimal Time of Day</label>
                    <input
                      type="time"
                      name="optimal_time_of_day"
                      value={formData.optimal_time_of_day}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Special care instructions"
                      rows="3"
                    />
                  </div>
                </div>

                <div className="form-buttons">
                  <button 
                    className="btn-primary" 
                    onClick={handleAddSchedule}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : (editingId ? '✏️ Update Schedule' : '➕ Create Schedule')}
                  </button>
                  <button className="btn-secondary" onClick={resetForm}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Schedules List */}
          <div className="schedules-container">
            {!showForm && (
              <button className="btn-new-schedule" onClick={() => setShowForm(true)}>
                ➕ Create New Schedule
              </button>
            )}

            <div className="schedules-list">
              {schedules.length === 0 ? (
                <div className="no-schedules">
                  <p>📅 No schedules yet. Create one to get started!</p>
                </div>
              ) : (
                schedules.map(schedule => (
                  <div key={schedule.id} className="schedule-card">
                    <div className="schedule-header-info">
                      <h4>{schedule.name}</h4>
                      <span className="plant-type-badge">{schedule.plant_type_name}</span>
                    </div>

                    <div className="schedule-details-grid">
                      <div className="detail-item">
                        <span className="detail-label">Frequency</span>
                        <span className="detail-value">
                          {frequencyOptions.find(o => o.value === schedule.frequency)?.label}
                        </span>
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">Water Amount</span>
                        <span className="detail-value">{schedule.water_amount}%</span>
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">Optimal Time</span>
                        <span className="detail-value">{schedule.optimal_time_of_day}</span>
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">Created By</span>
                        <span className="detail-value">{schedule.created_by_username}</span>
                      </div>
                    </div>

                    {schedule.notes && (
                      <div className="schedule-notes">
                        <strong>📝 Notes:</strong>
                        <p>{schedule.notes}</p>
                      </div>
                    )}

                    <div className="schedule-actions">
                      <button
                        className="btn-edit"
                        onClick={() => handleEditSchedule(schedule)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        disabled={saving}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WateringScheduleManager;
