import { Outlet } from "react-router-dom";
import CourseNavbar from "../components/student/CourseNavbar";

function CourseLayout() {
  return (
    <div>
      <CourseNavbar />
      <Outlet />
    </div>
  );
}

export default CourseLayout;