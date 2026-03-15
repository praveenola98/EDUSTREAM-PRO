import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc, collection, getDocs, query, orderBy, setDoc, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../App";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, BookOpen, User, CheckCircle, Play, Lock, ShieldCheck, CreditCard, X, Shield } from "lucide-react";

export default function CourseDetails() {

const { courseId } = useParams();
const { user } = useAuth();
const navigate = useNavigate();

const [course,setCourse] = useState(null);
const [lessons,setLessons] = useState([]);
const [loading,setLoading] = useState(true);
const [isEnrolled,setIsEnrolled] = useState(false);
const [showPaymentModal,setShowPaymentModal] = useState(false);
const [purchasing,setPurchasing] = useState(false);
const [paymentError,setPaymentError] = useState(null);

useEffect(()=>{

const fetchCourseData = async()=>{

if(!courseId) return;

try{

const courseDoc = await getDoc(doc(db,"courses",courseId));

if(courseDoc.exists()){

setCourse({id:courseDoc.id,...courseDoc.data()});

const lessonsQuery = query(
collection(db,`courses/${courseId}/lessons`),
orderBy("order","asc")
);

const lessonsSnapshot = await getDocs(lessonsQuery);

setLessons(
lessonsSnapshot.docs.map(doc=>({
id:doc.id,
...doc.data()
}))
);

if(user){

const enrollmentId = `${user.uid}_${courseId}`;

const enrollmentDoc = await getDoc(doc(db,"enrollments",enrollmentId));

setIsEnrolled(enrollmentDoc.exists());

}

}

}catch(err){

console.error(err);

}

finally{

setLoading(false);

}

};

fetchCourseData();

},[courseId,user]);

const handlePurchase = ()=>{

if(!user){

navigate("/login");
return;

}

setShowPaymentModal(true);

};

const confirmPayment = async()=>{

if(!user){

navigate("/login");
return;

}

const options={

key:"rzp_test_OgBupCvJ9Qynu3",

amount:course.price*100,

currency:"INR",

name:"EduStream Pro",

description:course.title,

handler:async function(response){

const enrollmentId = `${user.uid}_${courseId}`;

await setDoc(doc(db,"enrollments",enrollmentId),{

userId:user.uid,
courseId:courseId,
enrolledAt:new Date().toISOString(),
progress:0,
completedLessons:[]

});

await addDoc(collection(db,"payments"),{

userId:user.uid,
courseId:courseId,
amount:course.price,
status:"completed",
transactionId:response.razorpay_payment_id,
createdAt:new Date().toISOString()

});

setIsEnrolled(true);
setShowPaymentModal(false);

navigate(`/learn/${courseId}`);

},

theme:{color:"#6366F1"}

};

const rzp = new window.Razorpay(options);
rzp.open();

};

if(loading){

return(

<div className="min-h-screen flex items-center justify-center">

<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-600"/>

</div>

);

}

if(!course){

return(

<div className="min-h-screen flex flex-col items-center justify-center p-6">

<h1 className="text-xl md:text-2xl font-bold mb-4">
Course not found
</h1>

<button
onClick={()=>navigate("/")}
className="text-indigo-600 font-semibold"
>

Go back home

</button>

</div>

);

}

return(

<div className="bg-white min-h-screen">

{/* HEADER */}

<div className="bg-slate-900 text-white py-12 md:py-16">

<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

<div className="lg:grid lg:grid-cols-12 lg:gap-12">

<div className="lg:col-span-8">

<nav className="flex text-sm text-slate-400 mb-4">

<Link to="/" className="hover:text-white">
Home
</Link>

<span className="mx-2">/</span>

<span className="text-white">
Courses
</span>

</nav>

<h1 className="text-3xl md:text-5xl font-extrabold mb-6">

{course.title}

</h1>

<p className="text-lg md:text-xl text-slate-300 mb-6">

{course.description}

</p>

<div className="flex flex-wrap gap-4 text-sm">

<div className="flex items-center space-x-2">

<User className="w-5 h-5 text-indigo-400"/>

<span>

Created by
<span className="font-bold text-indigo-400 ml-1">

{course.instructor || "Expert Instructor"}

</span>

</span>

</div>

<div className="flex items-center space-x-2">

<Clock className="w-5 h-5 text-indigo-400"/>

<span>

{course.duration || "10+ hours"}

</span>

</div>

<div className="flex items-center space-x-2">

<BookOpen className="w-5 h-5 text-indigo-400"/>

<span>

{lessons.length} Lessons

</span>

</div>

</div>

</div>

</div>

</div>

</div>

{/* CONTENT */}

<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">

<div className="grid lg:grid-cols-12 gap-10">

{/* LEFT */}

<div className="lg:col-span-8">

<h2 className="text-2xl font-bold mb-6">

What you'll learn

</h2>

<div className="grid sm:grid-cols-2 gap-4 mb-12">

{[1,2,3,4].map(i=>(
<div key={i} className="flex space-x-3">

<CheckCircle className="text-emerald-500 w-5 h-5"/>

<span className="text-slate-600">

Comprehensive understanding of core concepts.

</span>

</div>
))}

</div>

<h2 className="text-2xl font-bold mb-6">

Course Content

</h2>

<div className="space-y-3">

{lessons.map((lesson,index)=>(

<div key={lesson.id} className="border rounded-xl p-4 flex justify-between items-center">

<div className="flex items-center space-x-3">

<div className="w-8 h-8 flex items-center justify-center border rounded-lg text-sm font-bold">

{index+1}

</div>

<span className="font-semibold">

{lesson.title}

</span>

</div>

<Play className="w-4 h-4 text-slate-400"/>

</div>

))}

</div>

</div>

{/* SIDEBAR */}

<div className="lg:col-span-4">

<div className="bg-white rounded-3xl shadow-xl border sticky top-24">

<img
src={course.thumbnail || `https://picsum.photos/seed/${course.id}/800/450`}
alt=""
className="rounded-t-3xl w-full"
/>

<div className="p-6">

<div className="text-3xl font-extrabold mb-4">

₹ {course.price}

</div>

{isEnrolled ? (

<button
onClick={()=>navigate(`/learn/${courseId}`)}
className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold"
>

Continue Learning

</button>

) : (

<button
onClick={handlePurchase}
className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold"
>

Enroll Now

</button>

)}

<div className="mt-6 space-y-3 text-sm text-slate-600">

<div className="flex space-x-2">

<BookOpen className="w-4 h-4"/>

<span>Full lifetime access</span>

</div>

<div className="flex space-x-2">

<ShieldCheck className="w-4 h-4"/>

<span>Certificate</span>

</div>

<div className="flex space-x-2">

<Lock className="w-4 h-4"/>

<span>Secure payment</span>

</div>

</div>

</div>

</div>

</div>

</div>

</div>

{/* PAYMENT MODAL */}

<AnimatePresence>

{showPaymentModal && (

<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">

<motion.div

initial={{opacity:0,scale:.95}}
animate={{opacity:1,scale:1}}
exit={{opacity:0}}

className="bg-white rounded-3xl w-full max-w-md p-8"

>

<div className="flex justify-between mb-6">

<h3 className="font-bold text-xl">

Checkout

</h3>

<button onClick={()=>setShowPaymentModal(false)}>

<X/>

</button>

</div>

<div className="bg-indigo-50 p-4 rounded-xl flex justify-between mb-6">

<span className="font-bold">

{course.title}

</span>

<span className="font-bold">

₹ {course.price}

</span>

</div>

<button
onClick={confirmPayment}
className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold flex justify-center items-center space-x-2"
>

<Lock className="w-4 h-4"/>

<span>Pay & Enroll</span>

</button>

</motion.div>

</div>

)}

</AnimatePresence>

</div>

);

}