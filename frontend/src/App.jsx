import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

// Student page imports
import Login from "./pages/student/Login";
import StudentDashboard from "./pages/student/StudentDashboard";
import CourseEnrollment from "./pages/student/CourseEnrollment";
import CourseDetail from "./pages/student/CourseDetail";
import StudentLayout from "./layouts/StudentLayout";
import CourseLayout from "./layouts/CourseLayout";
import StudentMaterials from "./pages/student/StudentMaterials";
import StudentAssignments from "./pages/student/StudentAssignments";
import StudentAssignmentSubmission from "./pages/student/StudentAssignmentSubmission";
import StudentQuizzes from "./pages/student/StudentQuizzes";
import StudentQuizTaking from "./pages/student/StudentQuizTaking";
import StudentGrades from "./pages/student/StudentGrades";

// Instructor page imports
import InstructorDashboard from "./InstructorDashboard";
import InstructorCourses from "./InstructorCourses";
import InstructorManageCourse from "./InstructorManageCourse";
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

        <Route path="course/:courseId" element={<CourseLayout />}>
          <Route index element={<CourseDetail />} />
          <Route path="materials" element={<StudentMaterials />} />
          <Route path="assignments" element={<StudentAssignments />} />
          <Route path="assignments/:assignmentId" element={<StudentAssignmentSubmission />} />
          <Route path="quizzes" element={<StudentQuizzes />} />
          <Route path="quizzes/:quizId" element={<StudentQuizTaking />} />
          <Route path="grades" element={<StudentGrades />} />
        </Route>
      </Route>

      {/* Instructor routes */}
      <Route
        path="/instructor/dashboard"
        element={<InstructorDashboard />}
      />

      <Route
        path="/instructor/courses"
        element={<InstructorCourses />}
      />

      <Route
        path="/instructor/courses/:courseId"
        element={<InstructorManageCourse />}
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

      {/* Base URL goes to login */}
      <Route
        path="/"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

      {/* Unknown URLs go to login */}
      <Route
        path="*"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;