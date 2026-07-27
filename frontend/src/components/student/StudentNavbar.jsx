import "./StudentNavbar.css";
import { Link, NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";

function StudentNavbar() {
  return (
    <header className="navbar">
      <Link to="/student/dashboard" className="navbar__brand">
        LMS
      </Link>

      <nav className="navbar__links">
        <NavLink to="/student/dashboard">Dashboard</NavLink>
        <NavLink to="/student/enroll">Enroll</NavLink>
      </nav>

      <nav className="navbar__actions">
        <Link to="/login" className="navbar__logout">
            <LogOut size={18} />
            <span>Logout</span>
        </Link>
      </nav>
    </header>
  );
}

export default StudentNavbar;