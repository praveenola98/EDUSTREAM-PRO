import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../App";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Clock, Award, Play, ChevronRight, Download, X, CheckCircle } from "lucide-react";

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold text-slate-900">Welcome back, {user?.displayName || "Student"}!</h1>
        <p className="text-slate-500 mt-2">Continue your learning journey where you left off.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Enrolled Courses */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-indigo-600" />
              My Courses
            </h2>
            <div className="flex space-x-2">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold">
                {enrollments.length} Enrolled
              </span>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold">
                {completedCourses.length} Completed
              </span>
            </div>
          </div>

          {enrollments.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {enrollments.map((enrollment) => (
                <motion.div 
                  key={enrollment.id}
                  whileHover={{ x: 5 }}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col md:flex-row"
                >
                  <div className="w-full md:w-48 h-32 md:h-auto relative flex-shrink-0">
                    <img 
                      src={enrollment.course.thumbnail || `https://picsum.photos/seed/${enrollment.course.id}/400/300`} 
                      alt={enrollment.course.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {enrollment.progress === 100 && (
                      <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{enrollment.course.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-slate-500 mb-4">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{enrollment.course.duration || "10h content"}</span>
                        </div>
                        <div className="flex items-center">
                          <Award className="w-4 h-4 mr-1" />
                          <span>Certificate</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className={enrollment.progress === 100 ? "text-emerald-600" : "text-indigo-600"}>
                          {enrollment.progress}% {enrollment.progress === 100 ? "Completed" : "Complete"}
                        </span>
                        <span className="text-slate-400">{enrollment.completedLessons?.length || 0} Lessons done</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`${enrollment.progress === 100 ? "bg-emerald-500" : "bg-indigo-600"} h-full transition-all duration-500`} 
                          style={{ width: `${enrollment.progress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-end space-x-3 pt-2">
                        {enrollment.progress === 100 && (
                          <button 
                            onClick={() => setShowCertificate(enrollment)}
                            className="inline-flex items-center px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-bold hover:bg-emerald-100 transition-all border border-emerald-100"
                          >
                            <Award className="w-4 h-4 mr-2" />
                            Certificate
                          </button>
                        )}
                        <Link 
                          to={`/learn/${enrollment.courseId}`}
                          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all"
                        >
                          <Play className="w-4 h-4 mr-2 fill-current" />
                          {enrollment.progress === 100 ? "Review" : "Continue"}
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">No courses yet</h3>
              <p className="text-slate-500 mb-6">You haven't enrolled in any courses. Explore our catalog to get started!</p>
              <Link to="/#courses" className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
                Browse Courses
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar: Stats & Progress */}
        <div className="space-y-8">
          <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-100">
            <h3 className="text-lg font-bold mb-6">Learning Stats</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="font-medium">Enrolled</span>
                </div>
                <span className="text-2xl font-bold">{enrollments.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <span className="font-medium">Completed</span>
                </div>
                <span className="text-2xl font-bold">{completedCourses.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="font-medium">Certificates</span>
                </div>
                <span className="text-2xl font-bold">{completedCourses.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">My Certificates</h3>
            <div className="space-y-4">
              {completedCourses.length > 0 ? completedCourses.map(e => (
                <div key={e.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Award className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs line-clamp-1">{e.course.title}</h4>
                      <p className="text-[10px] text-slate-500">Verified Certificate</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowCertificate(e)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Award className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Complete a course to earn your first certificate!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      <AnimatePresence>
        {showCertificate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden relative"
            >
              <button 
                onClick={() => setShowCertificate(null)}
                className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-all z-10"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>

              <div className="p-12 text-center border-8 border-indigo-50 m-4 rounded-2xl relative overflow-hidden">
                {/* Certificate Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                  <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                </div>

                <div className="relative z-10">
                  <div className="flex justify-center mb-8">
                    <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center shadow-xl shadow-indigo-200">
                      <Award className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  
                  <h2 className="text-indigo-600 font-bold tracking-widest uppercase text-sm mb-4">Certificate of Completion</h2>
                  <p className="text-slate-500 mb-8 italic">This is to certify that</p>
                  
                  <h1 className="text-4xl font-serif font-bold text-slate-900 mb-8 border-b-2 border-slate-100 pb-4 inline-block px-12">
                    {user?.displayName}
                  </h1>
                  
                  <p className="text-slate-500 mb-8">has successfully completed the online course</p>
                  
                  <h3 className="text-2xl font-bold text-indigo-600 mb-12">
                    {showCertificate.course.title}
                  </h3>
                  
                  <div className="flex justify-between items-end mt-12 px-12">
                    <div className="text-left">
                      <div className="w-32 border-b border-slate-300 mb-2"></div>
                      <p className="text-xs font-bold text-slate-900">Course Instructor</p>
                      <p className="text-[10px] text-slate-500">{showCertificate.course.instructor}</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center mb-2">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VERIFIED_${showCertificate.id}`} alt="QR Code" className="w-16 h-16 opacity-50" />
                      </div>
                      <p className="text-[10px] text-slate-400">Verify ID: {showCertificate.id.substring(0, 8)}</p>
                    </div>
                    
                    <div className="text-right">
                      <div className="w-32 border-b border-slate-300 mb-2"></div>
                      <p className="text-xs font-bold text-slate-900">Date of Issue</p>
                      <p className="text-[10px] text-slate-500">{new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 flex justify-center space-x-4">
                <button 
                  onClick={() => window.print()}
                  className="flex items-center space-x-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  <Download className="w-5 h-5" />
                  <span>Download PDF</span>
                </button>
                <button 
                  onClick={() => setShowCertificate(null)}
                  className="px-8 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all"
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
