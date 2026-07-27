import { Navigate, Route, Routes } from "react-router-dom";


// Student page imports
import Login from "./pages/student/Login";
import StudentDashboard from "./pages/student/StudentDashboard";
import CourseEnrollment from "./pages/student/CourseEnrollment";
import CourseDetail from "./pages/student/CourseDetail";
import StudentLayout from "./layouts/StudentLayout";


// Instructor page imports
import InstructorDashboard from "./InstructorDashboard";
import InstructorCourses from "./InstructorCourses";
import InstructorAssignments from "./InstructorAssignments";
import InstructorQuizzes from "./InstructorQuizzes";
import InstructorGradebook from "./InstructorGradebook";
import InstructorAnnouncements from "./InstructorAnnouncements";
import InstructorSettings from "./InstructorSettings";

function App() {
  return (
    <Routes>
      {/* Login route */}
      <Route path="/login" element={<Login />} />

      {/* Student routes */}
      <Route path="/student" element={<StudentLayout />}>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="enroll" element={<CourseEnrollment />} />
        <Route path="course/:courseId" element={<CourseDetail />} />
      </Route>
      
      {/* Instructor portal routes */}
      <Route
        path="/instructor/dashboard"
        element={<InstructorDashboard />}
      />

      <Route
        path="/instructor/courses"
        element={<InstructorCourses />}
      />

      <Route
        path="/instructor/assignments"
        element={<InstructorAssignments />}
      />

      <Route
        path="/instructor/quizzes"
        element={<InstructorQuizzes />}
      />

      <Route
        path="/instructor/gradebook"
        element={<InstructorGradebook />}
      />

      <Route
        path="/instructor/announcements"
        element={<InstructorAnnouncements />}
      />

      <Route
        path="/instructor/settings"
        element={<InstructorSettings />}
      />

      {/* Redirects the base URL to the instructor dashboard */}
      <Route
        path="/"
        element={<Navigate to="/instructor/dashboard" replace />}
      />

      {/* Redirects unknown URLs to the instructor dashboard */}
      <Route
        path="*"
        element={<Navigate to="/instructor/dashboard" replace />}
      />
    </Routes>
  );
}

export default App;