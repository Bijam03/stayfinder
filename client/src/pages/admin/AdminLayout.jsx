import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FaHome, FaUsers, FaBuilding, FaCalendarAlt,
  FaChartBar, FaBars, FaTimes, FaSignOutAlt,
  FaShieldAlt, FaChevronRight,
} from 'react-icons/fa';

const navItems = [
  { path: '/admin',            label: 'Dashboard',  icon: FaChartBar   },
  { path: '/admin/users',      label: 'Users',      icon: FaUsers      },
  { path: '/admin/properties', label: 'Properties', icon: FaBuilding   },
  { path: '/admin/bookings',   label: 'Bookings',   icon: FaCalendarAlt },
];

const AdminLayout = ({ children }) => {
  const location      = useLocation();
  const navigate      = useNavigate();
  const { logout }    = useAuth();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center">
            <FaShieldAlt size={14} className="text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-bold">StayFinder</p>
            <p className="text-gray-400 text-xs">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                         font-medium transition ${
                active
                  ? 'bg-rose-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon size={15} />
              {label}
              {active && <FaChevronRight size={10} className="ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-5 border-t border-gray-800 pt-4 space-y-1">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                     text-gray-400 hover:text-white hover:bg-gray-800 transition"
        >
          <FaHome size={14} />
          Back to Site
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                     text-gray-400 hover:text-red-400 hover:bg-gray-800 transition"
        >
          <FaSignOutAlt size={14} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-gray-900 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="relative w-56 bg-gray-900 flex flex-col z-10">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <FaTimes size={16} />
            </button>
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-900"
          >
            <FaBars size={18} />
          </button>
          <h1 className="text-sm font-semibold text-gray-700 flex-1">
            {navItems.find((n) => n.path === location.pathname)?.label || 'Admin'}
          </h1>
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-full">
            <FaShieldAlt size={11} className="text-rose-500" />
            <span className="text-xs font-medium text-rose-600">Admin</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;