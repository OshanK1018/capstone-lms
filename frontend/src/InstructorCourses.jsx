import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  BookOpen,
  Plus,
  Search,
  Users,
  ClipboardList,
} from "lucide-react";

import InstructorSidebar from "./components/InstructorSidebar";

import "./InstructorCourses.css";

// Temporary course data until the backend is connected.
const initialCourses = [
  {
    id: 1,
    code: "CSCI 510",
    title: "Web Application Development",
    students: 32,
    assignments: 6,
    status: "Active",
    color: "#2563eb",
  },
  {
    id: 2,
    code: "CSCI 633",
    title: "Software Engineering",
    students: 28,
    assignments: 4,
    status: "Active",
    color: "#7c3aed",
  },
  {
    id: 3,
    code: "CSCI 721",
    title: "Artificial Intelligence",
    students: 24,
    assignments: 5,
    status: "Active",
    color: "#059669",
  },
];

function InstructorCourses() {
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState("");

  // Receives a selected course from the dashboard.
  const selectedCourse = location.state?.selectedCourse;

  // Filters courses by code or title.
  const filteredCourses = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return initialCourses;
    }

    return initialCourses.filter((course) => {
      return (
        course.code.toLowerCase().includes(normalizedSearch) ||
        course.title.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [searchTerm]);

  // Temporary create-course action.
  const handleCreateCourse = () => {
    alert("The create course form will be built next.");
  };

  // Temporary manage-course action.
  const handleManageCourse = (course) => {
    alert(`Managing ${course.code}: ${course.title}`);
  };

  return (
    <div className="app-layout">
      {/* Reusable instructor navigation sidebar */}
      <InstructorSidebar />

      {/* Main Courses page content */}
      <main className="courses-main-content">
        <header className="courses-page-header">
          <div>
            <p className="page-label">Instructor Portal</p>
            <h1>My Courses</h1>
            <p>View and manage all courses assigned to you.</p>
          </div>

          <button
            className="primary-button"
            onClick={handleCreateCourse}
          >
            <Plus size={18} />
            Create Course
          </button>
        </header>

        {/* Shows which course was selected from the dashboard */}
        {selectedCourse && (
          <section className="selected-course-notice">
            <strong>Selected course:</strong>

            <span>
              {selectedCourse.code} - {selectedCourse.title}
            </span>
          </section>
        )}

        {/* Search and dashboard navigation */}
        <section className="course-search-section">
          <div className="course-search-box">
            <Search size={19} />

            <input
              type="text"
              placeholder="Search by course code or title"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />
          </div>

          <button
            className="secondary-button"
            onClick={() =>
              navigate("/instructor/dashboard")
            }
          >
            Back to Dashboard
          </button>
        </section>

        {/* Course list */}
        <section className="all-courses-section">
          <div className="all-courses-header">
            <div>
              <h2>All Courses</h2>
              <p>{filteredCourses.length} courses found</p>
            </div>
          </div>

          {filteredCourses.length > 0 ? (
            <div className="all-course-grid">
              {filteredCourses.map((course) => (
                <article
                  className="full-course-card"
                  key={course.id}
                >
                  <div
                    className="course-color"
                    style={{
                      backgroundColor: course.color,
                    }}
                  />

                  <div className="full-course-content">
                    <div className="course-card-heading">
                      <div>
                        <span className="course-code">
                          {course.code}
                        </span>

                        <h3>{course.title}</h3>
                      </div>

                      <span className="course-status">
                        {course.status}
                      </span>
                    </div>

                    <div className="course-stat-row">
                      <div>
                        <Users size={18} />
                        <span>{course.students} students</span>
                      </div>

                      <div>
                        <ClipboardList size={18} />
                        <span>
                          {course.assignments} assignments
                        </span>
                      </div>
                    </div>

                    <button
                      className="manage-button"
                      onClick={() =>
                        handleManageCourse(course)
                      }
                    >
                      <BookOpen size={17} />
                      Manage Course
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-course-message">
              <BookOpen size={34} />

              <h3>No courses found</h3>

              <p>
                Try searching with a different course code or
                title.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default InstructorCourses;