import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, getDocs, query, orderBy, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../App";
import { motion, AnimatePresence } from "framer-motion";
import { Play, CheckCircle, ChevronLeft, ChevronRight, Menu, X, BookOpen, Download, Award, Video, Lock } from "lucide-react";
import confetti from "canvas-confetti";
import { jsPDF } from "jspdf";

export default function CoursePlayer() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false); // default closed on mobile

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId || !user) return;
      try {
        const courseDoc = await getDoc(doc(db, "courses", courseId));
        if (!courseDoc.exists()) { navigate("/dashboard"); return; }
        setCourse({ id: courseDoc.id, ...courseDoc.data() });

        const enrollmentId = `${user.uid}_${courseId}`;
        const enrollmentDoc = await getDoc(doc(db, "enrollments", enrollmentId));
        if (!enrollmentDoc.exists()) { navigate(`/courses/${courseId}`); return; }
        setEnrollment({ id: enrollmentDoc.id, ...enrollmentDoc.data() });

        const lessonsQuery = query(collection(db, `courses/${courseId}/lessons`), orderBy("order", "asc"));
        const lessonsSnapshot = await getDocs(lessonsQuery);
        const lessonsData = lessonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLessons(lessonsData);
        if (lessonsData.length > 0) setCurrentLesson(lessonsData[0]);
      } catch (error) {
        console.error("Error fetching course data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId, user, navigate]);

  const markLessonComplete = async (lessonId) => {
    if (!enrollment || enrollment.completedLessons?.includes(lessonId)) return;
    try {
      const enrollmentRef = doc(db, "enrollments", enrollment.id);
      const newCompletedLessons = [...(enrollment.completedLessons || []), lessonId];
      const progress = Math.round((newCompletedLessons.length / lessons.length) * 100);
      await updateDoc(enrollmentRef, { completedLessons: arrayUnion(lessonId), progress });
      setEnrollment({ ...enrollment, completedLessons: newCompletedLessons, progress });
      if (progress === 100) handleCourseCompletion();
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  const handleCourseCompletion = () => {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
  };

  const generateCertificate = () => {
    const docCert = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    docCert.setFillColor(248, 250, 252);
    docCert.rect(0, 0, 297, 210, "F");
    docCert.setDrawColor(79, 70, 229);
    docCert.setLineWidth(5);
    docCert.rect(10, 10, 277, 190);
    docCert.setFont("helvetica", "bold");
    docCert.setFontSize(40);
    docCert.setTextColor(15, 23, 42);
    docCert.text("CERTIFICATE", 148.5, 60, { align: "center" });
    docCert.setFontSize(20);
    docCert.setFont("helvetica", "normal");
    docCert.text("OF COMPLETION", 148.5, 75, { align: "center" });
    docCert.setFontSize(16);
    docCert.text("This is to certify that", 148.5, 100, { align: "center" });
    docCert.setFontSize(30);
    docCert.setFont("helvetica", "bold");
    docCert.setTextColor(79, 70, 229);
    docCert.text(user?.displayName || "Student Name", 148.5, 120, { align: "center" });
    docCert.setFontSize(16);
    docCert.setFont("helvetica", "normal");
    docCert.setTextColor(15, 23, 42);
    docCert.text("has successfully completed the course", 148.5, 140, { align: "center" });
    docCert.setFontSize(24);
    docCert.setFont("helvetica", "bold");
    docCert.text(course.title, 148.5, 155, { align: "center" });
    docCert.setFontSize(12);
    docCert.setFont("helvetica", "normal");
    docCert.text(`Issued on ${new Date().toLocaleDateString()}`, 148.5, 180, { align: "center" });
    docCert.save(`${course.title}_Certificate.pdf`);
  };

  const goToLesson = (lesson) => {
    setCurrentLesson(lesson);
    setSidebarOpen(false); // auto-close sidebar on mobile after selecting
  };

  const currentIndex = currentLesson ? lessons.indexOf(currentLesson) : -1;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600" />
          <p className="text-sm text-slate-500 font-medium">Loading your course...</p>
        </div>
      </div>
    );
  }

  if (!course || !enrollment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            We couldn't load the course content. Please make sure you are enrolled and have a stable internet connection.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white relative">

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed lg:static inset-y-0 left-0 w-[85vw] sm:w-80 border-r border-slate-200 bg-white flex flex-col flex-shrink-0 z-30 shadow-2xl lg:shadow-none h-full"
          >
            {/* Sidebar Header */}
            <div className="p-4 sm:p-6 border-b border-slate-100 bg-white">
              <div className="flex items-start justify-between gap-2 mb-4">
                <h2 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">{course.title}</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
                  <span>{enrollment.progress || 0}% Complete</span>
                  <span>{enrollment.completedLessons?.length || 0}/{lessons.length}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="bg-indigo-600 h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${enrollment.progress || 0}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>

              {enrollment.progress === 100 && (
                <button
                  onClick={generateCertificate}
                  className="w-full mt-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-emerald-100"
                >
                  <Award className="w-4 h-4" />
                  <span>Download Certificate</span>
                </button>
              )}
            </div>

            {/* Lesson List */}
            <div className="flex-grow overflow-y-auto p-3 sm:p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">
                Course Content
              </p>
              <div className="space-y-1">
                {lessons.map((lesson, index) => {
                  const isActive = currentLesson?.id === lesson.id;
                  const isCompleted = enrollment.completedLessons?.includes(lesson.id);
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => goToLesson(lesson)}
                      className={`w-full text-left p-3 rounded-xl flex items-start space-x-3 transition-all ${
                        isActive
                          ? "bg-indigo-50 border border-indigo-100 text-indigo-700"
                          : "hover:bg-slate-50 text-slate-600 border border-transparent"
                      }`}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isActive ? "border-indigo-500" : "border-slate-300"}`}>
                            {isActive && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold leading-snug truncate">{lesson.title}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Lesson {index + 1}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-grow flex flex-col overflow-hidden min-w-0">

        {/* Top Bar */}
        <div className="flex-shrink-0 px-3 sm:px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-white gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 flex-shrink-0"
            title="Toggle Sidebar"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Lesson title - center */}
          <div className="flex-grow min-w-0 text-center">
            <p className="text-xs sm:text-sm font-semibold text-slate-700 truncate">
              {currentLesson?.title || "Select a lesson"}
            </p>
            {currentLesson && (
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Lesson {currentIndex + 1} of {lessons.length}
              </p>
            )}
          </div>

          {/* Prev / Next */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            <button
              disabled={currentIndex <= 0}
              onClick={() => goToLesson(lessons[currentIndex - 1])}
              className="flex items-center space-x-0.5 sm:space-x-1 px-2 sm:px-3 py-1.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 text-xs sm:text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev</span>
            </button>
            <button
              disabled={currentIndex >= lessons.length - 1}
              onClick={() => goToLesson(lessons[currentIndex + 1])}
              className="flex items-center space-x-0.5 sm:space-x-1 px-2 sm:px-3 py-1.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 text-xs sm:text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto bg-slate-50">
          <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            {currentLesson ? (
              <div className="space-y-4 sm:space-y-6">

                {/* Video Player */}
                <div className="aspect-video bg-slate-900 rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden">
                  {currentLesson.content?.includes("youtube.com") || currentLesson.content?.includes("youtu.be") ? (
                    <iframe
                      src={currentLesson.content.replace("watch?v=", "embed/").split("&")[0]}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : currentLesson.content?.includes("drive.google.com") ? (
                    <iframe
                      src={currentLesson.content.replace("/view", "/preview").replace("?usp=sharing", "")}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <div className="text-center px-4">
                        <Video className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 opacity-20" />
                        <p className="text-slate-400 text-sm">Video Content</p>
                        <p className="text-xs text-slate-600 mt-1 break-all">{currentLesson.content}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Lesson Info + Mark Complete */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-lg sm:text-2xl font-bold text-slate-900">{currentLesson.title}</h1>
                    <p className="text-slate-500 mt-0.5 text-sm">
                      Lesson {currentIndex + 1} of {lessons.length}
                    </p>
                  </div>

                  {enrollment.completedLessons?.includes(currentLesson.id) ? (
                    <div className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-bold text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span>Completed</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => markLessonComplete(currentLesson.id)}
                      className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 text-sm sm:text-base w-full sm:w-auto"
                    >
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Mark as Complete</span>
                    </button>
                  )}
                </div>

                {/* Mobile Progress Bar */}
                <div className="sm:hidden bg-white rounded-2xl border border-slate-200 p-4">
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                    <span>{enrollment.progress || 0}% Complete</span>
                    <span>{enrollment.completedLessons?.length || 0}/{lessons.length} Lessons</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${enrollment.progress || 0}%` }}
                    />
                  </div>
                  {enrollment.progress === 100 && (
                    <button
                      onClick={generateCertificate}
                      className="w-full mt-3 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center justify-center space-x-2"
                    >
                      <Award className="w-4 h-4" />
                      <span>Download Certificate</span>
                    </button>
                  )}
                </div>

                {/* Lesson Overview Card */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-sm">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3">Lesson Overview</h2>
                  <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                    Welcome to this lesson on{" "}
                    <span className="font-bold text-indigo-600">{currentLesson.title}</span>.
                    In this session, we cover the essential topics to help you master this part of the course.
                  </p>

                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-3 text-sm sm:text-base">Resources</h3>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer">
                        <Download className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-slate-700">Lesson_Notes.pdf</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prev / Next Buttons (bottom) */}
                <div className="flex items-center justify-between gap-3 pb-4">
                  <button
                    disabled={currentIndex <= 0}
                    onClick={() => goToLesson(lessons[currentIndex - 1])}
                    className="flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>
                  <button
                    disabled={currentIndex >= lessons.length - 1}
                    onClick={() => goToLesson(lessons[currentIndex + 1])}
                    className="flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <span>Next Lesson</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-4">
                  <BookOpen className="w-10 h-10 text-slate-300" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Select a lesson to begin</h2>
                <p className="text-sm text-slate-400 mb-6">Open the menu and choose a lesson from the sidebar.</p>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all text-sm"
                >
                  <Menu className="w-4 h-4" />
                  <span>View Lessons</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}