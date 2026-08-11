import { getNotifications, getUnreadCount, markRead, markAllRead, dismiss } from '../services/notificationService.js';

export const listNotifications = async (req, res) => {
  try {
    const { status, limit } = req.query;
    const notifications = await getNotifications(req.user._id, {
      status,
      limit: limit ? Math.min(Number(limit) || 20, 100) : 20
    });
    return res.status(200).json({ success: true, data: { notifications } });
  } catch (err) {
    console.error('listNotifications error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load notifications' });
  }
};

export const unreadCount = async (req, res) => {
  try {
    const count = await getUnreadCount(req.user._id);
    return res.status(200).json({ success: true, data: { count } });
  } catch (err) {
    console.error('unreadCount error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load unread count' });
  }
};

export const markOneRead = async (req, res) => {
  try {
    const modified = await markRead(req.user._id, req.params.id);
    return res.status(200).json({ success: true, data: { modified } });
  } catch (err) {
    console.error('markOneRead error:', err);
    return res.status(500).json({ success: false, message: 'Failed to mark notification read' });
  }
};

export const markAll = async (req, res) => {
  try {
    const modified = await markAllRead(req.user._id);
    return res.status(200).json({ success: true, data: { modified } });
  } catch (err) {
    console.error('markAll error:', err);
    return res.status(500).json({ success: false, message: 'Failed to mark notifications read' });
  }
};

export const dismissOne = async (req, res) => {
  try {
    const modified = await dismiss(req.user._id, req.params.id);
    return res.status(200).json({ success: true, data: { modified } });
  } catch (err) {
    console.error('dismissOne error:', err);
    return res.status(500).json({ success: false, message: 'Failed to dismiss notification' });
  }
};

export default { listNotifications, unreadCount, markOneRead, markAll, dismissOne };
