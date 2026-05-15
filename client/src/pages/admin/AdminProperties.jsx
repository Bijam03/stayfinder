import { useState, useEffect } from 'react';
import { getAllProperties, deleteProperty, toggleProperty } from '../../services/adminService';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import {
  FaSearch, FaTrash, FaEye, FaToggleOn, FaToggleOff,
  FaStar, FaMapMarkerAlt, FaChevronLeft, FaChevronRight,
} from 'react-icons/fa';

const AdminProperties = () => {
  const [properties, setProperties] = useState([]);
  const [total, setTotal]           = useState(0);
  const [pages, setPages]           = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [actionId, setActionId]     = useState(null);

  useEffect(() => { fetchProperties(); }, [page]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const { data } = await getAllProperties({ page, limit: 10, search });
      setProperties(data.properties);
      setTotal(data.total);
      setPages(data.pages);
    } catch { toast.error('Failed to load properties'); }
    finally  { setLoading(false); }
  };

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchProperties(); };

  const handleToggle = async (id) => {
    try {
      setActionId(id);
      const { data } = await toggleProperty(id);
      setProperties((prev) => prev.map((p) => p._id === id ? { ...p, isAvailable: data.property.isAvailable } : p));
      toast.success(data.message);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionId(null); }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? All bookings and reviews will also be deleted.`)) return;
    try {
      setActionId(id);
      await deleteProperty(id);
      setProperties((prev) => prev.filter((p) => p._id !== id));
      toast.success('Property deleted');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionId(null); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Properties</h2>
        <p className="text-sm text-gray-500 mt-0.5">{total} total properties</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <FaSearch size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or city..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-gray-400"
          />
        </div>
        <button type="submit" className="bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl hover:bg-gray-700 transition">
          Search
        </button>
      </form>

      {/* Cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
              <div className="h-36 bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((prop) => (
            <div key={prop._id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition">
              {/* Image */}
              <div className="relative h-36 bg-gray-100">
                {prop.images?.[0] ? (
                  <img src={prop.images[0].url} alt={prop.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">🏠</div>
                )}
                {/* Availability badge */}
                <div className={`absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                  prop.isAvailable ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {prop.isAvailable ? 'Listed' : 'Hidden'}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 truncate mb-1">{prop.title}</h3>
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                  <FaMapMarkerAlt size={9} />
                  <span>{prop.location?.city}, {prop.location?.state}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  <span className="font-medium text-gray-800">₹{prop.price?.toLocaleString('en-IN')}/night</span>
                  {prop.numReviews > 0 && (
                    <span className="flex items-center gap-1">
                      <FaStar size={10} className="text-amber-400" />
                      {prop.rating?.toFixed(1)} ({prop.numReviews})
                    </span>
                  )}
                </div>

                {/* Host */}
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 mb-3">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                    {prop.host?.avatar
                      ? <img src={prop.host.avatar} alt="" className="w-full h-full object-cover" />
                      : <span className="text-xs font-bold text-gray-500">{prop.host?.name?.charAt(0).toUpperCase()}</span>
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-600 truncate">{prop.host?.name}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    to={`/properties/${prop._id}`}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 border border-gray-200 px-2.5 py-1.5 rounded-lg transition"
                  >
                    <FaEye size={10} /> View
                  </Link>
                  <button
                    onClick={() => handleToggle(prop._id)}
                    disabled={actionId === prop._id}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 border border-gray-200 px-2.5 py-1.5 rounded-lg transition disabled:opacity-50"
                  >
                    {prop.isAvailable
                      ? <><FaToggleOn size={12} className="text-green-500" /> Hide</>
                      : <><FaToggleOff size={12} /> Show</>
                    }
                  </button>
                  <button
                    onClick={() => handleDelete(prop._id, prop.title)}
                    disabled={actionId === prop._id}
                    className="ml-auto flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 border border-red-100 hover:border-red-200 px-2.5 py-1.5 rounded-lg transition disabled:opacity-50"
                  >
                    <FaTrash size={10} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">Page {page} of {pages} · {total} properties</p>
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
  );
};

export default AdminProperties;