import { Navigate, Route, Routes } from "react-router-dom";

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