import { useState, useEffect } from 'react';
import { getAllUsers, updateUserRole, toggleUserActive, deleteUser } from '../../services/adminService';
import toast from 'react-hot-toast';
import { FaSearch, FaTrash, FaToggleOn, FaToggleOff, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const roleColors = {
  guest: 'bg-blue-50 text-blue-600',
  host:  'bg-green-50 text-green-600',
  admin: 'bg-red-50 text-red-600',
};

const AdminUsers = () => {
  const [users, setUsers]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [roleFilter, setRole] = useState('all');
  const [actionId, setActionId] = useState(null);

  useEffect(() => { fetchUsers(); }, [page, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await getAllUsers({ page, limit: 10, role: roleFilter, search });
      setUsers(data.users);
      setTotal(data.total);
      setPages(data.pages);
    } catch { toast.error('Failed to load users'); }
    finally  { setLoading(false); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleRoleChange = async (id, role) => {
    try {
      setActionId(id);
      await updateUserRole(id, role);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, role } : u));
      toast.success(`Role updated to ${role}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionId(null); }
  };

  const handleToggle = async (id) => {
    try {
      setActionId(id);
      const { data } = await toggleUserActive(id);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isActive: data.user.isActive } : u));
      toast.success(data.message);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionId(null); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name} and all their data? This cannot be undone.`)) return;
    try {
      setActionId(id);
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      toast.success('User deleted');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionId(null); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Users</h2>
          <p className="text-sm text-gray-500 mt-0.5">{total} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <FaSearch size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-gray-400"
            />
          </div>
          <button type="submit" className="bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl hover:bg-gray-700 transition">
            Search
          </button>
        </form>

        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
          {['all', 'guest', 'host', 'admin'].map((r) => (
            <button
              key={r}
              onClick={() => { setRole(r); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                roleFilter === r ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['User', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="py-3 px-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.map((user) => (
                <tr key={user._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                        {user.avatar
                          ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                          : <span className="text-xs font-bold text-gray-500">{user.name?.charAt(0).toUpperCase()}</span>
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">{user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      disabled={actionId === user._id}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer ${roleColors[user.role]}`}
                    >
                      <option value="guest">guest</option>
                      <option value="host">host</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      user.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggle(user._id)}
                        disabled={actionId === user._id}
                        title={user.isActive ? 'Deactivate' : 'Activate'}
                        className="text-gray-400 hover:text-gray-700 transition disabled:opacity-50"
                      >
                        {user.isActive ? <FaToggleOn size={18} className="text-green-500" /> : <FaToggleOff size={18} />}
                      </button>
                      <button
                        onClick={() => handleDelete(user._id, user.name)}
                        disabled={actionId === user._id}
                        title="Delete user"
                        className="text-gray-300 hover:text-red-500 transition disabled:opacity-50"
                      >
                        <FaTrash size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Page {page} of {pages} · {total} users</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <FaChevronLeft size={11} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <FaChevronRight size={11} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;