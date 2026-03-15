import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { LogOut, User, LayoutDashboard, BookOpen, ShieldCheck } from "lucide-react";

export default function Navbar() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <BookOpen className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">EduStream <span className="text-indigo-600">Pro</span></span>
            </Link>
            <div className="hidden md:ml-8 md:flex md:space-x-8">
              <a href="/" className="text-slate-600 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors">Home</a>
              
              <a href="#courses" className="text-slate-600 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors">Course</a>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin" className="flex items-center space-x-1 text-amber-600 hover:text-amber-700 px-3 py-2 text-sm font-medium transition-colors">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Admin</span>
                  </Link>
                )}
                <Link to="/dashboard" className="flex items-center space-x-1 text-slate-600 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <Link to="/profile" className="text-slate-600 hover:text-indigo-600 p-2 rounded-full hover:bg-slate-100 transition-colors">
                  <User className="w-5 h-5" />
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-slate-600 hover:text-red-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-600 hover:text-indigo-600 px-4 py-2 text-sm font-medium transition-colors">Login</Link>
                <Link to="/register" className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md hover:shadow-indigo-200">Register</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
