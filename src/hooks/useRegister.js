import { useState } from 'react';
import { authAPI } from '../services/api';

export function useRegister(onRegister, navigate) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setLoading(true);

    try {
      console.log('[REGISTER] Starting admin registration...');
      const response = await authAPI.registerAdmin(username, email, password);
      
      // Extract user data from nested response
      const userData = response.user || response;
      
      // Determine role based on is_staff
      const role = userData.is_staff ? 'admin' : 'user';
      
      // Store token and user info
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('currentUser', JSON.stringify({ 
        id: userData.id,
        username: userData.username || username,
        email: userData.email,
        is_staff: userData.is_staff,
        role
      }));
      localStorage.setItem('isLoggedIn', 'true');

      setSuccess(true);
      console.log('[REGISTER] Registration successful - Role:', role);
      
      if (onRegister) onRegister({ username, email, role });
      if (navigate) {
        setTimeout(() => {
          navigate('/');
        }, 1200);
      }
    } catch (err) {
      console.error('[REGISTER] Error:', err);
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return {
    username,
    setUsername,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    success,
    handleSubmit,
    loading
  };
}
