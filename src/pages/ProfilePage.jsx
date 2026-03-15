import React, { useState, useEffect } from "react";
import { useAuth } from "../App";
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, updateDoc, collection, getDocs, query, where, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { User, Mail, Shield, Save, CheckCircle, Lock, BookOpen, Award, TrendingUp, Eye, EyeOff, AlertCircle, Clock, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";

export default function ProfilePage() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState("");

  // Stats
  const [stats, setStats] = useState({ enrolled: 0, completed: 0, inProgress: 0, certificates: 0 });
  const [recentCourses, setRecentCourses] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, "enrollments"), where("userId", "==", user.uid));
        const snap = await getDocs(q);
        const enrollments = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        const completed = enrollments.filter(e => e.progress === 100).length;
        const inProgress = enrollments.filter(e => e.progress > 0 && e.progress < 100).length;

        // Fetch recent course titles
        const recent = await Promise.all(
          enrollments.slice(0, 3).map(async (e) => {
            const cDoc = await getDoc(doc(db, "courses", e.courseId));
            return {
              ...e,
              courseTitle: cDoc.exists() ? cDoc.data().title : "Unknown Course",
              thumbnail: cDoc.exists() ? cDoc.data().thumbnail : null,
            };
          })
        );

        setStats({ enrolled: enrollments.length, completed, inProgress, certificates: completed });
        setRecentCourses(recent);
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setSuccess("");
    setError("");
    try {
      await updateProfile(user, { displayName });
      await updateDoc(doc(db, "users", user.uid), { displayName });
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);
    if (newPassword !== confirmPassword) { setPwError("New passwords do not match."); return; }
    if (newPassword.length < 6) { setPwError("Password must be at least 6 characters."); return; }
    setPwLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setPwSuccess(true);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err) {
      setPwError(err.code === "auth/wrong-password" ? "Current password is incorrect." : "Failed to update password.");
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
    { id: "security", label: "Security", icon: <Lock className="w-4 h-4" /> },
    { id: "activity", label: "Activity", icon: <TrendingUp className="w-4 h-4" /> },
  ];

  const isGoogleUser = user?.providerData?.[0]?.providerId === "google.com";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12">

        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">My Profile</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">Manage your account settings and preferences.</p>
        </div>

        {/* Profile Card Header */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-5 sm:mb-6">
          {/* Cover */}
          <div className="h-12 sm:h-22 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 relative">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "200px 20px" }}
            />
          </div>

          {/* Avatar + Info */}
          <div className="px-5 sm:px-8 pb-5 sm:pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="flex items-end gap-4 -mt-10 sm:-mt-12">
                <div className="mt-11 w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl sm:rounded-3xl shadow-xl flex items-center justify-center border-9 border-white overflow-hidden flex-shrink-0">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-indigo-600 flex items-center justify-center">
                      <span className="text-2xl sm:text-3xl font-extrabold text-white">
                        {(user?.displayName || user?.email || "U").charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="pb-1">
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
                    {user?.displayName || "Student"}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{user?.email}</p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full capitalize border border-indigo-100">
                    {userData?.role || "Student"}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-all font-bold text-xs sm:text-sm self-start sm:self-auto"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Quick Stats — mobile grid */}
            {!statsLoading && (
              <div className="grid grid-cols-4 gap-2 sm:gap-4 mt-5 pt-5 border-t border-slate-100">
                {[
                  { label: "Enrolled", value: stats.enrolled, color: "text-indigo-600" },
                  { label: "Completed", value: stats.completed, color: "text-emerald-600" },
                  { label: "In Progress", value: stats.inProgress, color: "text-amber-600" },
                  { label: "Certificates", value: stats.certificates, color: "text-violet-600" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className={`text-xl sm:text-2xl font-extrabold ${s.color}`}>{s.value}</div>
                    <div className="text-[9px] sm:text-xs text-slate-400 font-medium mt-0.5 leading-tight">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-1 mb-5 sm:mb-6 shadow-sm overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── Profile Tab ── */}
          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-8"
            >
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-5 sm:mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                Account Information
              </h3>

              <form onSubmit={handleUpdate} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm"
                        placeholder="Your full name"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        disabled
                        value={user?.email || ""}
                        className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 cursor-not-allowed text-sm"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 ml-1">Email cannot be changed</p>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Account Role</label>
                    <div className="relative">
                      <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <div className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 text-sm capitalize">
                        {userData?.role || "Student"}
                      </div>
                    </div>
                  </div>

                  {/* Member since */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Member Since</label>
                    <div className="relative">
                      <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <div className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 text-sm">
                        {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "N/A"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Success / Error */}
                <AnimatePresence>
                  {(success || error) && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`flex items-center gap-2 p-3 rounded-xl text-sm font-semibold ${
                        success ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
                      }`}
                    >
                      {success ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                      <span>{success || error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 text-sm sm:text-base"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{loading ? "Saving..." : "Save Changes"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* ── Security Tab ── */}
          {activeTab === "security" && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Change Password */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-8">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-indigo-600" />
                  Change Password
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mb-5 sm:mb-6">
                  {isGoogleUser ? "Password change is not available for Google accounts." : "Use a strong password to keep your account secure."}
                </p>

                {isGoogleUser ? (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                    <p className="text-sm text-slate-600 font-medium">You're signed in with Google. Password is managed by Google.</p>
                  </div>
                ) : (
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Current Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type={showCurrentPw ? "text" : "password"}
                          value={currentPassword}
                          onChange={e => setCurrentPassword(e.target.value)}
                          required
                          className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm"
                          placeholder="Enter current password"
                        />
                        <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* New Password */}
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type={showNewPw ? "text" : "password"}
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            required
                            className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm"
                            placeholder="New password"
                          />
                          <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Confirm Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            required
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm"
                            placeholder="Confirm new password"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Strength indicator */}
                    {newPassword && (
                      <div>
                        <div className="flex gap-1 mb-1">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                              i < (newPassword.length >= 10 ? 4 : newPassword.length >= 8 ? 3 : newPassword.length >= 6 ? 2 : 1)
                                ? ["bg-red-400", "bg-amber-400", "bg-indigo-400", "bg-emerald-500"][
                                    Math.min(newPassword.length >= 10 ? 3 : newPassword.length >= 8 ? 2 : newPassword.length >= 6 ? 1 : 0, i)
                                  ]
                                : "bg-slate-200"
                            }`} />
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {newPassword.length < 6 ? "Too short" : newPassword.length < 8 ? "Weak" : newPassword.length < 10 ? "Good" : "Strong"}
                        </p>
                      </div>
                    )}

                    <AnimatePresence>
                      {(pwError || pwSuccess) && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className={`flex items-center gap-2 p-3 rounded-xl text-sm font-semibold ${
                            pwSuccess ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
                          }`}
                        >
                          {pwSuccess ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                          <span>{pwSuccess ? "Password updated successfully!" : pwError}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={pwLoading}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 text-sm"
                      >
                        {pwLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
                        <span>{pwLoading ? "Updating..." : "Update Password"}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Danger Zone */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-red-100 shadow-sm p-5 sm:p-8">
                <h3 className="text-base font-bold text-red-600 mb-1 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Danger Zone
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mb-4">Once you sign out, you will need your credentials to sign back in.</p>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-5 py-2.5 border-2 border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-all text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out of Account
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Activity Tab ── */}
          {activeTab === "activity" && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { label: "Enrolled", value: stats.enrolled, icon: <BookOpen className="w-5 h-5 text-indigo-600" />, bg: "bg-indigo-50", val: "text-indigo-600" },
                  { label: "Completed", value: stats.completed, icon: <CheckCircle className="w-5 h-5 text-emerald-600" />, bg: "bg-emerald-50", val: "text-emerald-600" },
                  { label: "In Progress", value: stats.inProgress, icon: <TrendingUp className="w-5 h-5 text-amber-600" />, bg: "bg-amber-50", val: "text-amber-600" },
                  { label: "Certificates", value: stats.certificates, icon: <Award className="w-5 h-5 text-violet-600" />, bg: "bg-violet-50", val: "text-violet-600" },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm text-center">
                    <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>{s.icon}</div>
                    <div className={`text-2xl font-extrabold ${s.val}`}>{s.value}</div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Recent Courses */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-8">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4 sm:mb-5 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  Recent Courses
                </h3>

                {statsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="animate-pulse h-16 bg-slate-100 rounded-xl" />)}
                  </div>
                ) : recentCourses.length > 0 ? (
                  <div className="space-y-3">
                    {recentCourses.map((e) => (
                      <div key={e.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden flex-shrink-0 bg-slate-200">
                          {e.thumbnail ? (
                            <img src={e.thumbnail} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full bg-indigo-100 flex items-center justify-center">
                              <BookOpen className="w-5 h-5 text-indigo-500" />
                            </div>
                          )}
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate">{e.courseTitle}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex-grow bg-slate-200 rounded-full h-1.5 overflow-hidden max-w-[120px] sm:max-w-[180px]">
                              <div
                                className={`h-full rounded-full ${e.progress === 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
                                style={{ width: `${e.progress}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold ${e.progress === 100 ? "text-emerald-600" : "text-indigo-600"}`}>
                              {e.progress}%
                            </span>
                          </div>
                        </div>
                        {e.progress === 100 && (
                          <Award className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <BookOpen className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-400">No courses enrolled yet.</p>
                  </div>
                )}

                {recentCourses.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                    <a href="/dashboard" className="text-xs sm:text-sm font-bold text-indigo-600 hover:underline">
                      View all courses in Dashboard →
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}