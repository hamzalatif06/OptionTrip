import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getNotifications, getUnreadCount, markRead, markAllRead } from '../../services/notificationService';
import './NotificationBell.css';

const POLL_INTERVAL_MS = 60000;

const timeAgo = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const NotificationBell = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });

  const btnRef = useRef(null);
  const panelRef = useRef(null);

  const refreshUnreadCount = useCallback(async () => {
    setUnreadCount(await getUnreadCount());
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    refreshUnreadCount();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') refreshUnreadCount();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isAuthenticated, refreshUnreadCount]);

  useEffect(() => {
    const handler = (e) => {
      const clickedBtn = btnRef.current?.contains(e.target);
      const clickedPanel = panelRef.current?.contains(e.target);
      if (!clickedBtn && !clickedPanel) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const toggleDropdown = async () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      setLoading(true);
      setNotifications(await getNotifications({ limit: 20 }));
      setLoading(false);
    }
  };

  const handleClickNotification = async (n) => {
    if (n.status === 'unread') {
      markRead(n._id);
      setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, status: 'read' } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setIsOpen(false);
    if (n.cta?.url) navigate(n.cta.url);
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, status: 'read' })));
    setUnreadCount(0);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="notif-bell">
      <button
        ref={btnRef}
        className="notif-bell__toggle"
        onClick={toggleDropdown}
        aria-label="Notifications"
      >
        <i className="fa fa-bell"></i>
        {unreadCount > 0 && (
          <span className="notif-bell__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && createPortal(
        <div
          className="notif-bell__dropdown"
          style={{ top: dropdownPos.top, right: dropdownPos.right }}
          ref={panelRef}
        >
          <div className="notif-bell__header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button className="notif-bell__mark-all" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>
          <div className="notif-bell__list">
            {loading ? (
              <div className="notif-bell__empty">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="notif-bell__empty">You're all caught up 🎉</div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n._id}
                  className={`notif-bell__item${n.status === 'unread' ? ' notif-bell__item--unread' : ''}`}
                  onClick={() => handleClickNotification(n)}
                >
                  <span className="notif-bell__item-title">{n.title}</span>
                  {n.body && <span className="notif-bell__item-body">{n.body}</span>}
                  <span className="notif-bell__item-time">{timeAgo(n.createdAt)}</span>
                </button>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default NotificationBell;
