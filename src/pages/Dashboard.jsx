import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../App";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Clock, Award, Play, ChevronRight, Download, X, CheckCircle, TrendingUp, Sparkles } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCertificate, setShowCertificate] = useState(null);

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, "enrollments"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const enrollmentsData = await Promise.all(
          querySnapshot.docs.map(async (enrollmentDoc) => {
            const data = enrollmentDoc.data();
            const courseDoc = await getDoc(doc(db, "courses", data.courseId));
            return {
              id: enrollmentDoc.id,
              ...data,
              course: courseDoc.exists() ? { id: courseDoc.id, ...courseDoc.data() } : null
            };
          })
        );
        setEnrollments(enrollmentsData.filter(e => e.course !== null));
      } catch (error) {
        console.error("Error fetching enrollments:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEnrollments();
  }, [user]);

  const completedCourses = enrollments.filter(e => e.progress === 100);
  const inProgressCourses = enrollments.filter(e => e.progress < 100);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600" />
          <p className="text-sm text-slate-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12">

        {/* Header */}
        <div className="mb-6 sm:mb-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                Welcome back,<br className="sm:hidden" />{" "}
                <span className="text-indigo-600">{user?.displayName?.split(" ")[0] || "Student"}</span>!
              </h1>
              <p className="text-slate-500 mt-1.5 text-sm sm:text-base">Continue your learning journey where you left off.</p>
            </div>
            <div className="hidden sm:flex items-center space-x-2 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-sm flex-shrink-0">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold text-slate-700">{inProgressCourses.length} In Progress</span>
            </div>
          </div>

          {/* Mobile Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mt-5 sm:hidden">
            {[
              { label: "Enrolled", value: enrollments.length, color: "text-indigo-600", bg: "bg-indigo-50" },
              { label: "Completed", value: completedCourses.length, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Certificates", value: completedCourses.length, color: "text-amber-600", bg: "bg-amber-50" },
            ].map((stat) => (
              <div key={stat.label} className={`${stat.bg} rounded-2xl p-3 text-center`}>
                <div className={`text-xl font-extrabold ${stat.color}`}>{stat.value}</div>
                <div className="text-[10px] font-bold text-slate-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

          {/* Left: Enrolled Courses */}
          <div className="lg:col-span-2 space-y-5 sm:space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-indigo-600" />
                My Courses
              </h2>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[11px] font-bold">
                  {enrollments.length} Enrolled
                </span>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[11px] font-bold">
                  {completedCourses.length} Done
                </span>
              </div>
            </div>

            {enrollments.length > 0 ? (
              <div className="space-y-4">
                {enrollments.map((enrollment) => (
                  <motion.div
                    key={enrollment.id}
                    whileHover={{ y: -2 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 overflow-hidden shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row">
                      {/* Thumbnail */}
                      <div className="w-full sm:w-44 h-40 sm:h-auto relative flex-shrink-0">
                        <img
                          src={enrollment.course.thumbnail || `https://picsum.photos/seed/${enrollment.course.id}/400/300`}
                          alt={enrollment.course.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {/* Progress overlay on mobile */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                          <div
                            className={`h-full ${enrollment.progress === 100 ? "bg-emerald-400" : "bg-indigo-400"}`}
                            style={{ width: `${enrollment.progress}%` }}
                          />
                        </div>
                        {enrollment.progress === 100 && (
                          <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4 sm:p-5 flex-grow flex flex-col justify-between min-w-0">
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5 leading-snug line-clamp-2">
                            {enrollment.course.title}
                          </h3>
                          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 mb-3">
                            <div className="flex items-center">
                              <Clock className="w-3.5 h-3.5 mr-1" />
                              <span>{enrollment.course.duration || "10h content"}</span>
                            </div>
                            <div className="flex items-center">
                              <Award className="w-3.5 h-3.5 mr-1" />
                              <span>Certificate</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          {/* Progress */}
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className={enrollment.progress === 100 ? "text-emerald-600" : "text-indigo-600"}>
                              {enrollment.progress}% {enrollment.progress === 100 ? "Completed" : "Complete"}
                            </span>
                            <span className="text-slate-400">{enrollment.completedLessons?.length || 0} lessons done</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`${enrollment.progress === 100 ? "bg-emerald-500" : "bg-indigo-600"} h-full transition-all duration-500 rounded-full`}
                              style={{ width: `${enrollment.progress}%` }}
                            />
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-end gap-2 pt-1">
                            {enrollment.progress === 100 && (
                              <button
                                onClick={() => setShowCertificate(enrollment)}
                                className="inline-flex items-center px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-all border border-emerald-100"
                              >
                                <Award className="w-3.5 h-3.5 mr-1.5" />
                                Certificate
                              </button>
                            )}
                            <Link
                              to={`/learn/${enrollment.courseId}`}
                              className="inline-flex items-center px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all"
                            >
                              <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                              {enrollment.progress === 100 ? "Review" : "Continue"}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-10 sm:p-14 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-7 h-7 text-slate-300" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">No courses yet</h3>
                <p className="text-slate-500 text-sm mb-6">Explore our catalog and start your learning journey today!</p>
                <Link
                  to="/#courses"
                  className="inline-flex items-center px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all text-sm"
                >
                  Browse Courses
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            )}
          </div>

          {/* Right: Stats + Certificates */}
          <div className="space-y-5 sm:space-y-6">

            {/* Stats Card — hidden on mobile (shown inline above) */}
            <div className="hidden sm:block bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-100">
              <h3 className="text-base sm:text-lg font-bold mb-5">Learning Stats</h3>
              <div className="space-y-4">
                {[
                  { icon: <BookOpen className="w-5 h-5" />, label: "Enrolled", value: enrollments.length },
                  { icon: <CheckCircle className="w-5 h-5" />, label: "Completed", value: completedCourses.length },
                  { icon: <Award className="w-5 h-5" />, label: "Certificates", value: completedCourses.length },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                        {item.icon}
                      </div>
                      <span className="font-medium text-sm">{item.label}</span>
                    </div>
                    <span className="text-2xl font-bold">{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Overall Progress */}
              {enrollments.length > 0 && (
                <div className="mt-6 pt-5 border-t border-white/20">
                  <div className="flex justify-between text-xs font-bold mb-2 opacity-80">
                    <span>Overall Progress</span>
                    <span>{Math.round(enrollments.reduce((a, e) => a + e.progress, 0) / enrollments.length)}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-white h-full rounded-full transition-all"
                      style={{ width: `${Math.round(enrollments.reduce((a, e) => a + e.progress, 0) / enrollments.length)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Certificates Card */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-amber-500" />
                My Certificates
              </h3>
              <div className="space-y-3">
                {completedCourses.length > 0 ? completedCourses.map(e => (
                  <div key={e.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Award className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-xs leading-snug line-clamp-1">{e.course.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Verified Certificate</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowCertificate(e)}
                      className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors flex-shrink-0 ml-2"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Award className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">Complete a course to earn<br />your first certificate!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Browse More CTA */}
            <Link
              to="/#courses"
              className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-200 hover:shadow-md transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Explore More</p>
                  <p className="text-[11px] text-slate-400">Browse all courses</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      <AnimatePresence>
        {showCertificate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  <span className="font-bold text-slate-900 text-sm sm:text-base">Certificate of Completion</span>
                </div>
                <button
                  onClick={() => setShowCertificate(null)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              {/* Certificate Body */}
              <div className="p-4 sm:p-6">
                <div className="border-4 sm:border-8 border-indigo-50 rounded-xl sm:rounded-2xl p-5 sm:p-8 text-center relative overflow-hidden bg-gradient-to-b from-white to-slate-50/50">
                  {/* Dot Pattern */}
                  <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
                    style={{ backgroundImage: "radial-gradient(#4f46e5 1px, transparent 1px)", backgroundSize: "20px 20px" }}
                  />

                  <div className="relative z-10">
                    {/* Badge */}
                    <div className="w-14 h-14 sm:w-20 sm:h-20 bg-indigo-600 rounded-full flex items-center justify-center shadow-xl shadow-indigo-200 mx-auto mb-4 sm:mb-6">
                      <Award className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
                    </div>

                    <p className="text-indigo-600 font-bold tracking-widest uppercase text-[10px] sm:text-xs mb-2 sm:mb-3">
                      Certificate of Completion
                    </p>
                    <p className="text-slate-400 mb-4 sm:mb-6 italic text-xs sm:text-sm">This is to certify that</p>

                    <h1 className="text-2xl sm:text-4xl font-serif font-bold text-slate-900 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-slate-100 inline-block px-4 sm:px-12">
                      {user?.displayName}
                    </h1>

                    <p className="text-slate-500 mb-4 sm:mb-6 text-xs sm:text-sm">has successfully completed</p>

                    <h3 className="text-base sm:text-2xl font-bold text-indigo-600 mb-6 sm:mb-10 px-2">
                      {showCertificate.course.title}
                    </h3>

                    {/* Footer signatures */}
                    <div className="flex items-end justify-between mt-4 sm:mt-8 gap-2">
                      <div className="text-left">
                        <div className="w-20 sm:w-32 border-b border-slate-300 mb-1.5" />
                        <p className="text-[10px] sm:text-xs font-bold text-slate-900">Instructor</p>
                        <p className="text-[9px] sm:text-[10px] text-slate-400">{showCertificate.course.instructor}</p>
                      </div>

                      <div className="text-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center mx-auto mb-1">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VERIFIED_${showCertificate.id}`}
                            alt="QR Code"
                            className="w-10 h-10 sm:w-14 sm:h-14 opacity-50"
                          />
                        </div>
                        <p className="text-[9px] sm:text-[10px] text-slate-400">ID: {showCertificate.id.substring(0, 8)}</p>
                      </div>

                      <div className="text-right">
                        <div className="w-20 sm:w-32 border-b border-slate-300 mb-1.5" />
                        <p className="text-[10px] sm:text-xs font-bold text-slate-900">Date Issued</p>
                        <p className="text-[9px] sm:text-[10px] text-slate-400">{new Date().toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 px-5 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => setShowCertificate(null)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all text-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}