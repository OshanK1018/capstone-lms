import { NavLink, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  CircleHelp,
  GraduationCap,
  Megaphone,
  Settings,
  LogOut,
} from "lucide-react";

import "./InstructorSidebar.css";

function InstructorSidebar() {
  const navigate = useNavigate();

  // Temporarily returns to the main route until login is connected.
  const handleLogout = () => {
    navigate("/");
  };

  return (
    <aside className="sidebar">
      {/* LMS logo */}
      <div className="logo">
        <div className="logo-icon">LMS</div>

        <div className="logo-text">
          <strong>LMS</strong>
          <span>Learning Management System</span>
        </div>
      </div>

      {/* Instructor navigation */}
      <nav className="navigation">
        <NavLink
          to="/instructor/dashboard"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
        >
          <LayoutDashboard size={20} />
          Dashboard
        </NavLink>

        <NavLink
          to="/instructor/courses"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
        >
          <BookOpen size={20} />
          My Courses
        </NavLink>

        <NavLink
          to="/instructor/assignments"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
        >
          <ClipboardList size={20} />
          Assignments
        </NavLink>

        <NavLink
          to="/instructor/quizzes"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
        >
          <CircleHelp size={20} />
          Quizzes
        </NavLink>

        <NavLink
          to="/instructor/gradebook"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
        >
          <GraduationCap size={20} />
          Gradebook
        </NavLink>

        <NavLink
          to="/instructor/announcements"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
        >
          <Megaphone size={20} />
          Announcements
        </NavLink>
      </nav>

      {/* Sidebar footer */}
      <div className="sidebar-footer">
        <NavLink
          to="/instructor/settings"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
        >
          <Settings size={20} />
          Settings
        </NavLink>

        <button className="nav-item logout" onClick={handleLogout}>
          <LogOut size={20} />
          Log Out
        </button>
      </div>
    </aside>
  );
}

export default InstructorSidebar;