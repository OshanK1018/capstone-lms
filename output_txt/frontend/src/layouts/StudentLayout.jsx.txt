import { Outlet } from "react-router-dom";
import StudentNavbar from "../components/student/StudentNavbar";

function StudentLayout() {
  return (
    <div>
      <StudentNavbar />
      <Outlet />
    </div>
  );
}

export default StudentLayout;