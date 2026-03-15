import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, getDocs, query, orderBy, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../App";
import { motion, AnimatePresence } from "framer-motion";
import { Play, CheckCircle, ChevronLeft, ChevronRight, Menu, X, BookOpen, Download, Award, Video } from "lucide-react";
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId || !user) return;

      try {
        // Fetch course
        const courseDoc = await getDoc(doc(db, "courses", courseId));
        if (!courseDoc.exists()) {
          navigate("/dashboard");
          return;
        }
        setCourse({ id: courseDoc.id, ...courseDoc.data() });

        // Fetch enrollment
        const enrollmentId = `${user.uid}_${courseId}`;
        const enrollmentDoc = await getDoc(doc(db, "enrollments", enrollmentId));
        if (!enrollmentDoc.exists()) {
          navigate(`/courses/${courseId}`);
          return;
        }
        setEnrollment({ id: enrollmentDoc.id, ...enrollmentDoc.data() });

        // Fetch lessons
        const lessonsQuery = query(collection(db, `courses/${courseId}/lessons`), orderBy("order", "asc"));
        const lessonsSnapshot = await getDocs(lessonsQuery);
        const lessonsData = lessonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLessons(lessonsData);

        if (lessonsData.length > 0) {
          setCurrentLesson(lessonsData[0]);
        }
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

      await updateDoc(enrollmentRef, {
        completedLessons: arrayUnion(lessonId),
        progress: progress
      });

      setEnrollment({ ...enrollment, completedLessons: newCompletedLessons, progress });

      if (progress === 100) {
        handleCourseCompletion();
      }
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  const handleCourseCompletion = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const generateCertificate = () => {
    const docCert = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    // Design the certificate
    docCert.setFillColor(248, 250, 252); // slate-50
    docCert.rect(0, 0, 297, 210, "F");
    
    docCert.setDrawColor(79, 70, 229); // indigo-600
    docCert.setLineWidth(5);
    docCert.rect(10, 10, 277, 190);

    docCert.setFont("helvetica", "bold");
    docCert.setFontSize(40);
    docCert.setTextColor(15, 23, 42); // slate-900
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!course || !enrollment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <BookOpen className="w-16 h-16 text-slate-200 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied or Course Not Found</h2>
        <p className="text-slate-500 mb-6 text-center max-w-md">
          We couldn't load the course content. Please make sure you are enrolled and have a stable internet connection.
        </p>
        <button 
          onClick={() => navigate("/dashboard")}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            className="w-80 border-r border-slate-200 bg-slate-50 flex flex-col flex-shrink-0 z-20"
          >
            <div className="p-6 border-b border-slate-200 bg-white">
              <h2 className="font-bold text-slate-900 line-clamp-1">{course.title}</h2>
              <div className="mt-4">
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                  <span>{enrollment.progress}% Complete</span>
                  <span>{enrollment.completedLessons?.length || 0}/{lessons.length} Lessons</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${enrollment.progress}%` }}></div>
                </div>
              </div>
              {enrollment.progress === 100 && (
                <button 
                  onClick={generateCertificate}
                  className="w-full mt-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all flex items-center justify-center space-x-2"
                >
                  <Award className="w-4 h-4" />
                  <span>Download Certificate</span>
                </button>
              )}
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">
                Course Content
              </h3>
              {lessons.map((lesson, index) => (
                <button
                  key={lesson.id}
                  onClick={() => setCurrentLesson(lesson)}
                  className={`w-full text-left p-3 rounded-xl flex items-start space-x-3 transition-all ${
                    currentLesson?.id === lesson.id 
                      ? "bg-indigo-50 border border-indigo-100 text-indigo-700" 
                      : "hover:bg-slate-100 text-slate-600"
                  }`}
                >
                  <div className="mt-0.5">
                    {enrollment.completedLessons?.includes(lesson.id) ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Play className={`w-4 h-4 ${currentLesson?.id === lesson.id ? "text-indigo-600" : "text-slate-400"}`} />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold leading-tight">{lesson.title}</span>
                    <span className="text-[10px] text-slate-400 mt-1">Lesson {index + 1}</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-grow flex flex-col relative overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center space-x-4">
            <button 
              disabled={!currentLesson || lessons.indexOf(currentLesson) === 0}
              onClick={() => setCurrentLesson(lessons[lessons.indexOf(currentLesson) - 1])}
              className="flex items-center space-x-1 text-slate-500 hover:text-indigo-600 text-sm font-medium disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev</span>
            </button>
            <button 
              disabled={!currentLesson || lessons.indexOf(currentLesson) === lessons.length - 1}
              onClick={() => setCurrentLesson(lessons[lessons.indexOf(currentLesson) + 1])}
              className="flex items-center space-x-1 text-slate-500 hover:text-indigo-600 text-sm font-medium disabled:opacity-30"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-8 bg-slate-50">
          <div className="max-w-4xl mx-auto">
            {currentLesson ? (
              <div className="space-y-8">
                <div className="aspect-video bg-slate-900 rounded-3xl shadow-2xl overflow-hidden relative group">
                  {currentLesson.content && (currentLesson.content.includes("youtube.com") || currentLesson.content.includes("youtu.be")) ? (
                    <iframe 
                      src={currentLesson.content.replace("watch?v=", "embed/").split("&")[0]}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : currentLesson.content && currentLesson.content.includes("drive.google.com") ? (
                    <iframe 
                      src={currentLesson.content.replace("/view", "/preview").replace("?usp=sharing", "")}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <div className="text-center">
                        <Video className="w-20 h-20 mx-auto mb-4 opacity-20" />
                        <p className="text-slate-400">Video Content</p>
                        <p className="text-xs text-slate-600 mt-2">{currentLesson.content}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">{currentLesson.title}</h1>
                    <p className="text-slate-500 mt-1">Lesson {lessons.indexOf(currentLesson) + 1} of {lessons.length}</p>
                  </div>
                  {!enrollment.completedLessons?.includes(currentLesson.id) && (
                    <button 
                      onClick={() => markLessonComplete(currentLesson.id)}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center space-x-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Mark as Complete</span>
                    </button>
                  )}
                </div>

                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900 mb-4">Lesson Overview</h2>
                  <p className="text-slate-600 leading-relaxed">
                    Welcome to this lesson on <span className="font-bold text-indigo-600">{currentLesson.title}</span>. 
                    In this session, we cover the essential topics to help you master this part of the course.
                  </p>
                  <div className="mt-8 pt-8 border-t border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-4">Resources</h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer">
                        <Download className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-medium text-slate-700">Lesson_Notes.pdf</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-900">Select a lesson to start learning</h2>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
