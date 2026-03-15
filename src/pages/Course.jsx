import React, { useEffect, useState } from "react";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Users, Award, Star, ArrowRight, Zap, Shield } from "lucide-react";

export default function LandingPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      const q = query(collection(db, "courses"), limit(6));
      const querySnapshot = await getDocs(q);
      const coursesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourses(coursesData);
      setLoading(false);
    };
    fetchCourses();
  }, []);

  return (
    <div className="overflow-hidden">

      {/* ─── Courses Section ─── */}
      <section id="courses" className="py-14 sm:py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section Header */}
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-xs sm:text-sm font-bold text-indigo-600 tracking-widest uppercase mb-2">
              Popular Courses
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900">
              Start Your Learning Journey
            </h2>
            <p className="mt-3 sm:mt-4 max-w-xl text-base sm:text-lg text-slate-500 mx-auto">
              Choose from our wide range of professional courses designed to help you succeed.
            </p>
          </div>

          {/* Course Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse bg-slate-100 rounded-2xl h-80 sm:h-96" />
              ))}
            </div>
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
              {courses.map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={course.thumbnail || `https://picsum.photos/seed/${course.id}/800/450`}
                      alt={course.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur px-2.5 py-1 rounded-lg text-xs sm:text-sm font-bold text-indigo-600 shadow-sm">
                      ₹ {course.price}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5 flex flex-col flex-grow">
                    {/* Stars */}
                    <div className="flex items-center gap-0.5 text-amber-400 mb-2">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="w-3.5 h-3.5 fill-current" />
                      ))}
                      <span className="text-slate-400 text-xs ml-1.5">(4.9)</span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5 line-clamp-2 leading-snug">
                      {course.title}
                    </h3>
                    <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-grow">
                      {course.description}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                      <div className="flex items-center space-x-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600 flex-shrink-0">
                          {(course.instructor || "E").charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-slate-600 truncate max-w-[90px] sm:max-w-[110px]">
                          {course.instructor || "Expert Instructor"}
                        </span>
                      </div>
                      <Link
                        to={`/courses/${course.id}`}
                        className="flex items-center gap-1 text-indigo-600 font-bold text-xs sm:text-sm hover:gap-2 transition-all flex-shrink-0"
                      >
                        View Details <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 sm:py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-7 h-7 text-slate-300" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">No courses available yet</h3>
              <p className="text-slate-500 text-sm mt-1">Check back later or contact the administrator.</p>
            </div>
          )}

          {/* View All CTA */}
          {courses.length > 0 && (
            <div className="text-center mt-10 sm:mt-14">
              <a
                href="#courses"
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-indigo-200 text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-all text-sm"
              >
                View All Courses <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ─── Features Section ─── */}
      <section className="py-14 sm:py-20 lg:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-10 sm:mb-14">
            <p className="text-xs sm:text-sm font-bold text-indigo-600 tracking-widest uppercase mb-2">Why Choose Us</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Everything you need to succeed</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-8">
            {[
              {
                icon: <BookOpen className="w-7 h-7 text-indigo-600" />,
                bg: "bg-indigo-100",
                title: "Expert-Led Content",
                desc: "Learn from industry professionals with years of real-world experience in their fields."
              },
              {
                icon: <Award className="w-7 h-7 text-amber-600" />,
                bg: "bg-amber-100",
                title: "Verified Certificates",
                desc: "Receive industry-recognized certificates upon completion to showcase your new skills."
              },
              {
                icon: <Users className="w-7 h-7 text-emerald-600" />,
                bg: "bg-emerald-100",
                title: "Community Support",
                desc: "Join a vibrant community of learners and get support from peers and instructors."
              },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm hover:shadow-md transition-all"
              >
                <div className={`w-14 h-14 ${f.bg} rounded-2xl flex items-center justify-center mb-4 sm:mb-5`}>
                  {f.icon}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="py-14 sm:py-20 bg-indigo-600">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight mb-3 sm:mb-4">
            Ready to start learning?
          </h2>
          <p className="text-indigo-200 text-sm sm:text-lg mb-7 sm:mb-9">
            Join thousands of students already transforming their careers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-7 py-3.5 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-all text-sm sm:text-base shadow-lg"
            >
              Create Free Account <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-7 py-3.5 border-2 border-white/30 text-white font-bold rounded-xl hover:bg-white/10 transition-all text-sm sm:text-base"
            >
              Sign In
            </Link>
          </div>
          {/* Trust row */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-indigo-200 font-medium">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>Verified certificates</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Instant access</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-slate-900 text-white pt-12 sm:pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-10 sm:mb-12">

            {/* Brand */}
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="text-white w-5 h-5" />
                </div>
                <span className="text-xl font-extrabold tracking-tight">
                  EduStream <span className="text-indigo-400">Pro</span>
                </span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                Empowering students worldwide with high-quality, accessible education. Start your journey today.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Quick Links</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                {[
                  { label: "Home", to: "/" },
                  { label: "Courses", href: "#courses" },
                  { label: "Login", to: "/login" },
                  { label: "Register", to: "/register" },
                ].map((link) =>
                  link.to ? (
                    <li key={link.label}>
                      <Link to={link.to} className="hover:text-white transition-colors">{link.label}</Link>
                    </li>
                  ) : (
                    <li key={link.label}>
                      <a href={link.href} className="hover:text-white transition-colors">{link.label}</a>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Contact</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li>support@edustreampro.com</li>
                <li>+91 98765 43210</li>
                <li>123 Education St,<br />Learning City</li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span>&copy; {new Date().getFullYear()} EduStream Pro. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}