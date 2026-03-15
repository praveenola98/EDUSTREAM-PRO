import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc, collection, getDocs, query, orderBy, setDoc, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../App";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, BookOpen, User, CheckCircle, Play, Lock, ShieldCheck, CreditCard, X, Shield, Star } from "lucide-react";

export default function CourseDetails() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return;
      
      try {
        const courseDoc = await getDoc(doc(db, "courses", courseId));
        if (courseDoc.exists()) {
          setCourse({ id: courseDoc.id, ...courseDoc.data() });
          
          // Fetch lessons
          const lessonsQuery = query(collection(db, `courses/${courseId}/lessons`), orderBy("order", "asc"));
          const lessonsSnapshot = await getDocs(lessonsQuery);
          setLessons(lessonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

          // Check enrollment
          if (user) {
            const enrollmentId = `${user.uid}_${courseId}`;
            const enrollmentDoc = await getDoc(doc(db, "enrollments", enrollmentId));
            setIsEnrolled(enrollmentDoc.exists());
          }
        }
      } catch (error) {
        console.error("Error fetching course data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, user]);

  const handlePurchase = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setShowPaymentModal(true);
  };

  const confirmPayment = async () => {

    if (!user) {
      navigate("/login");
      return;
    }

    const options = {

      key: "rzp_test_OgBupCvJ9Qynu3",

      amount: course.price * 100,

      currency: "INR",

      name: "EduStream Pro",

      description: course.title,

      handler: async function (response) {

        const enrollmentId = `${user.uid}_${courseId}`;

        await setDoc(doc(db, "enrollments", enrollmentId), {

          userId: user.uid,
          courseId: courseId,
          enrolledAt: new Date().toISOString(),
          progress: 0,
          completedLessons: []

        });

        await addDoc(collection(db, "payments"), {

          userId: user.uid,
          courseId: courseId,
          amount: course.price,
          status: "completed",
          transactionId: response.razorpay_payment_id,
          createdAt: new Date().toISOString()

        });

        setIsEnrolled(true);
        setShowPaymentModal(false);

        navigate(`/learn/${courseId}`);

      },

      theme: {
        color: "#6366F1"
      }

    };

    const rzp = new window.Razorpay(options);
    rzp.open();

  };



  

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Course not found</h1>
        <button onClick={() => navigate("/")} className="text-indigo-600 font-semibold">Go back home</button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Course Header */}
      <div className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-8">
              <nav className="flex mb-4 text-sm text-slate-400">
                <Link to="/" className="hover:text-white">Home</Link>
                <span className="mx-2">/</span>
                <span className="text-white">Courses</span>
              </nav>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-6">
                {course.title}
              </h1>
              <p className="text-xl text-slate-300 mb-8 max-w-3xl">
                {course.description}
              </p>
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-indigo-400" />
                  <span>Created by <span className="font-bold text-indigo-400">{course.instructor || "Expert Instructor"}</span></span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-indigo-400" />
                  <span>{course.duration || "10+ hours"} of content</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  <span>{lessons.length} Lessons</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 pb-24">
        <div className="lg:grid lg:grid-cols-12 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-8 pt-32">
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">What you'll learn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600">Comprehensive understanding of core concepts and practical applications.</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Course Content</h2>
              <div className="space-y-4">
                {lessons.length > 0 ? lessons.map((lesson, index) => (
                  <div key={lesson.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-500 text-sm">
                          {index + 1}
                        </span>
                        <h3 className="font-bold text-slate-900">{lesson.title}</h3>
                      </div>
                      <Play className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                )) : (
                  <p className="text-slate-500 italic">Curriculum details coming soon.</p>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar Card */}
          <div className="lg:col-span-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden sticky top-24"
            >
              <div className="aspect-video relative">
                <img 
                  src={course.thumbnail || `https://picsum.photos/seed/${course.id}/800/450`} 
                  alt={course.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-slate-900/20 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <Play className="w-8 h-8 text-indigo-600 fill-current ml-1" />
                  </div>
                </div>
              </div>
              <div className="p-8">
                <div className="flex items-baseline space-x-2 mb-6">
                  <span className="text-4xl font-extrabold text-slate-900">₹ {course.price}</span>
                  {course.price > 0 && <span className="text-slate-400 line-through text-lg">₹ {Math.round(course.price * 1.5)}</span>}
                </div>

                {isEnrolled ? (
                  <button 
                    onClick={() => navigate(`/learn/${courseId}`)}
                    className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center space-x-2"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>Continue Learning</span>
                  </button>
                ) : (
                  <button 
                    onClick={handlePurchase}
                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center space-x-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Enroll Now</span>
                  </button>
                )}

                <div className="mt-8 space-y-4">
                  <div className="flex items-center space-x-3 text-sm text-slate-600">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <span>Full lifetime access</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-slate-600">
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                    <span>Certificate of completion</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-slate-600">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span>Secure payment processing</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Checkout</h3>
                <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <div>
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Course</p>
                    <p className="font-bold text-slate-900 truncate max-w-[200px]">{course.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Total</p>
                    <p className="text-2xl font-black text-slate-900">₹ {course.price}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  
                  <div className="space-y-3">
                    
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700 text-sm">
                  <Shield className="w-5 h-5 flex-shrink-0" />
                  <p>Secure SSL encrypted payment. Your data is protected.</p>
                </div>

                {paymentError && (
                  <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-red-700 text-sm font-bold">
                    {paymentError}
                  </div>
                )}

                <button 
                  onClick={confirmPayment}
                  disabled={purchasing}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2"
                >
                  {purchasing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      <span>Pay & Enroll Now</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
