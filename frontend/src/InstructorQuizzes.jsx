import { useMemo, useState } from "react";

import {
  CheckCircle2,
  CircleHelp,
  Clock,
  FileEdit,
  Plus,
  Search,
  Users,
} from "lucide-react";

import InstructorSidebar from "./components/InstructorSidebar";

import "./InstructorQuizzes.css";

// Temporary quiz data until the backend is connected.
const quizData = [
  {
    id: 1,
    title: "HTML and CSS Fundamentals",
    courseCode: "CSCI 510",
    courseName: "Web Application Development",
    questions: 15,
    timeLimit: 30,
    attempts: 28,
    totalStudents: 32,
    status: "Published",
  },
  {
    id: 2,
    title: "Agile Development Concepts",
    courseCode: "CSCI 633",
    courseName: "Software Engineering",
    questions: 20,
    timeLimit: 40,
    attempts: 19,
    totalStudents: 28,
    status: "Published",
  },
  {
    id: 3,
    title: "Machine Learning Basics",
    courseCode: "CSCI 721",
    courseName: "Artificial Intelligence",
    questions: 12,
    timeLimit: 25,
    attempts: 0,
    totalStudents: 24,
    status: "Draft",
  },
  {
    id: 4,
    title: "JavaScript Review",
    courseCode: "CSCI 510",
    courseName: "Web Application Development",
    questions: 10,
    timeLimit: 20,
    attempts: 32,
    totalStudents: 32,
    status: "Closed",
  },
  {
    id: 5,
    title: "Software Testing Methods",
    courseCode: "CSCI 633",
    courseName: "Software Engineering",
    questions: 18,
    timeLimit: 35,
    attempts: 26,
    totalStudents: 28,
    status: "Closed",
  },
];

function InstructorQuizzes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("All Courses");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");

  // Creates the list of courses displayed in the course filter.
  const courseOptions = useMemo(() => {
    return [
      "All Courses",
      ...new Set(quizData.map((quiz) => quiz.courseCode)),
    ];
  }, []);

  // Filters quizzes using the search, course, and status selections.
  const filteredQuizzes = useMemo(() => {
    return quizData.filter((quiz) => {
      const normalizedSearch = searchTerm.toLowerCase().trim();

      const matchesSearch =
        quiz.title.toLowerCase().includes(normalizedSearch) ||
        quiz.courseCode.toLowerCase().includes(normalizedSearch) ||
        quiz.courseName.toLowerCase().includes(normalizedSearch);

      const matchesCourse =
        selectedCourse === "All Courses" ||
        quiz.courseCode === selectedCourse;

      const matchesStatus =
        selectedStatus === "All Statuses" ||
        quiz.status === selectedStatus;

      return matchesSearch && matchesCourse && matchesStatus;
    });
  }, [searchTerm, selectedCourse, selectedStatus]);

  const publishedQuizzes = quizData.filter(
    (quiz) => quiz.status === "Published"
  ).length;

  const draftQuizzes = quizData.filter(
    (quiz) => quiz.status === "Draft"
  ).length;

  const totalAttempts = quizData.reduce(
    (total, quiz) => total + quiz.attempts,
    0
  );

  // Temporary behavior until the create quiz form is added.
  const handleCreateQuiz = () => {
    window.alert("The Create Quiz form will be added later.");
  };

  // Temporary behavior until quiz editing is connected.
  const handleManageQuiz = (quiz) => {
    window.alert(`Opening quiz: ${quiz.title}`);
  };

  return (
    <div className="quizzes-layout">
      {/* Reusable instructor navigation */}
      <InstructorSidebar />

      <main className="quizzes-main-content">
        {/* Page heading */}
        <header className="quizzes-page-header">
          <div>
            <p className="page-label">Instructor Portal</p>
            <h1>Quizzes</h1>
            <p>Create, publish, and manage quizzes for your courses.</p>
          </div>

          <button
            className="quizzes-primary-button"
            onClick={handleCreateQuiz}
          >
            <Plus size={19} />
            Create Quiz
          </button>
        </header>

        {/* Quiz summary cards */}
        <section className="quiz-stat-grid">
          <article className="quiz-stat-card">
            <div className="quiz-stat-icon total">
              <CircleHelp size={22} />
            </div>

            <div>
              <span>Total Quizzes</span>
              <strong>{quizData.length}</strong>
            </div>
          </article>

          <article className="quiz-stat-card">
            <div className="quiz-stat-icon published">
              <CheckCircle2 size={22} />
            </div>

            <div>
              <span>Published</span>
              <strong>{publishedQuizzes}</strong>
            </div>
          </article>

          <article className="quiz-stat-card">
            <div className="quiz-stat-icon draft">
              <FileEdit size={22} />
            </div>

            <div>
              <span>Drafts</span>
              <strong>{draftQuizzes}</strong>
            </div>
          </article>

          <article className="quiz-stat-card">
            <div className="quiz-stat-icon attempts">
              <Users size={22} />
            </div>

            <div>
              <span>Total Attempts</span>
              <strong>{totalAttempts}</strong>
            </div>
          </article>
        </section>

        {/* Search and filters */}
        <section className="quiz-filter-section">
          <div className="quiz-search-box">
            <Search size={19} />

            <input
              type="text"
              placeholder="Search quizzes or courses..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="quiz-filter-controls">
            <select
              value={selectedCourse}
              onChange={(event) => setSelectedCourse(event.target.value)}
              aria-label="Filter quizzes by course"
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
              aria-label="Filter quizzes by status"
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </section>

        {/* Quiz table */}
        <section className="quiz-list-panel">
          <div className="quiz-list-heading">
            <div>
              <h2>All Quizzes</h2>
              <p>
                Showing {filteredQuizzes.length} of {quizData.length} quizzes
              </p>
            </div>
          </div>

          {filteredQuizzes.length > 0 ? (
            <div className="quiz-table-wrapper">
              <table className="quiz-table">
                <thead>
                  <tr>
                    <th>Quiz</th>
                    <th>Course</th>
                    <th>Questions</th>
                    <th>Time Limit</th>
                    <th>Attempts</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredQuizzes.map((quiz) => (
                    <tr key={quiz.id}>
                      <td>
                        <div className="quiz-name-cell">
                          <div className="quiz-file-icon">
                            <CircleHelp size={19} />
                          </div>

                          <div>
                            <strong>{quiz.title}</strong>
                            <span>Quiz #{quiz.id}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="quiz-course-cell">
                          <strong>{quiz.courseCode}</strong>
                          <span>{quiz.courseName}</span>
                        </div>
                      </td>

                      <td>{quiz.questions}</td>

                      <td>
                        <div className="quiz-time-cell">
                          <Clock size={17} />
                          <span>{quiz.timeLimit} minutes</span>
                        </div>
                      </td>

                      <td>
                        <div className="quiz-attempt-cell">
                          <span>
                            {quiz.attempts}/{quiz.totalStudents}
                          </span>

                          <div className="quiz-progress">
                            <div
                              className="quiz-progress-fill"
                              style={{
                                width: `${
                                  (quiz.attempts / quiz.totalStudents) * 100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`quiz-status ${quiz.status.toLowerCase()}`}
                        >
                          {quiz.status}
                        </span>
                      </td>

                      <td>
                        <button
                          className="quiz-action-button"
                          onClick={() => handleManageQuiz(quiz)}
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
            <div className="empty-quiz-message">
              <CircleHelp size={36} />
              <h3>No quizzes found</h3>
              <p>Try changing your search or filter selections.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default InstructorQuizzes;