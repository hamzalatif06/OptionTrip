import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader/Loader';
import './ProfilePage.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, updateProfile, uploadProfileImage, changePassword, deleteAccount, logout } = useAuth();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Delete account state
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
      });
    }
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [loading, isAuthenticated, navigate]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const result = await updateProfile({
        name: profileForm.name,
        phoneNumber: profileForm.phoneNumber,
      });

      if (result.success) {
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsSaving(true);

    try {
      const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);

      if (result.success) {
        toast.success('Password changed successfully! Please login again.');
        navigate('/login');
      } else {
        toast.error(result.error || 'Failed to change password');
      }
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Please enter your password to confirm');
      return;
    }

    setIsSaving(true);

    try {
      const result = await deleteAccount(deletePassword);

      if (result.success) {
        toast.success('Account deleted successfully');
        navigate('/');
      } else {
        toast.error(result.error || 'Failed to delete account');
      }
    } catch (error) {
      toast.error('Failed to delete account');
    } finally {
      setIsSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploadingImage(true);

    try {
      const result = await uploadProfileImage(file);

      if (result.success) {
        toast.success('Profile image updated successfully!');
      } else {
        toast.error(result.error || 'Failed to upload image');
      }
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getProviderIcon = (provider) => {
    switch (provider) {
      case 'google':
        return <i className="fab fa-google"></i>;
      case 'facebook':
        return <i className="fab fa-facebook-f"></i>;
      case 'twitter':
        return <i className="fab fa-twitter"></i>;
      default:
        return <i className="fas fa-link"></i>;
    }
  };

  if (loading) {
    return <Loader size="fullpage" text="Loading profile..." />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Sidebar */}
        <aside className="profile-sidebar">
          <div className="profile-avatar-section">
            <div className="profile-avatar-wrapper" onClick={handleImageClick}>
              {user.profileImage ? (
                <img src={user.profileImage} alt={user.name} className="profile-avatar" />
              ) : (
                <div className="profile-avatar profile-avatar-initials">
                  {getInitials(user.name)}
                </div>
              )}
              <div className={`profile-avatar-overlay ${isUploadingImage ? 'uploading' : ''}`}>
                {isUploadingImage ? (
                  <div className="profile-avatar-spinner"></div>
                ) : (
                  <>
                    <i className="fas fa-camera"></i>
                    <span>Change</span>
                  </>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            <h2 className="profile-name">{user.name}</h2>
            <p className="profile-email">{user.email}</p>
          </div>

          <nav className="profile-nav">
            <button
              className={`profile-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <i className="fas fa-user"></i>
              <span>My Profile</span>
            </button>
            <button
              className={`profile-nav-item ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <i className="fas fa-lock"></i>
              <span>Security</span>
            </button>
            <button
              className={`profile-nav-item ${activeTab === 'connected' ? 'active' : ''}`}
              onClick={() => setActiveTab('connected')}
            >
              <i className="fas fa-link"></i>
              <span>Connected Accounts</span>
            </button>
            <button
              className="profile-nav-item profile-nav-trips"
              onClick={() => navigate('/my-trips')}
            >
              <i className="fas fa-plane"></i>
              <span>My Trips</span>
            </button>
          </nav>

          <div className="profile-sidebar-footer">
            <button className="profile-logout-btn" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="profile-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="profile-section">
              <div className="profile-section-header">
                <div>
                  <h3>Personal Information</h3>
                  <p>Manage your personal details</p>
                </div>
                {!isEditing && (
                  <button className="profile-edit-btn" onClick={() => setIsEditing(true)}>
                    <i className="fas fa-edit"></i>
                    Edit Profile
                  </button>
                )}
              </div>

              <form onSubmit={handleProfileSubmit} className="profile-form">
                <div className="profile-form-grid">
                  <div className="profile-form-group">
                    <label>Full Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={profileForm.name}
                        onChange={handleProfileChange}
                        placeholder="Enter your name"
                        required
                      />
                    ) : (
                      <p className="profile-form-value">{user.name || 'Not set'}</p>
                    )}
                  </div>

                  <div className="profile-form-group">
                    <label>Email Address</label>
                    <p className="profile-form-value profile-form-readonly">
                      {user.email}
                      <span className="profile-badge">Verified</span>
                    </p>
                  </div>

                  <div className="profile-form-group">
                    <label>Phone Number</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={profileForm.phoneNumber}
                        onChange={handleProfileChange}
                        placeholder="Enter your phone number"
                      />
                    ) : (
                      <p className="profile-form-value">{user.phoneNumber || 'Not set'}</p>
                    )}
                  </div>

                  <div className="profile-form-group">
                    <label>Member Since</label>
                    <p className="profile-form-value">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'N/A'}
                    </p>
                  </div>
                </div>

                {isEditing && (
                  <div className="profile-form-actions">
                    <button
                      type="button"
                      className="profile-btn profile-btn-secondary"
                      onClick={() => {
                        setIsEditing(false);
                        setProfileForm({
                          name: user.name || '',
                          email: user.email || '',
                          phoneNumber: user.phoneNumber || '',
                        });
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="profile-btn profile-btn-primary"
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="profile-section">
              <div className="profile-section-header">
                <div>
                  <h3>Change Password</h3>
                  <p>Update your password to keep your account secure</p>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} className="profile-form">
                <div className="profile-form-stack">
                  <div className="profile-form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                      required
                    />
                  </div>

                  <div className="profile-form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                      minLength={8}
                      required
                    />
                  </div>

                  <div className="profile-form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                </div>

                <div className="profile-form-actions">
                  <button
                    type="submit"
                    className="profile-btn profile-btn-primary"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>

              {/* Danger Zone */}
              <div className="profile-danger-zone">
                <div className="profile-section-header">
                  <div>
                    <h3>Danger Zone</h3>
                    <p>Permanently delete your account and all associated data</p>
                  </div>
                </div>

                {!showDeleteConfirm ? (
                  <button
                    className="profile-btn profile-btn-danger"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <i className="fas fa-trash-alt"></i>
                    Delete Account
                  </button>
                ) : (
                  <div className="profile-delete-confirm">
                    <p>This action cannot be undone. Please enter your password to confirm:</p>
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Enter your password"
                    />
                    <div className="profile-delete-actions">
                      <button
                        className="profile-btn profile-btn-secondary"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeletePassword('');
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        className="profile-btn profile-btn-danger"
                        onClick={handleDeleteAccount}
                        disabled={isSaving}
                      >
                        {isSaving ? 'Deleting...' : 'Confirm Delete'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Connected Accounts Tab */}
          {activeTab === 'connected' && (
            <div className="profile-section">
              <div className="profile-section-header">
                <div>
                  <h3>Connected Accounts</h3>
                  <p>Manage your linked social accounts</p>
                </div>
              </div>

              <div className="profile-connected-list">
                {/* Google */}
                <div className={`profile-connected-item ${user.providers?.google ? 'connected' : ''}`}>
                  <div className="profile-connected-icon google">
                    <i className="fab fa-google"></i>
                  </div>
                  <div className="profile-connected-info">
                    <h4>Google</h4>
                    <p>{user.providers?.google ? 'Connected' : 'Not connected'}</p>
                  </div>
                  <button className="profile-connected-btn" disabled>
                    {user.providers?.google ? 'Connected' : 'Connect'}
                  </button>
                </div>

                {/* Facebook */}
                <div className={`profile-connected-item ${user.providers?.facebook ? 'connected' : ''}`}>
                  <div className="profile-connected-icon facebook">
                    <i className="fab fa-facebook-f"></i>
                  </div>
                  <div className="profile-connected-info">
                    <h4>Facebook</h4>
                    <p>{user.providers?.facebook ? 'Connected' : 'Not connected'}</p>
                  </div>
                  <button className="profile-connected-btn" disabled>
                    {user.providers?.facebook ? 'Connected' : 'Connect'}
                  </button>
                </div>

                {/* Twitter */}
                <div className={`profile-connected-item ${user.providers?.twitter ? 'connected' : ''}`}>
                  <div className="profile-connected-icon twitter">
                    <i className="fab fa-twitter"></i>
                  </div>
                  <div className="profile-connected-info">
                    <h4>Twitter</h4>
                    <p>{user.providers?.twitter ? 'Connected' : 'Not connected'}</p>
                  </div>
                  <button className="profile-connected-btn" disabled>
                    {user.providers?.twitter ? 'Connected' : 'Connect'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Back to Home */}
      <button className="profile-back-btn" onClick={() => navigate('/')}>
        <i className="fas fa-arrow-left"></i>
        Back to Home
      </button>
    </div>
  );
};

export default ProfilePage;
