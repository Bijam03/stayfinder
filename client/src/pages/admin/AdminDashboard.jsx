import { useState, useEffect } from 'react';
import { getAdminStats } from '../../services/adminService';
import {
  FaUsers, FaBuilding, FaCalendarAlt, FaRupeeSign,
  FaUserPlus, FaCheckCircle, FaTimesCircle, FaClock,
} from 'react-icons/fa';

const StatCard = ({ label, value, icon: Icon, color, sub }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={16} className="text-white" />
      </div>
    </div>
    <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
    <p className="text-xs text-gray-500">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats()
      .then(({ data }) => setStats(data.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse h-28" />
      ))}
    </div>
  );

  if (!stats) return null;

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-sm text-gray-500 mt-0.5">All platform statistics</p>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users"      value={stats.totalUsers}      icon={FaUsers}         color="bg-blue-500"   sub={`${stats.totalHosts} hosts · ${stats.totalGuests} guests`} />
        <StatCard label="Total Properties" value={stats.totalProperties} icon={FaBuilding}      color="bg-green-500"  />
        <StatCard label="Total Bookings"   value={stats.totalBookings}   icon={FaCalendarAlt}   color="bg-purple-500" sub={`${stats.pendingBookings} pending`} />
        <StatCard label="Total Revenue"    value={`₹${stats.totalRevenue?.toLocaleString('en-IN')}`} icon={FaRupeeSign} color="bg-rose-500" sub="From paid bookings" />
      </div>

      {/* Booking breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
          <FaClock size={18} className="text-amber-500 mx-auto mb-2" />
          <p className="text-xl font-bold text-amber-600">{stats.pendingBookings}</p>
          <p className="text-xs text-amber-500">Pending</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
          <FaCheckCircle size={18} className="text-green-500 mx-auto mb-2" />
          <p className="text-xl font-bold text-green-600">{stats.confirmedBookings}</p>
          <p className="text-xs text-green-500">Confirmed</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
          <FaTimesCircle size={18} className="text-red-400 mx-auto mb-2" />
          <p className="text-xl font-bold text-red-500">{stats.cancelledBookings}</p>
          <p className="text-xs text-red-400">Cancelled</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Monthly Revenue */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Monthly Revenue (Last 6 months)</h3>
          {stats.monthlyRevenue.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No revenue data yet</p>
          ) : (
            <div className="space-y-3">
              {stats.monthlyRevenue.map((m) => {
                const max = Math.max(...stats.monthlyRevenue.map((x) => x.revenue));
                const pct = max > 0 ? (m.revenue / max) * 100 : 0;
                return (
                  <div key={`${m._id.year}-${m._id.month}`} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-8">{monthNames[m._id.month - 1]}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-rose-500 h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-24 text-right">
                      ₹{m.revenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Users */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Sign-ups</h3>
          <div className="space-y-3">
            {stats.recentUsers.map((u) => (
              <div key={u._id} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {u.avatar
                    ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                    : <span className="text-xs font-bold text-gray-500">{u.name?.charAt(0).toUpperCase()}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{u.name}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                  u.role === 'host'  ? 'bg-green-50 text-green-600' :
                  u.role === 'admin' ? 'bg-red-50 text-red-600'     :
                  'bg-blue-50 text-blue-600'
                }`}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Bookings</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                {['Guest', 'Property', 'Check-in', 'Check-out', 'Amount', 'Status'].map((h) => (
                  <th key={h} className="text-left py-2 px-3 text-gray-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.recentBookings.map((b) => (
                <tr key={b._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-medium text-gray-800">{b.guest?.name}</td>
                  <td className="py-2.5 px-3 text-gray-600 truncate max-w-[140px]">{b.property?.title}</td>
                  <td className="py-2.5 px-3 text-gray-600">{new Date(b.checkIn).toLocaleDateString('en-IN', { day:'numeric', month:'short', timeZone:'UTC' })}</td>
                  <td className="py-2.5 px-3 text-gray-600">{new Date(b.checkOut).toLocaleDateString('en-IN', { day:'numeric', month:'short', timeZone:'UTC' })}</td>
                  <td className="py-2.5 px-3 font-medium text-gray-800">₹{b.totalPrice?.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full font-medium capitalize ${
                      b.status === 'confirmed' ? 'bg-green-50 text-green-600' :
                      b.status === 'pending'   ? 'bg-amber-50 text-amber-600' :
                      b.status === 'cancelled' ? 'bg-red-50 text-red-500'     :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;