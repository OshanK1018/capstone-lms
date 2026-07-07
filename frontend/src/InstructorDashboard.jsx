import "./InstructorDashboard.css";

// Icon imports from lucide-react.
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  CircleHelp,
  GraduationCap,
  Megaphone,
  Settings,
  LogOut,
  Users,
  ClipboardCheck,
  Clock,
} from "lucide-react";

// Temporary course data used to display the instructor's current courses.
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

// Temporary task data used to show upcoming instructor responsibilities.
const upcomingTasks = [
  {
    id: 1,
    title: "Grade Assignment 2",
    course: "CPS 510",
    dueDate: "July 5",
  },
  {
    id: 2,
    title: "Publish Week 6 Quiz",
    course: "CPS 633",
    dueDate: "July 7",
  },
  {
    id: 3,
    title: "Review Project Submissions",
    course: "CPS 721",
    dueDate: "July 10",
  },
];

function InstructorDashboard() {
  // Placeholder function for creating a new course.
  const handleCreateCourse = () => {
    alert("The course creation form will be added in the next stage.");
  };

  // Placeholder function for sidebar navigation.
  const handleNavigation = (pageName) => {
    alert(`${pageName} page will be added in the next stage.`);
  };

  // Placeholder function for managing a specific course.
  const handleManageCourse = (course) => {
    alert(`Opening ${course.code}: ${course.title}`);
  };

  return (
    <div className="app-layout">
      {/* Sidebar section with logo, main navigation links, and footer buttons */}
      <aside className="sidebar">
        {/* LMS logo and  name */}
        <div className="logo">
          <div className="logo-icon">LMS</div>

          <div className="logo-text">
            <strong>LMS</strong>
            <span>Learning Management System</span>
          </div>
        </div>

        {/* Main sidebar navigation */}
        <nav className="navigation">
          <button className="nav-item active">
            <LayoutDashboard size={20} />
            Dashboard
          </button>

          <button
            className="nav-item"
            onClick={() => handleNavigation("My Courses")}
          >
            <BookOpen size={20} />
            My Courses
          </button>

          <button
            className="nav-item"
            onClick={() => handleNavigation("Assignments")}
          >
            <ClipboardList size={20} />
            Assignments
          </button>

          <button
            className="nav-item"
            onClick={() => handleNavigation("Quizzes")}
          >
            <CircleHelp size={20} />
            Quizzes
          </button>

          <button
            className="nav-item"
            onClick={() => handleNavigation("Gradebook")}
          >
            <GraduationCap size={20} />
            Gradebook
          </button>

          <button
            className="nav-item"
            onClick={() => handleNavigation("Announcements")}
          >
            <Megaphone size={20} />
            Announcements
          </button>
        </nav>

        {/* Bottom sidebar actions for settings and logging out */}
        <div className="sidebar-footer">
          <button
            className="nav-item"
            onClick={() => handleNavigation("Settings")}
          >
            <Settings size={20} />
            Settings
          </button>

          <button
            className="nav-item logout"
            onClick={() => handleNavigation("Log Out")}
          >
            <LogOut size={20} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main dashboard content area */}
      <main className="main-content">
        {/* Top bar showing page title and instructor profile */}
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

        {/* Welcome message and create course button */}
        <section className="welcome-section">
          <div>
            <h2>Welcome back, Oshan!</h2>
            <p>Here is what is happening in your courses today.</p>
          </div>

          <button className="primary-button" onClick={handleCreateCourse}>
            + Create Course
          </button>
        </section>

        {/* Summary statistic cards for quick dashboard information */}
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
              <strong>84</strong>
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

        {/* Main dashboard grid containing course cards and upcoming tasks */}
        <div className="dashboard-grid">
          {/* Course panel showing the instructor's current courses */}
          <section className="panel courses-panel">
            <div className="panel-header">
              <div>
                <h2>My Courses</h2>
                <p>Manage your current courses</p>
              </div>

              <button
                className="text-button"
                onClick={() => handleNavigation("My Courses")}
              >
                View All
              </button>
            </div>

            {/* Loops through the courses array and creates a card for each course */}
            <div className="course-list">
              {courses.map((course) => (
                <article className="course-card" key={course.id}>
                  {/* Colored bar to separate courses */}
                  <div
                    className="course-color"
                    style={{ backgroundColor: course.color }}
                  />

                  <div className="course-content">
                    <span className="course-code">{course.code}</span>

                    <h3>{course.title}</h3>

                    <div className="course-details">
                      <span>{course.students} students</span>
                      <span>{course.assignments} assignments</span>
                    </div>

                    <button
                      className="manage-button"
                      onClick={() => handleManageCourse(course)}
                    >
                      Manage Course
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Task panel showing upcoming instructor tasks */}
          <section className="panel tasks-panel">
            <div className="panel-header">
              <div>
                <h2>Upcoming Tasks</h2>
                <p>Items requiring your attention</p>
              </div>
            </div>

            {/* Loops through the upcomingTasks array and displays each task */}
            <div className="task-list">
              {upcomingTasks.map((task) => (
                <article className="task-item" key={task.id}>
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

export default  InstructorDashboard;