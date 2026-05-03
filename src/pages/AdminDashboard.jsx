import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminUserList from '../components/AdminUserList';
import AddUserModal from '../components/AddUserModal';
import EditUserModal from '../components/EditUserModal';
import PasswordResetModal from '../components/PasswordResetModal';
import SuccessNotificationModal from '../components/SuccessNotificationModal';
import SystemOverview from '../components/SystemOverview';
import CriticalPlantsAlert from '../components/CriticalPlantsAlert';
import PlantHealthAlerts from '../components/PlantHealthAlerts';
import { useUserManagement } from '../hooks/useUserManagement';
import { adminAPI } from '../services/api';
import '../styles/AdminDashboard.css';

const AdminDashboard = ({ onNotification }) => {
  const { users, loading, error, addUser, updateUser, deleteUser, resetPassword, changeRole, refetchUsers } = useUserManagement();
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successDetails, setSuccessDetails] = useState(null);
  const [successTitle, setSuccessTitle] = useState('✅ Success');
  const [selectedUser, setSelectedUser] = useState(null);
  const [tempPassword, setTempPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [plants, setPlants] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [activityLog, setActivityLog] = useState([]);
  const [metricsRefreshTrigger, setMetricsRefreshTrigger] = useState(0);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  const API_HOST = API_BASE_URL.replace(/\/api\/?$/, '');

  const logAdminAction = async (actionType, targetUserId, targetUsername, details = {}) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      const response = await fetch(`${API_HOST}/api/users/log_action/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify({ action_type: actionType, target_user_id: targetUserId, target_username: targetUsername, details })
      });
      if (!response.ok) console.error('[AdminDashboard] Failed to log admin action:', response.statusText);
    } catch (error) {
      console.error('[AdminDashboard] Error logging admin action:', error);
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) setCurrentUser(user);
  }, []);

  useEffect(() => {
    const fetchPlants = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) { setPlants([]); return; }
        const plantsData = await adminAPI.getAllPlants();
        const plantsList = Array.isArray(plantsData) ? plantsData : (plantsData?.results || plantsData?.data || []);
        if (!Array.isArray(plantsList)) { setPlants([]); return; }
        const mappedPlants = plantsList.map(plant => ({
          id: plant.id, name: plant.name, type: plant.type, location: plant.location,
          moistureLevel: plant.moisture, lastWatered: plant.last_watered,
          owner: plant.owner_username || 'Unknown', user_id: plant.owner,
          description: plant.description,
          careRequirements: { waterFrequency: plant.care_requirements?.water_frequency, lightRequirement: plant.care_requirements?.light_requirement, temperature: plant.care_requirements?.temperature, humidity: plant.care_requirements?.humidity },
          watering_history: plant.watering_history, created_at: plant.created_at,
        }));
        setPlants(mappedPlants);
      } catch (error) {
        console.error('[AdminDashboard] Error fetching plants:', error);
        setPlants([]);
      }
    };
    fetchPlants();
    const interval = setInterval(fetchPlants, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAddUser = async (userData) => {
    try {
      const result = await addUser(userData);
      if (result.success) {
        setIsAddModalOpen(false);
        await logAdminAction('create_user', result.user?.id, userData.username);
        setSuccessTitle('✅ User Created Successfully');
        setSuccessMessage(`New user created successfully!`);
        setSuccessDetails(<div><p>✅ The user account has been created and is ready to use.</p><p><strong>Username:</strong> {userData.username}</p><p><strong>Email:</strong> {userData.email}</p></div>);
        setIsSuccessModalOpen(true);
        setMetricsRefreshTrigger(prev => prev + 1);
        if (onNotification) onNotification(`✅ User "${userData.username}" created successfully!`, 'success');
      } else {
        if (onNotification) onNotification(`❌ Error creating user: ${result.error}`, 'error');
      }
    } catch (error) {
      if (onNotification) onNotification(`❌ Error creating user: ${error.message}`, 'error');
    }
  };

  const handleEditUser = (user) => {
    const isSelf = currentUser && (String(user.id) === String(currentUser.id) || user.username === currentUser.username);
    if (user.is_staff && !isSelf) {
      if (onNotification) onNotification('❌ Cannot edit other admin accounts', 'error');
      return;
    }
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (userId, userData) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) { if (onNotification) onNotification('❌ User not found', 'error'); return; }
    const isSelf = currentUser && (String(targetUser.id) === String(currentUser.id) || targetUser.username === currentUser.username);
    if (targetUser.is_staff && !isSelf) { if (onNotification) onNotification('❌ Cannot update other admin accounts', 'error'); return; }
    try {
      const result = await updateUser(userId, userData);
      if (result.success) {
        setIsEditModalOpen(false);
        setSelectedUser(null);
        await logAdminAction('update_user', userId, targetUser?.username);
        setSuccessTitle('✅ User Updated Successfully');
        setSuccessMessage(`User updated successfully!`);
        setSuccessDetails(<div><p>✅ User profile has been updated.</p><p><strong>Username:</strong> {targetUser?.username}</p></div>);
        setIsSuccessModalOpen(true);
        setMetricsRefreshTrigger(prev => prev + 1);
        if (onNotification) onNotification(`✅ User "${targetUser?.username}" updated successfully!`, 'success');
      } else {
        if (onNotification) onNotification(`❌ Error updating user: ${result.error}`, 'error');
      }
    } catch (error) {
      if (onNotification) onNotification(`❌ Error updating user: ${error.message}`, 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;
    const isSelf = currentUser && (String(userToDelete.id) === String(currentUser.id) || userToDelete.username === currentUser.username);
    if (isSelf) { if (onNotification) onNotification('❌ Cannot delete your own account', 'error'); return; }
    if (userToDelete.is_staff) { if (onNotification) onNotification('❌ Cannot delete admin accounts', 'error'); return; }
    try {
      const result = await deleteUser(userId);
      if (result.success) {
        await logAdminAction('delete_user', userId, userToDelete?.username);
        setMetricsRefreshTrigger(prev => prev + 1);
        if (onNotification) onNotification(`✅ User "${userToDelete?.username}" deleted successfully!`, 'success');
      } else {
        if (onNotification) onNotification(`❌ Error deleting user: ${result.error}`, 'error');
      }
    } catch (error) {
      if (onNotification) onNotification(`❌ Error deleting user: ${error.message}`, 'error');
    }
  };

  const handleResetPassword = async (userId, newPassword) => {
    setIsResettingPassword(true);
    try {
      const result = await resetPassword(userId, newPassword);
      if (result.success) {
        setIsPasswordResetModalOpen(false);
        await logAdminAction('reset_password', selectedUser?.id, selectedUser?.username);
        setSuccessTitle('✅ Password Reset Complete');
        setSuccessMessage(`Password reset successfully for user "${selectedUser?.username}"!`);
        setSuccessDetails(<div><p><strong>Temporary Password:</strong></p><code style={{ display: 'block', background: '#f0f0f0', padding: '8px', marginTop: '8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '1rem', wordBreak: 'break-all' }}>{tempPassword}</code></div>);
        setIsSuccessModalOpen(true);
        setMetricsRefreshTrigger(prev => prev + 1);
        setTimeout(() => refetchUsers(), 1000);
        setSelectedUser(null);
        setTempPassword('');
      } else {
        if (onNotification) onNotification(`❌ Error resetting password: ${result.error}`, 'error');
      }
    } catch (error) {
      if (onNotification) onNotification(`❌ Error: ${error.message}`, 'error');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleOpenPasswordResetModal = (userId) => {
    const user = users.find(u => u.id === userId || u.username === userId);
    if (!user) return;
    const tempPassword = `TempPass${Math.floor(Math.random() * 100000)}!`;
    setSelectedUser(user);
    setTempPassword(tempPassword);
    setIsPasswordResetModalOpen(true);
  };

  const handleConfirmPasswordReset = async () => {
    if (selectedUser && tempPassword) await handleResetPassword(selectedUser.id || selectedUser.username, tempPassword);
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      const result = await changeRole(userId, newRole);
      if (result.success) {
        const userObj = users.find(u => u.id === userId);
        const roleDisplay = newRole === 'admin' ? '👑 Admin' : '👤 User';
        await logAdminAction('change_role', userId, userObj?.username, { new_role: newRole });
        setSuccessTitle('✅ Role Changed Successfully');
        setSuccessMessage(`User role changed successfully!`);
        setSuccessDetails(<div><p>✅ Role change applied.</p><p><strong>Username:</strong> {userObj?.username}</p><p><strong>New Role:</strong> {roleDisplay}</p></div>);
        setIsSuccessModalOpen(true);
        setMetricsRefreshTrigger(prev => prev + 1);
        if (onNotification) onNotification(`✅ User "${userObj?.username}" role changed to ${newRole}!`, 'success');
      } else {
        if (onNotification) onNotification(`❌ Error changing role: ${result.error}`, 'error');
      }
    } catch (error) {
      if (onNotification) onNotification(`❌ Error changing role: ${error.message}`, 'error');
    }
  };

  return (
    <div className="admin-page-wrapper">
      <AdminSidebar currentUser={currentUser} onLogout={() => {}} />
      <div className="admin-dashboard">
        <header className="admin-header">
          <div className="header-content">
            <h1>⚙️ Admin Dashboard</h1>
            <p>Manage users, plants, and system activity</p>
          </div>
        </header>

        {loading ? (
          <div className="loading-message"><p>Loading admin data...</p></div>
        ) : error ? (
          <div className="error-message"><p>⚠️ {error}</p><button onClick={refetchUsers} className="btn-secondary">Retry</button></div>
        ) : (
          <>
            {/* 2-column layout: left = overview + user table, right = alerts */}
            <div className="dashboard-main-grid">

              {/* LEFT COLUMN */}
              <div className="dashboard-left-col">
                <section className="admin-section">
                  <SystemOverview users={users} activityLog={activityLog} />
                </section>
                <section className="admin-section">
                  <AdminUserList
                    users={users}
                    currentUser={currentUser}
                    onEdit={handleEditUser}
                    onDelete={handleDeleteUser}
                    onResetPassword={handleOpenPasswordResetModal}
                    onChangeRole={handleChangeRole}
                    onAddUser={() => setIsAddModalOpen(true)}
                    metricsRefreshTrigger={metricsRefreshTrigger}
                  />
                </section>
              </div>

              {/* RIGHT COLUMN */}
              <div className="alerts-column">
                <section className="admin-section alert-section">
                  <CriticalPlantsAlert plants={plants} users={users} />
                </section>
              </div>

            </div>

            <section className="admin-section">
              <PlantHealthAlerts plants={plants} />
            </section>

            {/* Modals */}
            <AddUserModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddUser} />
            <EditUserModal isOpen={isEditModalOpen} user={selectedUser} onClose={() => { setIsEditModalOpen(false); setSelectedUser(null); }} onUpdate={handleUpdateUser} />
            <PasswordResetModal isOpen={isPasswordResetModalOpen} userName={selectedUser?.username} tempPassword={tempPassword} isLoading={isResettingPassword} onClose={() => { setIsPasswordResetModalOpen(false); setSelectedUser(null); setTempPassword(''); }} onConfirm={handleConfirmPasswordReset} />
            <SuccessNotificationModal isOpen={isSuccessModalOpen} title={successTitle} message={successMessage} details={successDetails} autoCloseSeconds={8} onClose={() => { setIsSuccessModalOpen(false); setSuccessMessage(''); setSuccessDetails(null); setSuccessTitle('✅ Success'); }} />
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
