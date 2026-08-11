import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { getAccessToken } from '../../services/authService';
import PageMeta from '../../hooks/usePageMeta';
import Loader from '../../components/Loader/Loader';
import './ProfilePage.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ACTIVITY_OPTIONS = ['Beach', 'Hiking', 'Culture', 'Food & Dining', 'Shopping', 'Nightlife', 'Adventure Sports', 'Wildlife', 'History', 'Art & Museums'];
const DIETARY_OPTIONS  = ['Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free', 'Dairy-Free', 'Nut-Free'];
const ACCESS_OPTIONS   = ['Wheelchair Accessible', 'Limited Mobility', 'Visual Impairment', 'Hearing Impairment'];

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, updateProfile, uploadProfileImage, changePassword, deleteAccount, logout } = useAuth();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [prefForm, setPrefForm] = useState({
    travelStyle: '',
    preferredActivities: [],
    seatClass: '',
    hotelStars: '',
    dietaryRestrictions: [],
    accessibility: []
  });
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
      });
      if (user.preferences) {
        setPrefForm({
          travelStyle:          user.preferences.travelStyle        || '',
          preferredActivities:  user.preferences.preferredActivities || [],
          seatClass:            user.preferences.seatClass           || '',
          hotelStars:           user.preferences.hotelStars          || '',
          dietaryRestrictions:  user.preferences.dietaryRestrictions || [],
          accessibility:        user.preferences.accessibility        || []
        });
      }
    }
  }, [user]);

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

  const toggleMulti = (field, value) => {
    setPrefForm(prev => {
      const arr = prev[field];
      return { ...prev, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setIsSavingPrefs(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_BASE}/api/auth/preferences`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...prefForm,
          hotelStars: prefForm.hotelStars ? Number(prefForm.hotelStars) : null
        })
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Travel preferences saved!');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setIsSavingPrefs(false);
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

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

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
      <PageMeta title="Your Profile" description="Manage your OptionTrip profile." path="/profile" noIndex />
      <div className="profile-container">

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
              className={`profile-nav-item ${activeTab === 'preferences' ? 'active' : ''}`}
              onClick={() => setActiveTab('preferences')}
            >
              <i className="fas fa-sliders-h"></i>
              <span>Travel Preferences</span>
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


        <main className="profile-content">

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


          {activeTab === 'connected' && (
            <div className="profile-section">
              <div className="profile-section-header">
                <div>
                  <h3>Connected Accounts</h3>
                  <p>Manage your linked social accounts</p>
                </div>
              </div>

              <div className="profile-connected-list">

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

          {activeTab === 'preferences' && (
            <div className="profile-section">
              <div className="profile-section-header">
                <div>
                  <h3>Travel Preferences</h3>
                  <p>Personalise your trip plans from Travel Partner Vi</p>
                </div>
              </div>

              <form className="pref-form" onSubmit={handleSavePreferences}>

                <div className="pref-group">
                  <label className="pref-label">Travel style</label>
                  <div className="pref-chips">
                    {['budget', 'moderate', 'luxury', 'premium'].map(s => (
                      <button
                        type="button"
                        key={s}
                        className={`pref-chip${prefForm.travelStyle === s ? ' pref-chip--active' : ''}`}
                        onClick={() => setPrefForm(p => ({ ...p, travelStyle: p.travelStyle === s ? '' : s }))}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>


                <div className="pref-group">
                  <label className="pref-label">Favourite activities</label>
                  <div className="pref-chips">
                    {ACTIVITY_OPTIONS.map(act => (
                      <button
                        type="button"
                        key={act}
                        className={`pref-chip${prefForm.preferredActivities.includes(act) ? ' pref-chip--active' : ''}`}
                        onClick={() => toggleMulti('preferredActivities', act)}
                      >
                        {act}
                      </button>
                    ))}
                  </div>
                </div>


                <div className="pref-row">
                  <div className="pref-group">
                    <label className="pref-label">Preferred seat class</label>
                    <select
                      className="pref-select"
                      value={prefForm.seatClass}
                      onChange={e => setPrefForm(p => ({ ...p, seatClass: e.target.value }))}
                    >
                      <option value="">No preference</option>
                      <option value="economy">Economy</option>
                      <option value="premium_economy">Premium Economy</option>
                      <option value="business">Business</option>
                      <option value="first">First Class</option>
                    </select>
                  </div>

                  <div className="pref-group">
                    <label className="pref-label">Minimum stay rating</label>
                    <select
                      className="pref-select"
                      value={prefForm.hotelStars}
                      onChange={e => setPrefForm(p => ({ ...p, hotelStars: e.target.value }))}
                    >
                      <option value="">No preference</option>
                      {[1, 2, 3, 4, 5].map(n => (
                        <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>


                <div className="pref-group">
                  <label className="pref-label">Dietary restrictions</label>
                  <div className="pref-chips">
                    {DIETARY_OPTIONS.map(d => (
                      <button
                        type="button"
                        key={d}
                        className={`pref-chip${prefForm.dietaryRestrictions.includes(d) ? ' pref-chip--active' : ''}`}
                        onClick={() => toggleMulti('dietaryRestrictions', d)}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>


                <div className="pref-group">
                  <label className="pref-label">Accessibility needs</label>
                  <div className="pref-chips">
                    {ACCESS_OPTIONS.map(a => (
                      <button
                        type="button"
                        key={a}
                        className={`pref-chip${prefForm.accessibility.includes(a) ? ' pref-chip--active' : ''}`}
                        onClick={() => toggleMulti('accessibility', a)}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" className="profile-save-btn" disabled={isSavingPrefs}>
                  {isSavingPrefs ? 'Saving…' : 'Save Preferences'}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>


      <button className="profile-back-btn" onClick={() => navigate('/')}>
        <i className="fas fa-arrow-left"></i>
        Back to Home
      </button>
    </div>
  );
};

export default ProfilePage;
