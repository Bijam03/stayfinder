import { useState, useEffect } from 'react';
import { getAllBookings, adminCancelBooking } from '../../services/adminService';
import toast from 'react-hot-toast';
import { FaCalendarAlt, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const statusColors = {
  pending:   'bg-amber-50 text-amber-600',
  confirmed: 'bg-green-50 text-green-600',
  cancelled: 'bg-red-50 text-red-500',
  completed: 'bg-blue-50 text-blue-600',
};

const AdminBookings = () => {
  const [bookings, setBookings]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [pages, setPages]         = useState(1);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatus] = useState('all');
  const [actionId, setActionId]   = useState(null);

  useEffect(() => { fetchBookings(); }, [page, statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data } = await getAllBookings({ page, limit: 10, status: statusFilter });
      setBookings(data.bookings);
      setTotal(data.total);
      setPages(data.pages);
    } catch { toast.error('Failed to load bookings'); }
    finally  { setLoading(false); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking as admin?')) return;
    try {
      setActionId(id);
      await adminCancelBooking(id);
      setBookings((prev) => prev.map((b) => b._id === id ? { ...b, status: 'cancelled' } : b));
      toast.success('Booking cancelled by admin');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionId(null); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Bookings</h2>
        <p className="text-sm text-gray-500 mt-0.5">{total} total bookings</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 w-fit">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
              statusFilter === s ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Property', 'Guest', 'Host', 'Dates', 'Nights', 'Amount', 'Payment', 'Status', 'Action'].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {[...Array(9)].map((_, j) => (
                      <td key={j} className="py-3 px-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : bookings.map((b) => (
                <tr key={b._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {b.property?.images?.[0]
                          ? <img src={b.property.images[0].url} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-xs">🏠</div>
                        }
                      </div>
                      <span className="text-xs font-medium text-gray-700 truncate max-w-[100px]">{b.property?.title}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-xs text-gray-600">{b.guest?.name}</td>
                  <td className="py-3 px-3 text-xs text-gray-600">{b.host?.name}</td>
                  <td className="py-3 px-3 text-xs text-gray-600 whitespace-nowrap">
                    {new Date(b.checkIn).toLocaleDateString('en-IN', { day:'numeric', month:'short', timeZone:'UTC' })}
                    {' → '}
                    {new Date(b.checkOut).toLocaleDateString('en-IN', { day:'numeric', month:'short', timeZone:'UTC' })}
                  </td>
                  <td className="py-3 px-3 text-xs text-gray-600 text-center">{b.numNights}</td>
                  <td className="py-3 px-3 text-xs font-medium text-gray-800">₹{b.totalPrice?.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      b.paymentStatus === 'paid'     ? 'bg-green-50 text-green-600' :
                      b.paymentStatus === 'refunded' ? 'bg-gray-100 text-gray-500'  :
                      'bg-red-50 text-red-500'
                    }`}>
                      {b.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[b.status]}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {b.status !== 'cancelled' && b.status !== 'completed' && (
                      <button
                        onClick={() => handleCancel(b._id)}
                        disabled={actionId === b._id}
                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 disabled:opacity-50 transition"
                      >
                        <FaTimes size={10} />
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Page {page} of {pages} · {total} bookings</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40">
                <FaChevronLeft size={11} />
              </button>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
                className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40">
                <FaChevronRight size={11} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBookings;