import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { getAccessToken } from '../../services/authService';
import { getMemory, updateMemory, forgetMemory } from '../../services/memoryService';
import { getAchievements } from '../../services/tripsService';
import { useTheme, ACCENT_OPTIONS } from '../../contexts/ThemeContext';
import ThemeSwitcher from '../../components/ThemeSwitcher/ThemeSwitcher';
import PageMeta from '../../hooks/usePageMeta';
import Loader from '../../components/Loader/Loader';
import './ProfilePage.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ACTIVITY_OPTIONS = ['Beach', 'Hiking', 'Culture', 'Food & Dining', 'Shopping', 'Nightlife', 'Adventure Sports', 'Wildlife', 'History', 'Art & Museums'];
const DIETARY_OPTIONS  = ['Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free', 'Dairy-Free', 'Nut-Free'];
const ACCESS_OPTIONS   = ['Wheelchair Accessible', 'Limited Mobility', 'Visual Impairment', 'Hearing Impairment'];

const NOTIFICATION_TYPES = [
  { key: 'tripReminders',        label: 'Trip reminders',         desc: 'Upcoming trip start dates and wrap-ups' },
  { key: 'bookingConfirmations', label: 'Booking confirmations',  desc: 'Updates when a flight, hotel, or car is confirmed' },
  { key: 'aiRecommendations',    label: 'AI recommendations',     desc: 'Suggestions and travel inspiration from Vi' },
  { key: 'tripStoryActivity',    label: 'TripStory activity',     desc: 'Comments and interactions on your travel map' }
];

const MAP_PRIVACY_OPTIONS = [
  { value: 'private',         label: 'Private',                description: 'Only visible to you' },
  { value: 'countries_only',  label: 'Countries only',         description: 'Share which countries you\'ve visited' },
  { value: 'full_map',        label: 'Full map',               description: 'Share your complete travel map' },
  { value: 'selected_trips',  label: 'Selected trips',         description: 'Choose specific trips to share' }
];

const MEMORY_LIST_FIELDS = [
  { key: 'favorite_destinations', label: 'Places you love' },
  { key: 'avoided_or_disliked',   label: 'Places or things you avoid' },
  { key: 'trip_types',            label: 'Trip styles' },
  { key: 'interests',             label: 'Interests' },
  { key: 'dietary',               label: 'Dietary notes' },
  { key: 'notable_quotes',        label: 'Things you\'ve told Vi' }
];

const EMPTY_MEMORY_FACTS = {
  home_base: '', favorite_destinations: [], avoided_or_disliked: [],
  trip_types: [], interests: [], dietary: [], notable_quotes: []
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, updateProfile, uploadProfileImage, changePassword, deleteAccount, logout } = useAuth();
  const { accent, changeAccent } = useTheme();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('profile');
  const [achievementsData, setAchievementsData] = useState(null);
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

  const [settingsForm, setSettingsForm] = useState({
    notificationPreferences: {
      tripReminders: true,
      bookingConfirmations: true,
      aiRecommendations: true,
      tripStoryActivity: true
    },
    mapPrivacy: 'private',
    newsletterSubscribed: false,
    shippingAddress: { line1: '', line2: '', city: '', state: '', postalCode: '', country: '' }
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [memorySummary, setMemorySummary] = useState('');
  const [memoryFacts, setMemoryFacts] = useState(EMPTY_MEMORY_FACTS);
  const [isLoadingMemory, setIsLoadingMemory] = useState(false);
  const [isSavingMemory, setIsSavingMemory] = useState(false);
  const [showForgetConfirm, setShowForgetConfirm] = useState(false);
  const [newFactDraft, setNewFactDraft] = useState({});

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
      setSettingsForm({
        notificationPreferences: {
          tripReminders:        user.notificationPreferences?.tripReminders        ?? true,
          bookingConfirmations: user.notificationPreferences?.bookingConfirmations ?? true,
          aiRecommendations:    user.notificationPreferences?.aiRecommendations    ?? true,
          tripStoryActivity:    user.notificationPreferences?.tripStoryActivity    ?? true
        },
        mapPrivacy: user.mapPrivacy || 'private',
        newsletterSubscribed: user.newsletterSubscribed || false,
        shippingAddress: {
          line1: user.shippingAddress?.line1 || '',
          line2: user.shippingAddress?.line2 || '',
          city: user.shippingAddress?.city || '',
          state: user.shippingAddress?.state || '',
          postalCode: user.shippingAddress?.postalCode || '',
          country: user.shippingAddress?.country || ''
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const token = getAccessToken();
    getAchievements(token).then((res) => {
      if (res?.success) setAchievementsData(res.data);
    }).catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeTab !== 'memory') return;
    let cancelled = false;
    setIsLoadingMemory(true);
    getMemory().then((res) => {
      if (cancelled || !res?.success) return;
      setMemorySummary(res.data.summary || '');
      setMemoryFacts({ ...EMPTY_MEMORY_FACTS, ...res.data.facts });
    }).finally(() => { if (!cancelled) setIsLoadingMemory(false); });
    return () => { cancelled = true; };
  }, [activeTab]);

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

  const toggleNotificationPref = (key) => {
    setSettingsForm(prev => ({
      ...prev,
      notificationPreferences: { ...prev.notificationPreferences, [key]: !prev.notificationPreferences[key] }
    }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_BASE}/api/auth/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(settingsForm)
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Settings saved!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const removeMemoryItem = (field, index) => {
    setMemoryFacts(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  const addMemoryItem = (field) => {
    const value = (newFactDraft[field] || '').trim();
    if (!value) return;
    setMemoryFacts(prev => ({ ...prev, [field]: [...prev[field], value] }));
    setNewFactDraft(prev => ({ ...prev, [field]: '' }));
  };

  const handleSaveMemory = async () => {
    setIsSavingMemory(true);
    try {
      const res = await updateMemory(memoryFacts);
      if (res?.success) toast.success('Memory updated!');
      else throw new Error();
    } catch {
      toast.error('Failed to save memory');
    } finally {
      setIsSavingMemory(false);
    }
  };

  const handleForgetMemory = async () => {
    setIsSavingMemory(true);
    try {
      const res = await forgetMemory();
      if (res?.success) {
        toast.success('Memory cleared — Vi will start fresh.');
        setMemorySummary('');
        setMemoryFacts(EMPTY_MEMORY_FACTS);
        setShowForgetConfirm(false);
      } else throw new Error();
    } catch {
      toast.error('Failed to clear memory');
    } finally {
      setIsSavingMemory(false);
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

          {achievementsData && (
            <div className="profile-level-card">
              <div className="profile-level-card__badge">🏆</div>
              <div className="profile-level-card__info">
                <span className="profile-level-card__label">Travel Level</span>
                <span className="profile-level-card__value">{achievementsData.level.label}</span>
              </div>
              <div className="profile-level-card__stats">
                <span>{achievementsData.stats.countries} countries</span>
                <span>{achievementsData.stats.cities} cities</span>
                <span>{achievementsData.stats.tripsCreated} trips</span>
              </div>
              {achievementsData.achievements.some(a => a.unlocked) && (
                <div className="profile-level-card__badges">
                  {achievementsData.achievements.filter(a => a.unlocked).map((a) => (
                    <span key={a.id} className="profile-level-card__achievement" title={a.label}>{a.icon}</span>
                  ))}
                </div>
              )}
            </div>
          )}

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
              className={`profile-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <i className="fas fa-bell"></i>
              <span>Settings</span>
            </button>
            <button
              className={`profile-nav-item ${activeTab === 'memory' ? 'active' : ''}`}
              onClick={() => setActiveTab('memory')}
            >
              <i className="fas fa-brain"></i>
              <span>Vi's Memory</span>
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

          {activeTab === 'settings' && (
            <div className="profile-section">
              <div className="profile-section-header">
                <div>
                  <h3>Appearance</h3>
                  <p>Choose how OptionTrip looks for you</p>
                </div>
              </div>

              <div className="pref-group" style={{ marginBottom: 24 }}>
                <label className="pref-label">Mode</label>
                <ThemeSwitcher />
              </div>

              <div className="pref-group" style={{ marginBottom: 32 }}>
                <label className="pref-label">Accent color</label>
                <div className="accent-swatch-row">
                  {ACCENT_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      className={`accent-swatch${accent === opt.id ? ' accent-swatch--active' : ''}`}
                      style={{ '--swatch-color': opt.swatch }}
                      onClick={() => changeAccent(opt.id)}
                      title={opt.label}
                      aria-label={`Use ${opt.label} accent color`}
                    />
                  ))}
                </div>
              </div>

              <div className="profile-section-header">
                <div>
                  <h3>Notifications</h3>
                  <p>Choose what you want to hear about</p>
                </div>
              </div>

              <form className="pref-form" onSubmit={handleSaveSettings}>
                <div className="settings-toggle-list">
                  {NOTIFICATION_TYPES.map(({ key, label, desc }) => (
                    <label className="settings-toggle-row" key={key}>
                      <div className="settings-toggle-row__text">
                        <span className="settings-toggle-row__label">{label}</span>
                        <span className="settings-toggle-row__desc">{desc}</span>
                      </div>
                      <span
                        className={`settings-toggle${settingsForm.notificationPreferences[key] ? ' settings-toggle--on' : ''}`}
                        role="switch"
                        aria-checked={settingsForm.notificationPreferences[key]}
                        tabIndex={0}
                        onClick={() => toggleNotificationPref(key)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleNotificationPref(key); } }}
                      >
                        <span className="settings-toggle__knob" />
                      </span>
                    </label>
                  ))}
                </div>

                <div className="profile-section-header" style={{ marginTop: 32 }}>
                  <div>
                    <h3>Privacy</h3>
                    <p>Control who can see your travel map</p>
                  </div>
                </div>

                <div className="pref-group">
                  <div className="pref-chips">
                    {MAP_PRIVACY_OPTIONS.map(opt => (
                      <button
                        type="button"
                        key={opt.value}
                        className={`pref-chip${settingsForm.mapPrivacy === opt.value ? ' pref-chip--active' : ''}`}
                        title={opt.description}
                        onClick={() => setSettingsForm(p => ({ ...p, mapPrivacy: opt.value }))}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="profile-section-header" style={{ marginTop: 32 }}>
                  <div>
                    <h3>Newsletter</h3>
                    <p>Travel ideas and platform updates by email</p>
                  </div>
                </div>

                <div className="settings-toggle-list">
                  <label className="settings-toggle-row">
                    <div className="settings-toggle-row__text">
                      <span className="settings-toggle-row__label">Subscribe to the newsletter</span>
                      <span className="settings-toggle-row__desc">You can unsubscribe anytime</span>
                    </div>
                    <span
                      className={`settings-toggle${settingsForm.newsletterSubscribed ? ' settings-toggle--on' : ''}`}
                      role="switch"
                      aria-checked={settingsForm.newsletterSubscribed}
                      tabIndex={0}
                      onClick={() => setSettingsForm(p => ({ ...p, newsletterSubscribed: !p.newsletterSubscribed }))}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSettingsForm(p => ({ ...p, newsletterSubscribed: !p.newsletterSubscribed })); } }}
                    >
                      <span className="settings-toggle__knob" />
                    </span>
                  </label>
                </div>

                <div className="profile-section-header" style={{ marginTop: 32 }}>
                  <div>
                    <h3>Shipping Address</h3>
                    <p>Used if a delivery or shipment is ever required</p>
                  </div>
                </div>

                <div className="profile-form-grid">
                  <div className="profile-form-group">
                    <label>Address line 1</label>
                    <input
                      type="text"
                      value={settingsForm.shippingAddress.line1}
                      onChange={(e) => setSettingsForm(p => ({ ...p, shippingAddress: { ...p.shippingAddress, line1: e.target.value } }))}
                      placeholder="Street address"
                    />
                  </div>
                  <div className="profile-form-group">
                    <label>Address line 2 <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
                    <input
                      type="text"
                      value={settingsForm.shippingAddress.line2}
                      onChange={(e) => setSettingsForm(p => ({ ...p, shippingAddress: { ...p.shippingAddress, line2: e.target.value } }))}
                      placeholder="Apartment, suite, etc."
                    />
                  </div>
                  <div className="profile-form-group">
                    <label>City</label>
                    <input
                      type="text"
                      value={settingsForm.shippingAddress.city}
                      onChange={(e) => setSettingsForm(p => ({ ...p, shippingAddress: { ...p.shippingAddress, city: e.target.value } }))}
                    />
                  </div>
                  <div className="profile-form-group">
                    <label>State / Region</label>
                    <input
                      type="text"
                      value={settingsForm.shippingAddress.state}
                      onChange={(e) => setSettingsForm(p => ({ ...p, shippingAddress: { ...p.shippingAddress, state: e.target.value } }))}
                    />
                  </div>
                  <div className="profile-form-group">
                    <label>Postal code</label>
                    <input
                      type="text"
                      value={settingsForm.shippingAddress.postalCode}
                      onChange={(e) => setSettingsForm(p => ({ ...p, shippingAddress: { ...p.shippingAddress, postalCode: e.target.value } }))}
                    />
                  </div>
                  <div className="profile-form-group">
                    <label>Country</label>
                    <input
                      type="text"
                      value={settingsForm.shippingAddress.country}
                      onChange={(e) => setSettingsForm(p => ({ ...p, shippingAddress: { ...p.shippingAddress, country: e.target.value } }))}
                    />
                  </div>
                </div>

                <button type="submit" className="profile-save-btn" disabled={isSavingSettings} style={{ marginTop: 24 }}>
                  {isSavingSettings ? 'Saving…' : 'Save Settings'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'memory' && (
            <div className="profile-section">
              <div className="profile-section-header">
                <div>
                  <h3>What Vi Remembers</h3>
                  <p>Vi uses this to personalize recommendations — edit or remove anything that's wrong</p>
                </div>
              </div>

              {isLoadingMemory ? (
                <p className="profile-form-value">Loading…</p>
              ) : (
                <>
                  {memorySummary && (
                    <p className="memory-summary">{memorySummary}</p>
                  )}

                  <div className="pref-group" style={{ marginBottom: 24 }}>
                    <label className="pref-label">Home base</label>
                    <input
                      type="text"
                      className="memory-text-input"
                      value={memoryFacts.home_base || ''}
                      onChange={(e) => setMemoryFacts(prev => ({ ...prev, home_base: e.target.value }))}
                      placeholder="Not set"
                    />
                  </div>

                  {MEMORY_LIST_FIELDS.map(({ key, label }) => (
                    <div className="pref-group" key={key} style={{ marginBottom: 24 }}>
                      <label className="pref-label">{label}</label>
                      <div className="memory-chip-list">
                        {(memoryFacts[key] || []).length === 0 && (
                          <span className="dash-empty">Nothing here yet</span>
                        )}
                        {(memoryFacts[key] || []).map((item, i) => (
                          <span className="memory-chip" key={`${key}-${i}`}>
                            {item}
                            <button type="button" onClick={() => removeMemoryItem(key, i)} aria-label={`Remove ${item}`}>×</button>
                          </span>
                        ))}
                      </div>
                      <div className="memory-add-row">
                        <input
                          type="text"
                          value={newFactDraft[key] || ''}
                          onChange={(e) => setNewFactDraft(prev => ({ ...prev, [key]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMemoryItem(key); } }}
                          placeholder="Add..."
                          className="memory-text-input memory-text-input--small"
                        />
                        <button type="button" className="memory-add-btn" onClick={() => addMemoryItem(key)}>Add</button>
                      </div>
                    </div>
                  ))}

                  <div className="profile-form-actions">
                    <button className="profile-btn profile-btn-primary" onClick={handleSaveMemory} disabled={isSavingMemory}>
                      {isSavingMemory ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>

                  <div className="profile-danger-zone">
                    <div className="profile-section-header">
                      <div>
                        <h3>Forget Everything</h3>
                        <p>Clear everything Vi has learned about you and start fresh</p>
                      </div>
                    </div>
                    {!showForgetConfirm ? (
                      <button className="profile-btn profile-btn-danger" onClick={() => setShowForgetConfirm(true)}>
                        <i className="fas fa-eraser"></i>
                        Forget Everything
                      </button>
                    ) : (
                      <div className="profile-delete-confirm">
                        <p>This clears all of Vi's memory about you. This cannot be undone.</p>
                        <div className="profile-delete-actions">
                          <button className="profile-btn profile-btn-secondary" onClick={() => setShowForgetConfirm(false)}>Cancel</button>
                          <button className="profile-btn profile-btn-danger" onClick={handleForgetMemory} disabled={isSavingMemory}>
                            {isSavingMemory ? 'Clearing…' : 'Confirm Forget'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
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
