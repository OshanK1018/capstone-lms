import "./InstructorDashboard.css";

import { useNavigate } from "react-router-dom";

import InstructorSidebar from "./components/InstructorSidebar";

// Icons used inside the dashboard content.
import {
  BookOpen,
  Users,
  ClipboardCheck,
  Clock,
} from "lucide-react";

// Temporary course data until the backend is connected.
const courses = [
  {
    id: 1,
    code: "CSCI 510",
    title: "Web Application Development",
    students: 32,
    assignments: 6,
    color: "#2563eb",
  },
  {
    id: 2,
    code: "CSCI 633",
    title: "Software Engineering",
    students: 28,
    assignments: 4,
    color: "#7c3aed",
  },
  {
    id: 3,
    code: "CSCI 721",
    title: "Artificial Intelligence",
    students: 24,
    assignments: 5,
    color: "#059669",
  },
];

// Temporary task data until the backend is connected.
const upcomingTasks = [
  {
    id: 1,
    title: "Grade Assignment 2",
    course: "CSCI 510",
    dueDate: "July 5",
  },
  {
    id: 2,
    title: "Publish Week 6 Quiz",
    course: "CSCI 633",
    dueDate: "July 7",
  },
  {
    id: 3,
    title: "Review Project Submissions",
    course: "CSCI 721",
    dueDate: "July 10",
  },
];

function InstructorDashboard() {
  const navigate = useNavigate();

  // Opens the instructor courses page.
  const handleCreateCourse = () => {
    navigate("/instructor/courses");
  };

  // Opens the selected instructor page.
  const handleNavigation = (path) => {
    navigate(path);
  };

  // Sends the selected course to the Courses page.
  const handleManageCourse = (course) => {
    navigate("/instructor/courses", {
      state: { selectedCourse: course },
    });
  };

  return (
    <div className="app-layout">
      {/* Reusable instructor navigation sidebar */}
      <InstructorSidebar />

      {/* Main dashboard content */}
      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="page-label">Instructor Portal</p>
            <h1>Dashboard</h1>
          </div>

          <div className="instructor-profile">
            <div className="profile-text">
              <strong>Oshan Karunarathna</strong>
              <span>Instructor</span>
            </div>

            <div className="avatar">OK</div>
          </div>
        </header>

        {/* Welcome section */}
        <section className="welcome-section">
          <div>
            <h2>Welcome back, Oshan!</h2>
            <p>Here is what is happening in your courses today.</p>
          </div>

          <button
            className="primary-button"
            onClick={handleCreateCourse}
          >
            + Create Course
          </button>
        </section>

        {/* Dashboard statistics */}
        <section className="stat-grid">
          <article className="stat-card">
            <div className="stat-icon blue">
              <BookOpen size={22} />
            </div>

            <div>
              <span>Active Courses</span>
              <strong>{courses.length}</strong>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon purple">
              <Users size={22} />
            </div>

            <div>
              <span>Total Students</span>
              <strong>85</strong>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon green">
              <ClipboardCheck size={22} />
            </div>

            <div>
              <span>Assignments</span>
              <strong>15</strong>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon orange">
              <Clock size={22} />
            </div>

            <div>
              <span>Needs Grading</span>
              <strong>12</strong>
            </div>
          </article>
        </section>

        {/* Courses and upcoming tasks */}
        <div className="dashboard-grid">
          <section className="panel courses-panel">
            <div className="panel-header">
              <div>
                <h2>My Courses</h2>
                <p>Manage your current courses</p>
              </div>

              <button
                className="text-button"
                onClick={() =>
                  handleNavigation("/instructor/courses")
                }
              >
                View All
              </button>
            </div>

            <div className="course-list">
              {courses.map((course) => (
                <article
                  className="course-card"
                  key={course.id}
                >
                  <div
                    className="course-color"
                    style={{ backgroundColor: course.color }}
                  />

                  <div className="course-content">
                    <span className="course-code">
                      {course.code}
                    </span>

                    <h3>{course.title}</h3>

                    <div className="course-details">
                      <span>{course.students} students</span>
                      <span>
                        {course.assignments} assignments
                      </span>
                    </div>

                    <button
                      className="manage-button"
                      onClick={() =>
                        handleManageCourse(course)
                      }
                    >
                      Manage Course
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel tasks-panel">
            <div className="panel-header">
              <div>
                <h2>Upcoming Tasks</h2>
                <p>Items requiring your attention</p>
              </div>
            </div>

            <div className="task-list">
              {upcomingTasks.map((task) => (
                <article
                  className="task-item"
                  key={task.id}
                >
                  <div className="task-check">
                    <Clock size={21} />
                  </div>

                  <div className="task-information">
                    <h3>{task.title}</h3>
                    <span>{task.course}</span>
                  </div>

                  <time>{task.dueDate}</time>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default InstructorDashboard;