import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate, useLocation, useParams } from "react-router-dom";
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, orderBy, where, getDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { motion } from "framer-motion";
import {
  LayoutDashboard, BookOpen, Users, CreditCard, Plus, Edit, Trash2,
  ChevronRight, Search, Filter, MoreVertical, Save, X, Layers, PlayCircle, FileText, Video, GripVertical, Clock, User, Menu
} from "lucide-react";

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex relative">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Admin Panel</h2>
            <p className="text-xs text-slate-500 mt-1">Manage your platform</p>
          </div>
          <button
            className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-slate-600"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-grow p-4 space-y-2">
          <AdminNavLink to="/admin" icon={<LayoutDashboard className="w-5 h-5" />} label="Overview" end onNavigate={() => setSidebarOpen(false)} />
          <AdminNavLink to="/admin/courses" icon={<BookOpen className="w-5 h-5" />} label="Courses" onNavigate={() => setSidebarOpen(false)} />
          <AdminNavLink to="/admin/users" icon={<Users className="w-5 h-5" />} label="Users" onNavigate={() => setSidebarOpen(false)} />
          <AdminNavLink to="/admin/payments" icon={<CreditCard className="w-5 h-5" />} label="Payments" onNavigate={() => setSidebarOpen(false)} />
        </nav>
      </div>

      {/* Admin Content */}
      <div className="flex-grow overflow-y-auto w-full">
        {/* Mobile Top Bar */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="text-base font-bold text-slate-900">Admin Panel</h2>
          <div className="w-9" /> {/* spacer */}
        </div>

        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <Routes>
            <Route index element={<AdminOverview />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="courses/new" element={<CourseForm />} />
            <Route path="courses/edit/:id" element={<CourseForm />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="payments" element={<AdminPayments />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function AdminNavLink({ to, icon, label, end = false, onNavigate }) {
  const location = useLocation();
  const isActive = end ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-600 hover:bg-slate-100"
        }`}
    >
      {icon}
      <span className="font-semibold text-sm">{label}</span>
      {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
    </Link>
  );
}

function AdminOverview() {
  const [stats, setStats] = useState({ courses: 0, users: 0, revenue: 0, enrollments: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const coursesSnap = await getDocs(collection(db, "courses"));
        const usersSnap = await getDocs(collection(db, "users"));
        const paymentsSnap = await getDocs(collection(db, "payments"));
        const enrollmentsSnap = await getDocs(collection(db, "enrollments"));

        const revenue = paymentsSnap.docs.reduce((acc, doc) => acc + (doc.data().amount || 0), 0);

        setStats({
          courses: coursesSnap.size,
          users: usersSnap.size,
          revenue,
          enrollments: enrollmentsSnap.size
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Dashboard Overview</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard label="Total Courses" value={stats.courses} icon={<BookOpen className="text-indigo-600" />} color="bg-indigo-100" />
        <StatCard label="Total Users" value={stats.users} icon={<Users className="text-emerald-600" />} color="bg-emerald-100" />
        <StatCard label="Total Revenue" value={`₹${stats.revenue}`} icon={<CreditCard className="text-amber-600" />} color="bg-amber-100" />
        <StatCard label="Enrollments" value={stats.enrollments} icon={<Layers className="text-rose-600" />} color="bg-rose-100" />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-8 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-6">Recent Activity</h2>
        <div className="text-center py-12 text-slate-400 italic">
          Activity log will appear here as users interact with the platform.
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 ${color} rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4`}>
        {icon}
      </div>
      <div className="text-xl sm:text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs sm:text-sm text-slate-500 font-medium">{label}</div>
    </div>
  );
}

function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseForStudents, setSelectedCourseForStudents] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCoursesData = async () => {
      try {
        const coursesSnap = await getDocs(collection(db, "courses"));
        const coursesList = coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const enrollmentsSnap = await getDocs(collection(db, "enrollments"));
        const allEnrollments = enrollmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const usersSnap = await getDocs(collection(db, "users"));
        const usersMap = {};
        usersSnap.docs.forEach(doc => {
          usersMap[doc.id] = doc.data();
        });

        const enrichedCourses = coursesList.map(course => {
          const courseEnrollments = allEnrollments.filter(e => e.courseId === course.id);
          const enrolledStudents = courseEnrollments.map(e => ({
            uid: e.userId,
            displayName: usersMap[e.userId]?.displayName || "Unknown User",
            email: usersMap[e.userId]?.email || "No Email",
            progress: e.progress || 0,
            enrolledAt: e.enrolledAt
          }));

          return {
            ...course,
            students: enrolledStudents
          };
        });

        setCourses(enrichedCourses);
      } catch (error) {
        console.error("Error fetching courses data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCoursesData();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this course? This will not delete sub-collections like lessons automatically in some setups, but we will handle it.")) {
      await deleteDoc(doc(db, "courses", id));
      setCourses(courses.filter(c => c.id !== id));
    }
  };

  if (selectedCourseForStudents) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={() => setSelectedCourseForStudents(null)}
            className="flex items-center text-indigo-600 font-bold hover:underline text-sm sm:text-base"
          >
            <ChevronRight className="w-5 h-5 rotate-180 mr-1" />
            Back to Courses
          </button>
          <h2 className="text-base sm:text-xl font-bold text-slate-900 truncate max-w-[200px] sm:max-w-none">
            Students: {selectedCourseForStudents.title}
          </h2>
        </div>

        {/* Mobile: Cards, Desktop: Table */}
        <div className="sm:hidden space-y-3">
          {selectedCourseForStudents.students.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">No students enrolled.</div>
          ) : (
            selectedCourseForStudents.students.map((student, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
                <div className="font-bold text-slate-900">{student.displayName}</div>
                <div className="text-sm text-slate-500">{student.email}</div>
                <div className="flex items-center space-x-3">
                  <div className="flex-grow bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${student.progress}%` }} />
                  </div>
                  <span className="text-sm font-bold text-emerald-600">{student.progress}%</span>
                </div>
                <div className="text-xs text-slate-400">
                  Enrolled: {student.enrolledAt ? new Date(student.enrolledAt).toLocaleDateString() : "N/A"}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="hidden sm:block bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Enrolled On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedCourseForStudents.students.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-400">No students enrolled in this course.</td></tr>
                ) : (
                  selectedCourseForStudents.students.map((student, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{student.displayName}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{student.email}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-grow bg-slate-100 rounded-full h-2 overflow-hidden max-w-[100px]">
                            <div className="bg-emerald-500 h-full" style={{ width: `${student.progress}%` }} />
                          </div>
                          <span className="text-sm font-bold text-emerald-600">{student.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {student.enrolledAt ? new Date(student.enrolledAt).toLocaleDateString() : "N/A"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Manage Courses</h1>
        <Link to="/admin/courses/new" className="bg-indigo-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center space-x-2 shadow-lg shadow-indigo-100 text-sm sm:text-base whitespace-nowrap">
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Add New Course</span>
          <span className="sm:hidden">Add</span>
        </Link>
      </div>

      {/* Mobile: Cards */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No courses found.</div>
        ) : (
          courses.map((course) => (
            <div key={course.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={course.thumbnail || `https://picsum.photos/seed/${course.id}/100/100`} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="font-bold text-slate-900 truncate">{course.title}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">{course.instructor}</div>
                  <div className="text-sm font-bold text-slate-600 mt-1">₹ {course.price}</div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setSelectedCourseForStudents(course)}
                  className="flex items-center space-x-1 text-sm text-indigo-600 font-bold"
                >
                  <Users className="w-4 h-4" />
                  <span>{course.students?.length || 0} Students</span>
                </button>
                <div className="flex items-center space-x-2">
                  <button onClick={() => navigate(`/admin/courses/edit/${course.id}`)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(course.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop: Table */}
      <div className="hidden sm:block bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Course</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Students</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-400">Loading courses...</td></tr>
              ) : courses.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-400">No courses found.</td></tr>
              ) : (
                courses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={course.thumbnail || `https://picsum.photos/seed/${course.id}/100/100`} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{course.title}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold">{course.instructor}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-bold">₹ {course.price}</td>
                    <td className="px-6 py-4 cursor-pointer group" onClick={() => setSelectedCourseForStudents(course)}>
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-2 group-hover:text-indigo-600 transition-colors">
                          <Users className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                          <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600">{course.students?.length || 0} Enrolled</span>
                        </div>
                        {course.students?.length > 0 && (
                          <div className="flex -space-x-2 overflow-hidden">
                            {course.students.slice(0, 5).map((student, i) => (
                              <div key={i} className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-indigo-100 flex items-center justify-center text-[8px] font-bold text-indigo-600" title={student.displayName}>
                                {student.displayName.charAt(0)}
                              </div>
                            ))}
                            {course.students.length > 5 && (
                              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500">
                                +{course.students.length - 5}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="text-[10px] text-indigo-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">View Details</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <button onClick={() => navigate(`/admin/courses/edit/${course.id}`)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit Course">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(course.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Course">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CourseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState({
    title: "",
    description: "",
    price: 0,
    instructor: "",
    duration: "",
    thumbnail: "",
    category: ""
  });
  const [lessons, setLessons] = useState([]);

  useEffect(() => {
    if (id) {
      const fetchCourse = async () => {
        const docSnap = await getDoc(doc(db, "courses", id));
        if (docSnap.exists()) {
          setCourse(docSnap.data());
          const lessonsSnap = await getDocs(query(collection(db, `courses/${id}/lessons`), orderBy("order", "asc")));
          setLessons(lessonsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      };
      fetchCourse();
    }
  }, [id]);

  const addLesson = () => {
    setLessons([...lessons, { title: "", content: "", type: "video", order: lessons.length + 1, id: Date.now().toString() }]);
  };

  const removeLesson = (index) => {
    setLessons(lessons.filter((_, i) => i !== index));
  };

  const updateLesson = (index, field, value) => {
    const newLessons = [...lessons];
    newLessons[index][field] = value;
    setLessons(newLessons);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let courseId = id;
      if (id) {
        await updateDoc(doc(db, "courses", id), course);
      } else {
        const docRef = await addDoc(collection(db, "courses"), {
          ...course,
          createdAt: new Date().toISOString()
        });
        courseId = docRef.id;
      }

      const batch = writeBatch(db);

      if (id) {
        const existingLessons = await getDocs(collection(db, `courses/${id}/lessons`));
        existingLessons.forEach(doc => batch.delete(doc.ref));
      }

      lessons.forEach((lesson, index) => {
        const lessonRef = doc(collection(db, `courses/${courseId}/lessons`));
        batch.set(lessonRef, {
          title: lesson.title,
          content: lesson.content,
          type: lesson.type,
          order: index + 1
        });
      });

      await batch.commit();
      navigate("/admin/courses");
    } catch (error) {
      console.error("Error saving course:", error);
      alert("Error saving course. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{id ? "Edit Course" : "Create New Course"}</h1>
        <button onClick={() => navigate("/admin/courses")} className="text-slate-500 hover:text-slate-700 font-medium text-sm">Cancel</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 sm:p-8 shadow-sm space-y-5 sm:space-y-6">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-indigo-600" />
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Course Title</label>
              <input
                type="text"
                required
                value={course.title}
                onChange={e => setCourse({ ...course, title: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm sm:text-base"
                placeholder="e.g. Full Stack Web Development"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
              <textarea
                rows={4}
                required
                value={course.description}
                onChange={e => setCourse({ ...course, description: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm sm:text-base"
                placeholder="Tell students what they will learn..."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Price (₹)</label>
              <input
                type="number"
                required
                value={course.price}
                onChange={e => setCourse({ ...course, price: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Instructor Name</label>
              <input
                type="text"
                required
                value={course.instructor}
                onChange={e => setCourse({ ...course, instructor: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Duration</label>
              <input
                type="text"
                value={course.duration}
                onChange={e => setCourse({ ...course, duration: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm sm:text-base"
                placeholder="e.g. 12 Hours"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Thumbnail URL</label>
              <input
                type="text"
                value={course.thumbnail}
                onChange={e => setCourse({ ...course, thumbnail: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm sm:text-base"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        {/* Lessons Section */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 sm:p-8 shadow-sm space-y-5 sm:space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center">
              <Video className="w-5 h-5 mr-2 text-indigo-600" />
              Course Content
            </h2>
            <button
              type="button"
              onClick={addLesson}
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-all text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Lesson</span>
            </button>
          </div>

          <div className="space-y-4">
            {lessons.length === 0 ? (
              <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl text-sm">
                No lessons added yet. Click "Add Lesson" to start building your course content.
              </div>
            ) : (
              lessons.map((lesson, index) => (
                <div key={lesson.id || index} className="p-4 sm:p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 relative group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center font-bold text-slate-400 text-sm">
                        {index + 1}
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Lesson Details</h3>
                    </div>
                    <button type="button" onClick={() => removeLesson(index)} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lesson Title</label>
                      <input
                        type="text"
                        required
                        value={lesson.title}
                        onChange={e => updateLesson(index, "title", e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        placeholder="e.g. Introduction to React"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Video URL / Content</label>
                      <input
                        type="text"
                        required
                        value={lesson.content}
                        onChange={e => updateLesson(index, "content", e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        placeholder="YouTube, Vimeo, or Google Drive URL..."
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 sm:py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2 text-sm sm:text-base"
        >
          <Save className="w-5 h-5" />
          <span>{loading ? "Saving Course & Content..." : "Save Course & Content"}</span>
        </button>
      </form>
    </div>
  );
}

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsersData = async () => {
      try {
        setLoading(true);
        setError(null);
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const enrollmentsSnapshot = await getDocs(collection(db, "enrollments"));
        const allEnrollments = enrollmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const paymentsSnapshot = await getDocs(collection(db, "payments"));
        const allPayments = paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const coursesSnapshot = await getDocs(collection(db, "courses"));
        const coursesMap = {};
        coursesSnapshot.docs.forEach(doc => {
          coursesMap[doc.id] = doc.data().title;
        });

        const enrichedUsers = usersList.map(user => {
          const userEnrollments = allEnrollments
            .filter(e => e.userId === user.id)
            .map(e => ({ ...e, courseTitle: coursesMap[e.courseId] || "Unknown Course" }));

          const userPayments = allPayments.filter(p => p.userId === user.id);
          const totalPaid = userPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

          return {
            ...user,
            enrollments: userEnrollments,
            payments: userPayments.map(p => ({ ...p, courseTitle: coursesMap[p.courseId] || "Unknown Course" })),
            totalPaid
          };
        });

        setUsers(enrichedUsers);
      } catch (error) {
        console.error("Error fetching users data:", error);
        setError("Failed to load users. Please check your permissions.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsersData();
  }, []);

  const toggleBlock = async (user, e) => {
    e.stopPropagation();
    await updateDoc(doc(db, "users", user.id), { isBlocked: !user.isBlocked });
    setUsers(users.map(u => u.id === user.id ? { ...u, isBlocked: !u.isBlocked } : u));
    if (selectedUser?.id === user.id) {
      setSelectedUser({ ...selectedUser, isBlocked: !user.isBlocked });
    }
  };

  if (selectedUser) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button onClick={() => setSelectedUser(null)} className="flex items-center text-indigo-600 font-bold hover:underline text-sm sm:text-base">
            <ChevronRight className="w-5 h-5 rotate-180 mr-1" />
            Back to Users
          </button>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedUser.isBlocked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {selectedUser.isBlocked ? 'Blocked' : 'Active'}
            </span>
            <button
              onClick={(e) => toggleBlock(selectedUser, e)}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border ${selectedUser.isBlocked ? 'border-emerald-600 text-emerald-600 hover:bg-emerald-50' : 'border-red-600 text-red-600 hover:bg-red-50'} transition-all`}
            >
              {selectedUser.isBlocked ? 'Unblock' : 'Block'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 sm:p-8 shadow-sm">
          <div className="flex items-center space-x-4 mb-6 sm:mb-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
              <User className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{selectedUser.displayName}</h2>
              <p className="text-sm text-slate-500">{selectedUser.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-12">
            <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-100">
              <div className="text-slate-500 text-xs font-bold uppercase mb-1">Total Spent</div>
              <div className="text-lg sm:text-2xl font-bold text-slate-900">₹ {selectedUser.totalPaid.toFixed(2)}</div>
            </div>
            <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-100">
              <div className="text-slate-500 text-xs font-bold uppercase mb-1">Enrolled</div>
              <div className="text-lg sm:text-2xl font-bold text-slate-900">{selectedUser.enrollments.length}</div>
            </div>
            <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-100">
              <div className="text-slate-500 text-xs font-bold uppercase mb-1">Completed</div>
              <div className="text-lg sm:text-2xl font-bold text-emerald-600">{selectedUser.enrollments.filter(e => e.progress === 100).length}</div>
            </div>
            <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-100">
              <div className="text-slate-500 text-xs font-bold uppercase mb-1">Certificates</div>
              <div className="text-lg sm:text-2xl font-bold text-indigo-600">{selectedUser.enrollments.filter(e => e.progress === 100).length}</div>
            </div>
          </div>

          <div className="space-y-6 sm:space-y-8">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-indigo-600" />
                Course Progress
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {selectedUser.enrollments.length > 0 ? selectedUser.enrollments.map((enrollment, idx) => (
                  <div key={idx} className="p-4 bg-white border border-slate-200 rounded-2xl">
                    <div className="font-bold text-slate-900 mb-2 text-sm sm:text-base">{enrollment.courseTitle}</div>
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="flex-grow bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: `${enrollment.progress}%` }} />
                      </div>
                      <span className="text-sm font-bold text-emerald-600 flex-shrink-0">{enrollment.progress}%</span>
                    </div>
                    <div className="text-right text-xs text-slate-400 mt-1">
                      Enrolled on {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-sm">
                    No active enrollments found.
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-indigo-600" />
                Payment History
              </h3>

              {/* Mobile: Cards */}
              <div className="sm:hidden space-y-3">
                {selectedUser.payments.length > 0 ? selectedUser.payments.map((payment, idx) => (
                  <div key={idx} className="p-4 bg-white border border-slate-200 rounded-2xl">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-slate-900 text-sm">{payment.courseTitle}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{new Date(payment.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 text-sm">₹ {payment.amount}</div>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold uppercase mt-1 inline-block">
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-slate-400 italic text-sm">No payment records found.</div>
                )}
              </div>

              {/* Desktop: Table */}
              <div className="hidden sm:block bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Course</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedUser.payments.length > 0 ? selectedUser.payments.map((payment, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{payment.courseTitle}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">₹ {payment.amount}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{new Date(payment.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold uppercase">
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">No payment records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900">User Management</h1>

      {/* Mobile: Cards */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading users...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 font-bold">{error}</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No users found.</div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm cursor-pointer active:bg-slate-50"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-slate-900">{user.displayName}</div>
                  <div className="text-xs text-slate-400 uppercase font-bold">{user.role}</div>
                  <div className="text-sm text-slate-500 mt-0.5">{user.email}</div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${user.isBlocked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {user.isBlocked ? 'Blocked' : 'Active'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center space-x-1">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-700">{user.enrollments.length} Courses</span>
                </div>
                <button
                  onClick={(e) => toggleBlock(user, e)}
                  className={`text-xs font-bold ${user.isBlocked ? 'text-emerald-600' : 'text-red-600'}`}
                >
                  {user.isBlocked ? 'Unblock' : 'Block'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop: Table */}
      <div className="hidden sm:block bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Courses</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Loading users...</td></tr>
              ) : error ? (
                <tr><td colSpan={5} className="p-8 text-center text-red-500 font-bold">{error}</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">No users found.</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} onClick={() => setSelectedUser(user)} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{user.displayName}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{user.role}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        <BookOpen className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-bold text-slate-700">{user.enrollments.length}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.isBlocked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {user.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        <button onClick={(e) => toggleBlock(user, e)} className={`text-xs font-bold ${user.isBlocked ? 'text-emerald-600' : 'text-red-600'} hover:underline`}>
                          {user.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      const q = query(collection(db, "payments"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const paymentsData = await Promise.all(querySnapshot.docs.map(async (paymentDoc) => {
        const data = paymentDoc.data();
        let userEmail = "Unknown Email";
        let userName = "Unknown User";

        if (data.userId) {
          const userSnap = await getDoc(doc(db, "users", data.userId));
          if (userSnap.exists()) {
            userEmail = userSnap.data().email;
            userName = userSnap.data().displayName;
          }
        }

        let courseTitle = "Unknown Course";
        if (data.courseId) {
          const courseSnap = await getDoc(doc(db, "courses", data.courseId));
          if (courseSnap.exists()) courseTitle = courseSnap.data().title;
        }

        return { id: paymentDoc.id, ...data, userEmail, userName, courseTitle };
      }));

      setPayments(paymentsData);
      setLoading(false);
    };
    fetchPayments();
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Payment History</h1>

      {/* Mobile: Cards */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading payments...</div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No payments found.</div>
        ) : (
          payments.map((payment) => (
            <div key={payment.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{payment.userName}</div>
                  <div className="text-xs text-slate-500">{payment.userEmail}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">₹ {payment.amount}</div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold inline-block mt-1">
                    {payment.status}
                  </span>
                </div>
              </div>
              <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="font-medium text-slate-700 truncate max-w-[180px]">{payment.courseTitle}</span>
                <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop: Table */}
      <div className="hidden sm:block bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Course</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading payments...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">No payments found.</td></tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{payment.userName}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{payment.userEmail}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{payment.courseTitle}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">₹ {payment.amount}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">{payment.status}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">{new Date(payment.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}