import "./InstructorDashboard.css";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import InstructorSidebar from "./components/InstructorSidebar";

import {
  getCurrentUser,
} from "../../backend/authServices.js";

import {
  getCoursesForInstructor,
} from "../../backend/courseServices.js";

// Icons used inside the dashboard content.
import {
  BookOpen,
  Users,
  ClipboardCheck,
  Clock,
} from "lucide-react";

// Temporary task data until assignment/submission
// dashboard services are connected.
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

// Temporary values until assignment/submission
// dashboard services are connected.
const temporaryAssignmentCount = 15;
const temporaryNeedsGrading = 12;

const courseColors = [
  "#2563eb",
  "#7c3aed",
  "#059669",
  "#d97706",
  "#dc2626",
];

// Makes backend course data easier for the
// existing frontend layout to use.
function normalizeCourse(course, index) {
  return {
    ...course,

    id:
      course.id ??
      course.course_id ??
      course.courseID,

    code:
      course.code ??
      course.courseCode ??
      course.course_code ??
      `COURSE ${index + 1}`,

    title:
      course.title ??
      course.courseName ??
      course.course_name ??
      "Untitled Course",

    students:
      course.students ??
      course.studentCount ??
      course.student_count ??
      course.total_students ??
      course.seats_taken ??
      0,

    assignments:
      course.assignments ??
      course.assignmentCount ??
      course.assignment_count ??
      0,

    maxSeats:
      course.max_seats ??
      course.maxSeats ??
      0,

    seatsOpen:
      course.seats_open ??
      course.seatsOpen ??
      0,

    credits:
      course.credits ??
      0,

    color:
      course.color ??
      courseColors[
        index % courseColors.length
      ],
  };
}

function InstructorDashboard() {
  const navigate = useNavigate();

  const [instructor, setInstructor] =
    useState({
      id: null,
      name: "Instructor",
      role: "Instructor",
    });

  const [courses, setCourses] =
    useState([]);

  const [courseCount, setCourseCount] =
    useState(0);

  const [totalStudents, setTotalStudents] =
    useState(0);

  const [isLoading, setIsLoading] =
    useState(true);

  const [dashboardError, setDashboardError] =
    useState("");

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      setDashboardError("");

      // Get the currently logged-in user.
      const userResult =
        await getCurrentUser();

      if (!userResult.success) {
        setDashboardError(
          userResult.error ||
            "Unable to load instructor information."
        );

        setIsLoading(false);
        return;
      }

      /*
       * Supports both the older service response
       * and Tori's new apiRequest response shape.
       */
      const user =
        userResult.user ??
        userResult.data?.user ??
        userResult.data;

      const instructorID =
        user?.user_id ??
        user?.id ??
        user?.userId;

      const instructorName =
        user?.name ??
        user?.full_name ??
        user?.fullName ??
        "Instructor";

      const instructorRole =
        user?.role ??
        user?.user_role ??
        "Instructor";

      setInstructor({
        id: instructorID,
        name: instructorName,
        role: instructorRole,
      });

      if (!instructorID) {
        setDashboardError(
          "The logged-in instructor ID could not be found."
        );

        setIsLoading(false);
        return;
      }

      // Load courses using Tori's refactored
      // courseServices.js function.
      const coursesResult =
        await getCoursesForInstructor(
          instructorID
        );

      if (!coursesResult.success) {
        setDashboardError(
          coursesResult.error ||
            "Unable to load instructor courses."
        );

        setIsLoading(false);
        return;
      }

      /*
       * apiRequest() now returns:
       *
       * {
       *   success: true,
       *   data: backendResponse
       * }
       */
      const courseData =
        coursesResult.data ??
        coursesResult;

      const backendCourses =
        Array.isArray(courseData.courses)
          ? courseData.courses
          : Array.isArray(courseData)
          ? courseData
          : [];

      const normalizedCourses =
        backendCourses.map(
          (course, index) =>
            normalizeCourse(course, index)
        );

      setCourses(normalizedCourses);

      setCourseCount(
        Number(
          courseData.course_count ??
            courseData.courses_count ??
            normalizedCourses.length
        )
      );

      /*
       * Use the backend's total if provided.
       * Otherwise calculate it from the courses.
       */
      const calculatedStudentTotal =
        normalizedCourses.reduce(
          (total, course) =>
            total +
            Number(
              course.students || 0
            ),
          0
        );

      setTotalStudents(
        Number(
          courseData.total_students ??
            calculatedStudentTotal
        )
      );

      setIsLoading(false);
    }

    loadDashboard();
  }, []);

  // Opens the instructor courses page.
  const handleCreateCourse = () => {
    navigate("/instructor/courses");
  };

  // Opens the selected instructor page.
  const handleNavigation = (path) => {
    navigate(path);
  };

  // Opens the selected course management page.
  const handleManageCourse = (course) => {
    if (!course.id) {
      navigate("/instructor/courses");
      return;
    }

    navigate(
      `/instructor/courses/${course.id}`,
      {
        state: {
          course,
        },
      }
    );
  };

  // Creates initials for the profile avatar.
  const instructorInitials =
    instructor.name
      .split(" ")
      .filter(Boolean)
      .map((name) => name[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "IN";

  const firstName =
    instructor.name
      .split(" ")
      .filter(Boolean)[0] ||
    "Instructor";

  return (
    <div className="app-layout">
      <InstructorSidebar />

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="page-label">
              Instructor Portal
            </p>

            <h1>Dashboard</h1>
          </div>

          <div className="instructor-profile">
            <div className="profile-text">
              <strong>
                {instructor.name}
              </strong>

              <span>
                {instructor.role}
              </span>
            </div>

            <div className="avatar">
              {instructorInitials}
            </div>
          </div>
        </header>

        <section className="welcome-section">
          <div>
            <h2>
              Welcome back, {firstName}!
            </h2>

            <p>
              Here is what is happening in
              your courses today.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={handleCreateCourse}
          >
            + Create Course
          </button>
        </section>

        {dashboardError && (
          <div
            style={{
              margin: "20px 0",
              padding: "12px 14px",
              border:
                "1px solid #fecaca",
              borderRadius: "8px",
              background: "#fef2f2",
              color: "#b91c1c",
              fontSize: "13px",
              fontWeight: "600",
            }}
          >
            {dashboardError}
          </div>
        )}

        <section className="stat-grid">
          <article className="stat-card">
            <div className="stat-icon blue">
              <BookOpen size={22} />
            </div>

            <div>
              <span>
                Active Courses
              </span>

              <strong>
                {isLoading
                  ? "..."
                  : courseCount}
              </strong>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon purple">
              <Users size={22} />
            </div>

            <div>
              <span>
                Total Students
              </span>

              <strong>
                {isLoading
                  ? "..."
                  : totalStudents}
              </strong>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon green">
              <ClipboardCheck
                size={22}
              />
            </div>

            <div>
              <span>
                Assignments
              </span>

              <strong>
                {
                  temporaryAssignmentCount
                }
              </strong>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon orange">
              <Clock size={22} />
            </div>

            <div>
              <span>
                Needs Grading
              </span>

              <strong>
                {
                  temporaryNeedsGrading
                }
              </strong>
            </div>
          </article>
        </section>

        <div className="dashboard-grid">
          <section className="panel courses-panel">
            <div className="panel-header">
              <div>
                <h2>My Courses</h2>

                <p>
                  Manage your current courses
                </p>
              </div>

              <button
                className="text-button"
                onClick={() =>
                  handleNavigation(
                    "/instructor/courses"
                  )
                }
              >
                View All
              </button>
            </div>

            <div className="course-list">
              {isLoading ? (
                <p>
                  Loading courses...
                </p>
              ) : courses.length > 0 ? (
                courses.map((course) => (
                  <article
                    className="course-card"
                    key={course.id}
                  >
                    <div
                      className="course-color"
                      style={{
                        backgroundColor:
                          course.color,
                      }}
                    />

                    <div className="course-content">
                      <span className="course-code">
                        {course.code}
                      </span>

                      <h3>
                        {course.title}
                      </h3>

                      <div className="course-details">
                        <span>
                          {course.students}{" "}
                          students
                        </span>

                        <span>
                          {
                            course.assignments
                          }{" "}
                          assignments
                        </span>
                      </div>

                      <button
                        className="manage-button"
                        onClick={() =>
                          handleManageCourse(
                            course
                          )
                        }
                      >
                        Manage Course
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p>
                  No courses found for this
                  instructor.
                </p>
              )}
            </div>
          </section>

          <section className="panel tasks-panel">
            <div className="panel-header">
              <div>
                <h2>
                  Upcoming Tasks
                </h2>

                <p>
                  Items requiring your
                  attention
                </p>
              </div>
            </div>

            <div className="task-list">
              {upcomingTasks.map(
                (task) => (
                  <article
                    className="task-item"
                    key={task.id}
                  >
                    <div className="task-check">
                      <Clock
                        size={21}
                      />
                    </div>

                    <div className="task-information">
                      <h3>
                        {task.title}
                      </h3>

                      <span>
                        {task.course}
                      </span>
                    </div>

                    <time>
                      {task.dueDate}
                    </time>
                  </article>
                )
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default InstructorDashboard;