import User from '../models/User.js';
import Trip from '../models/Trip.js';
import UserActivity from '../models/UserActivity.js';

export const getStats = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalTrips,
      bookingClicks,
      activeUsers,
      topDestinationsRaw
    ] = await Promise.all([
      User.countDocuments(),
      Trip.countDocuments({ deleted: { $ne: true } }),
      UserActivity.countDocuments({ type: { $in: ['flight', 'hotel'] }, action: 'clicked', createdAt: { $gte: sevenDaysAgo } }),
      UserActivity.distinct('user_id', { createdAt: { $gte: sevenDaysAgo } }).then(ids => ids.length),
      Trip.aggregate([
        { $match: { deleted: { $ne: true }, 'destination.name': { $exists: true, $ne: '' } } },
        { $group: { _id: '$destination.name', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    const topDestinations = topDestinationsRaw.map(d => ({ name: d._id, count: d.count }));

    res.json({
      success: true,
      data: { totalUsers, totalTrips, bookingClicks, activeUsers, topDestinations }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = 20;
    const search = req.query.search?.trim() || '';

    const filter = search
      ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
      : {};

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('name email role isActive createdAt lastLogin')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter)
    ]);

    const userIds = users.map(u => u._id);
    const tripCounts = await Trip.aggregate([
      { $match: { user_id: { $in: userIds.map(id => String(id)) }, deleted: { $ne: true } } },
      { $group: { _id: '$user_id', count: { $sum: 1 } } }
    ]);
    const tripCountMap = Object.fromEntries(tripCounts.map(t => [t._id, t.count]));

    const enriched = users.map(u => ({
      _id:       u._id,
      name:      u.name,
      email:     u.email,
      role:      u.role,
      isActive:  u.isActive,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin,
      tripCount: tripCountMap[String(u._id)] || 0
    }));

    res.json({ success: true, data: { users: enriched, total, page, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getActivity = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 30;
    const filter = req.query.type ? { type: req.query.type } : {};

    const [activities, total] = await Promise.all([
      UserActivity.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('user_id', 'name email'),
      UserActivity.countDocuments(filter)
    ]);

    res.json({ success: true, data: { activities, total, page, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deactivateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('name email isActive');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: { user } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
