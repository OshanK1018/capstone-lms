import { useMemo, useState } from "react";

import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileEdit,
  Plus,
  Search,
  Users,
} from "lucide-react";

import InstructorSidebar from "./components/InstructorSidebar";

import "./InstructorAssignments.css";

// Temporary assignment data until the backend is connected.
const assignmentData = [
  {
    id: 1,
    title: "Responsive Website Project",
    courseCode: "CSCI 510",
    courseName: "Web Application Development",
    dueDate: "August 2, 2026",
    submissions: 24,
    totalStudents: 32,
    status: "Published",
  },
  {
    id: 2,
    title: "Software Requirements Document",
    courseCode: "CSCI 633",
    courseName: "Software Engineering",
    dueDate: "August 5, 2026",
    submissions: 18,
    totalStudents: 28,
    status: "Published",
  },
  {
    id: 3,
    title: "Search Algorithms Analysis",
    courseCode: "CSCI 721",
    courseName: "Artificial Intelligence",
    dueDate: "August 10, 2026",
    submissions: 0,
    totalStudents: 24,
    status: "Draft",
  },
  {
    id: 4,
    title: "JavaScript Fundamentals Quiz Review",
    courseCode: "CSCI 510",
    courseName: "Web Application Development",
    dueDate: "July 25, 2026",
    submissions: 32,
    totalStudents: 32,
    status: "Closed",
  },
  {
    id: 5,
    title: "Agile Sprint Retrospective",
    courseCode: "CSCI 633",
    courseName: "Software Engineering",
    dueDate: "July 28, 2026",
    submissions: 25,
    totalStudents: 28,
    status: "Closed",
  },
];

function InstructorAssignments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("All Courses");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");

  // Creates a unique list of courses for the course filter.
  const courseOptions = useMemo(() => {
    return [
      "All Courses",
      ...new Set(assignmentData.map((assignment) => assignment.courseCode)),
    ];
  }, []);

  // Filters assignments by title, course, and status.
  const filteredAssignments = useMemo(() => {
    return assignmentData.filter((assignment) => {
      const normalizedSearch = searchTerm.toLowerCase().trim();

      const matchesSearch =
        assignment.title.toLowerCase().includes(normalizedSearch) ||
        assignment.courseCode.toLowerCase().includes(normalizedSearch) ||
        assignment.courseName.toLowerCase().includes(normalizedSearch);

      const matchesCourse =
        selectedCourse === "All Courses" ||
        assignment.courseCode === selectedCourse;

      const matchesStatus =
        selectedStatus === "All Statuses" ||
        assignment.status === selectedStatus;

      return matchesSearch && matchesCourse && matchesStatus;
    });
  }, [searchTerm, selectedCourse, selectedStatus]);

  const publishedAssignments = assignmentData.filter(
    (assignment) => assignment.status === "Published"
  ).length;

  const draftAssignments = assignmentData.filter(
    (assignment) => assignment.status === "Draft"
  ).length;

  const totalSubmissions = assignmentData.reduce(
    (total, assignment) => total + assignment.submissions,
    0
  );

  // Temporary button behavior until the assignment form is created.
  const handleCreateAssignment = () => {
    window.alert(
      "The Create Assignment form will be connected in a later step."
    );
  };

  // Temporary button behavior until assignment editing is connected.
  const handleEditAssignment = (assignment) => {
    window.alert(`Opening assignment: ${assignment.title}`);
  };

  return (
    <div className="assignments-layout">
      {/* Reusable instructor navigation */}
      <InstructorSidebar />

      <main className="assignments-main-content">
        {/* Page heading */}
        <header className="assignments-page-header">
          <div>
            <p className="page-label">Instructor Portal</p>
            <h1>Assignments</h1>
            <p>Create, publish, and manage course assignments.</p>
          </div>

          <button
            className="assignments-primary-button"
            onClick={handleCreateAssignment}
          >
            <Plus size={19} />
            Create Assignment
          </button>
        </header>

        {/* Assignment summary cards */}
        <section className="assignment-stat-grid">
          <article className="assignment-stat-card">
            <div className="assignment-stat-icon total">
              <ClipboardList size={22} />
            </div>

            <div>
              <span>Total Assignments</span>
              <strong>{assignmentData.length}</strong>
            </div>
          </article>

          <article className="assignment-stat-card">
            <div className="assignment-stat-icon published">
              <CheckCircle2 size={22} />
            </div>

            <div>
              <span>Published</span>
              <strong>{publishedAssignments}</strong>
            </div>
          </article>

          <article className="assignment-stat-card">
            <div className="assignment-stat-icon draft">
              <FileEdit size={22} />
            </div>

            <div>
              <span>Drafts</span>
              <strong>{draftAssignments}</strong>
            </div>
          </article>

          <article className="assignment-stat-card">
            <div className="assignment-stat-icon submissions">
              <Users size={22} />
            </div>

            <div>
              <span>Submissions</span>
              <strong>{totalSubmissions}</strong>
            </div>
          </article>
        </section>

        {/* Search and filter controls */}
        <section className="assignment-filter-section">
          <div className="assignment-search-box">
            <Search size={19} />

            <input
              type="text"
              placeholder="Search assignments or courses..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="assignment-filter-controls">
            <select
              value={selectedCourse}
              onChange={(event) => setSelectedCourse(event.target.value)}
              aria-label="Filter assignments by course"
            >
              {courseOptions.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              aria-label="Filter assignments by status"
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </section>

        {/* Assignment list */}
        <section className="assignment-list-panel">
          <div className="assignment-list-heading">
            <div>
              <h2>All Assignments</h2>
              <p>
                Showing {filteredAssignments.length} of{" "}
                {assignmentData.length} assignments
              </p>
            </div>
          </div>

          {filteredAssignments.length > 0 ? (
            <div className="assignment-table-wrapper">
              <table className="assignment-table">
                <thead>
                  <tr>
                    <th>Assignment</th>
                    <th>Course</th>
                    <th>Due Date</th>
                    <th>Submissions</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAssignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td>
                        <div className="assignment-name-cell">
                          <div className="assignment-file-icon">
                            <ClipboardList size={19} />
                          </div>

                          <div>
                            <strong>{assignment.title}</strong>
                            <span>Assignment #{assignment.id}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="assignment-course-cell">
                          <strong>{assignment.courseCode}</strong>
                          <span>{assignment.courseName}</span>
                        </div>
                      </td>

                      <td>
                        <div className="assignment-date-cell">
                          <CalendarDays size={17} />
                          <span>{assignment.dueDate}</span>
                        </div>
                      </td>

                      <td>
                        <div className="assignment-submission-cell">
                          <span>
                            {assignment.submissions}/
                            {assignment.totalStudents}
                          </span>

                          <div className="submission-progress">
                            <div
                              className="submission-progress-fill"
                              style={{
                                width: `${
                                  (assignment.submissions /
                                    assignment.totalStudents) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`assignment-status ${assignment.status.toLowerCase()}`}
                        >
                          {assignment.status}
                        </span>
                      </td>

                      <td>
                        <button
                          className="assignment-action-button"
                          onClick={() =>
                            handleEditAssignment(assignment)
                          }
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-assignment-message">
              <Clock size={36} />
              <h3>No assignments found</h3>
              <p>Try changing your search or filter selections.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default InstructorAssignments;