import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../App";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { LogOut, User, LayoutDashboard, BookOpen, ShieldCheck, Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const { user, isAdmin, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const navLinkClass = (path) =>
    `text-sm font-semibold transition-colors ${
      isActive(path) ? "text-indigo-600" : "text-slate-600 hover:text-indigo-600"
    }`;

  return (
    <nav className={`bg-white border-b border-slate-200 sticky top-0 z-50 transition-shadow duration-200 ${scrolled ? "shadow-md" : "shadow-sm"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center space-x-2.5 flex-shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200 flex-shrink-0">
              <BookOpen className="text-white w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900">
              EduStream <span className="text-indigo-600">Pro</span>
            </span>
          </Link>

          {/* ── Desktop Nav ── */}
          <div className="hidden md:flex items-center space-x-1">
            <Link to="/" className={`px-3 py-2 rounded-lg transition-colors ${isActive("/") ? "text-indigo-600 bg-indigo-50" : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"} text-sm font-semibold`}>
              Home
            </Link>
            <Link to="/courses" className={`px-3 py-2 rounded-lg transition-colors ${isActive("/courses") ? "text-indigo-600 bg-indigo-50" : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"} text-sm font-semibold`}>
              Courses
            </Link>

            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${isActive("/admin") ? "text-amber-600 bg-amber-50" : "text-amber-600 hover:bg-amber-50"}`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Admin</span>
                  </Link>
                )}

                <Link
                  to="/dashboard"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${isActive("/dashboard") ? "text-indigo-600 bg-indigo-50" : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"}`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                {/* User Avatar Pill */}
                <div className="flex items-center space-x-2 ml-2 pl-4 border-l border-slate-200">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-extrabold shadow-sm overflow-hidden flex-shrink-0">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        (user?.displayName || user?.email || "U").charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 max-w-[80px] truncate">
                      {user?.displayName?.split(" ")[0] || "Profile"}
                    </span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2 ml-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-slate-600 hover:text-indigo-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-[0.97]"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* ── Mobile: Avatar + Hamburger ── */}
          <div className="flex md:hidden items-center gap-2">
            {user && (
              <Link to="/profile" className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-extrabold shadow-sm overflow-hidden flex-shrink-0">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  (user?.displayName || user?.email || "U").charAt(0).toUpperCase()
                )}
              </Link>
            )}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden"
            >
              <div className="pb-4 pt-2 space-y-1 border-t border-slate-100 mt-1">

                {/* User info banner */}
                {user && (
                  <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-extrabold overflow-hidden flex-shrink-0">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        (user?.displayName || user?.email || "U").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{user?.displayName || "Student"}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                    </div>
                    {isAdmin && (
                      <span className="ml-auto flex-shrink-0 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                )}

                <MobileNavLink to="/" label="Home" icon={<BookOpen className="w-4 h-4" />} active={isActive("/")} />
                <MobileNavLink to="/courses" label="Courses" icon={<BookOpen className="w-4 h-4" />} active={isActive("/courses")} />

                {user ? (
                  <>
                    {isAdmin && (
                      <MobileNavLink to="/admin" label="Admin Panel" icon={<ShieldCheck className="w-4 h-4" />} active={isActive("/admin")} accent="amber" />
                    )}
                    <MobileNavLink to="/dashboard" label="Dashboard" icon={<LayoutDashboard className="w-4 h-4" />} active={isActive("/dashboard")} />
                    <MobileNavLink to="/profile" label="My Profile" icon={<User className="w-4 h-4" />} active={isActive("/profile")} />

                    <div className="pt-2 mt-2 border-t border-slate-100">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="pt-2 mt-2 border-t border-slate-100 space-y-2">
                    <Link
                      to="/login"
                      className="flex items-center justify-center w-full py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Log In
                    </Link>
                    <Link
                      to="/register"
                      className="flex items-center justify-center w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                    >
                      Create Free Account
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

function MobileNavLink({ to, label, icon, active, accent = "indigo" }) {
  const activeColors = {
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600",
  };
  const inactiveColors = {
    indigo: "text-slate-600 hover:bg-slate-50 hover:text-indigo-600",
    amber: "text-amber-600 hover:bg-amber-50",
  };

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
        active ? activeColors[accent] : inactiveColors[accent]
      }`}
    >
      {icon}
      <span>{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-current opacity-60" />}
    </Link>
  );
}