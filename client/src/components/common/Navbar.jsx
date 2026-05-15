import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import {
  FaPlus,
  FaList,
  FaCalendarAlt,
  FaChartBar,
  FaSignOutAlt,
  FaUserCircle,
  FaBars,
  FaTimes,
  FaShieldAlt,
  FaUsers,
  FaHome,
} from "react-icons/fa";

const Navbar = () => {
  const { user, logout, isHost, isAdmin, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully!");
    setDropdownOpen(false);
    setMobileOpen(false);
    navigate("/");
  };

  // Helper — highlight active nav link
  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
    `text-sm font-medium transition-colors duration-150 ${
      isActive(path)
        ? "text-rose-500"
        : "text-gray-500 hover:text-gray-900"
    }`;

  // Host nav links
  const hostLinks = [
    { to: "/dashboard",      icon: FaChartBar,    label: "Dashboard"    },
    { to: "/create-property",icon: FaPlus,         label: "Add Property" },
    { to: "/my-listings",    icon: FaList,         label: "Listings"     },
    { to: "/host-bookings",  icon: FaCalendarAlt,  label: "Bookings"     },
  ];

  // Guest nav links
  const guestLinks = [
    { to: "/my-bookings", icon: FaCalendarAlt, label: "My Bookings" },
  ];

  // Admin nav links
  const adminLinks = [
    { to: "/admin",            icon: FaChartBar,   label: "Dashboard"   },
    { to: "/admin/users",      icon: FaUsers,      label: "Users"       },
    { to: "/admin/properties", icon: FaHome,        label: "Properties"  },
    { to: "/admin/bookings",   icon: FaCalendarAlt, label: "Bookings"   },
  ];

  const navLinks = isAdmin ? adminLinks : isHost ? hostLinks : guestLinks;

  return (
    <>
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ── */}
            <Link
              to="/"
              className="flex items-center gap-2 flex-shrink-0"
              onClick={() => setMobileOpen(false)}
            >
              <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">S</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 tracking-tight">
                StayFinder
              </span>
            </Link>

            {/* ── Desktop Nav Links ── */}
            {isLoggedIn && (
              <div className="hidden md:flex items-center gap-6">
                {navLinks.map(({ to, label }) => (
                  <Link key={to} to={to} className={navLinkClass(to)}>
                    {label}
                  </Link>
                ))}
              </div>
            )}

            {/* ── Desktop Right Side ── */}
            <div className="hidden md:flex items-center gap-3">
              {!isLoggedIn ? (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 transition"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm font-medium bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg transition"
                  >
                    Sign up
                  </Link>
                </>
              ) : (
                /* ── User Dropdown ── */
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2.5 border border-gray-200 hover:border-gray-300 rounded-full pl-3 pr-2 py-1.5 transition group"
                  >
                    {/* Avatar or initials */}
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-rose-100 flex items-center justify-center flex-shrink-0">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-rose-500 text-xs font-semibold">
                          {user?.name?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {/* Name */}
                    <span className="text-sm font-medium text-gray-700 max-w-24 truncate">
                      {user?.name?.split(" ")[0]}
                    </span>
                    {/* Hamburger / close icon */}
                    <div className="text-gray-400 group-hover:text-gray-600 transition">
                      {dropdownOpen
                        ? <FaTimes size={12} />
                        : <FaBars size={12} />
                      }
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <>
                      {/* Click outside to close */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden z-20">

                        {/* User info header */}
                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {user?.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {user?.email}
                          </p>
                          <span className="inline-block mt-1.5 text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full capitalize font-medium">
                            {user?.role}
                          </span>
                        </div>

                        {/* Nav links in dropdown */}
                        <div className="py-1">
                          {navLinks.map(({ to, icon: Icon, label }) => (
                            <Link
                              key={to}
                              to={to}
                              onClick={() => setDropdownOpen(false)}
                              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition ${
                                isActive(to)
                                  ? "text-rose-500 bg-rose-50"
                                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                              }`}
                            >
                              <Icon size={14} className="flex-shrink-0" />
                              {label}
                            </Link>
                          ))}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-100" />

                        {/* Profile + Logout */}
                        <div className="py-1">
                          <Link
                            to="/profile"
                            onClick={() => setDropdownOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition ${
                              isActive("/profile")
                                ? "text-rose-500 bg-rose-50"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                          >
                            <FaUserCircle size={14} />
                            Profile
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition"
                          >
                            <FaSignOutAlt size={14} />
                            Log out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ── Mobile Menu Button ── */}
            <button
              className="md:hidden p-2 text-gray-500 hover:text-gray-900 transition"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">

              {!isLoggedIn ? (
                /* Not logged in — show login/signup */
                <div className="flex flex-col gap-2 pt-2 pb-3">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="text-center text-sm font-medium text-gray-700 border border-gray-200 py-2.5 rounded-xl hover:bg-gray-50 transition"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="text-center text-sm font-medium bg-rose-500 text-white py-2.5 rounded-xl hover:bg-rose-600 transition"
                  >
                    Sign up
                  </Link>
                </div>
              ) : (
                <>
                  {/* User info */}
                  <div className="flex items-center gap-3 py-3 border-b border-gray-100 mb-2">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-rose-100 flex items-center justify-center flex-shrink-0">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-rose-500 font-semibold">
                          {user?.name?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {user?.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {user?.email}
                      </p>
                    </div>
                    <span className="ml-auto text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full capitalize font-medium flex-shrink-0">
                      {user?.role}
                    </span>
                  </div>

                  {/* Nav links */}
                  {navLinks.map(({ to, icon: Icon, label }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                        isActive(to)
                          ? "bg-rose-50 text-rose-500"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <Icon size={15} className="flex-shrink-0" />
                      {label}
                    </Link>
                  ))}

                  {/* Profile */}
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                      isActive("/profile")
                        ? "bg-rose-50 text-rose-500"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <FaUserCircle size={15} />
                    Profile
                  </Link>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition"
                  >
                    <FaSignOutAlt size={15} />
                    Log out
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;