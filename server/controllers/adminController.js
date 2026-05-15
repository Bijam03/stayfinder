import User     from '../models/User.js';
import Property from '../models/Property.js';
import Booking  from '../models/Booking.js';
import Review   from '../models/Review.js';

// ══════════════════════════════════════════════════════
//  DASHBOARD STATS
//  GET /api/admin/stats
// ══════════════════════════════════════════════════════
export const getAdminStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalHosts,
      totalGuests,
      totalProperties,
      totalBookings,
      totalReviews,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      totalRevenueResult,
      recentUsers,
      recentBookings,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'host' }),
      User.countDocuments({ role: 'guest' }),
      Property.countDocuments(),
      Booking.countDocuments(),
      Review.countDocuments(),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'cancelled' }),
      Booking.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt avatar'),
      Booking.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('guest',    'name email')
        .populate('property', 'title'),
    ]);

    // Monthly revenue — last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setUTCHours(0, 0, 0, 0);

    const monthlyRevenue = await Booking.aggregate([
      { $match: { paymentStatus: 'paid', paidAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year:  { $year:  '$paidAt' },
            month: { $month: '$paidAt' },
          },
          revenue:       { $sum:  '$totalPrice' },
          bookingsCount: { $sum:  1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalHosts,
        totalGuests,
        totalProperties,
        totalBookings,
        totalReviews,
        pendingBookings,
        confirmedBookings,
        cancelledBookings,
        totalRevenue: totalRevenueResult[0]?.total || 0,
        monthlyRevenue,
        recentUsers,
        recentBookings,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
//  USERS
// ══════════════════════════════════════════════════════

// GET /api/admin/users
export const getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (role   && role   !== 'all') query.role   = role;
    if (search) query.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-password');

    res.status(200).json({
      success: true,
      users,
      total,
      pages: Math.ceil(total / limit),
      page:  Number(page),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/users/:id
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Get user's activity
    const [properties, bookings, reviews] = await Promise.all([
      Property.find({ host: req.params.id }).select('title price rating isAvailable').limit(5),
      Booking.find({ $or: [{ guest: req.params.id }, { host: req.params.id }] })
        .populate('property', 'title')
        .sort({ createdAt: -1 })
        .limit(5),
      Review.find({ author: req.params.id })
        .populate('property', 'title')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    res.status(200).json({ success: true, user, properties, bookings, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/users/:id/role
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['guest', 'host', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Prevent admin from changing their own role
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot change your own role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.status(200).json({ success: true, message: `Role updated to ${role}`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/users/:id/toggle-active
export const toggleUserActive = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate yourself' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'}`,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Delete all related data
    await Promise.all([
      Property.deleteMany({ host: req.params.id }),
      Booking.deleteMany({ $or: [{ guest: req.params.id }, { host: req.params.id }] }),
      Review.deleteMany({ author: req.params.id }),
      User.findByIdAndDelete(req.params.id),
    ]);

    res.status(200).json({ success: true, message: 'User and all related data deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
//  PROPERTIES
// ══════════════════════════════════════════════════════

// GET /api/admin/properties
export const getAllProperties = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) query.$or = [
      { title:            { $regex: search, $options: 'i' } },
      { 'location.city':  { $regex: search, $options: 'i' } },
    ];

    const total      = await Property.countDocuments(query);
    const properties = await Property.find(query)
      .populate('host', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      properties,
      total,
      pages: Math.ceil(total / limit),
      page:  Number(page),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/properties/:id
export const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

    await Promise.all([
      Booking.deleteMany({ property: req.params.id }),
      Review.deleteMany({ property: req.params.id }),
      Property.findByIdAndDelete(req.params.id),
    ]);

    res.status(200).json({ success: true, message: 'Property deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/properties/:id/toggle-availability
export const togglePropertyAvailability = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

    property.isAvailable = !property.isAvailable;
    await property.save();

    res.status(200).json({
      success: true,
      message: `Property ${property.isAvailable ? 'listed' : 'hidden'}`,
      property,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
//  BOOKINGS
// ══════════════════════════════════════════════════════

// GET /api/admin/bookings
export const getAllBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;

    const total    = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('guest',    'name email')
      .populate('host',     'name email')
      .populate('property', 'title location images')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      bookings,
      total,
      pages: Math.ceil(total / limit),
      page:  Number(page),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/bookings/:id/cancel
export const adminCancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Already cancelled' });
    }

    booking.status             = 'cancelled';
    booking.cancellationReason = 'Cancelled by admin';
    booking.cancelledAt        = new Date();
    await booking.save();

    res.status(200).json({ success: true, message: 'Booking cancelled by admin', booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};