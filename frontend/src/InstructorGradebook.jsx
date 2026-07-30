import { useMemo, useState } from "react";

import {
  Award,
  BookOpen,
  Download,
  GraduationCap,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";

import InstructorSidebar from "./components/InstructorSidebar";

import "./InstructorGradebook.css";

// Temporary grade data until the backend is connected.
const gradeData = [
  {
    id: 1,
    studentName: "Ava Martinez",
    studentId: "10024561",
    courseCode: "CSCI 510",
    courseName: "Web Application Development",
    assignments: 92,
    quizzes: 88,
    project: 95,
  },
  {
    id: 2,
    studentName: "Liam Johnson",
    studentId: "10024562",
    courseCode: "CSCI 510",
    courseName: "Web Application Development",
    assignments: 84,
    quizzes: 79,
    project: 90,
  },
  {
    id: 3,
    studentName: "Sophia Williams",
    studentId: "10024563",
    courseCode: "CSCI 633",
    courseName: "Software Engineering",
    assignments: 96,
    quizzes: 91,
    project: 94,
  },
  {
    id: 4,
    studentName: "Noah Brown",
    studentId: "10024564",
    courseCode: "CSCI 633",
    courseName: "Software Engineering",
    assignments: 76,
    quizzes: 82,
    project: 80,
  },
  {
    id: 5,
    studentName: "Emma Davis",
    studentId: "10024565",
    courseCode: "CSCI 721",
    courseName: "Artificial Intelligence",
    assignments: 89,
    quizzes: 93,
    project: 91,
  },
  {
    id: 6,
    studentName: "Ethan Wilson",
    studentId: "10024566",
    courseCode: "CSCI 721",
    courseName: "Artificial Intelligence",
    assignments: 68,
    quizzes: 72,
    project: 74,
  },
];

// Calculates a student's overall course grade.
const calculateOverallGrade = (student) => {
  return Math.round(
    student.assignments * 0.4 +
      student.quizzes * 0.25 +
      student.project * 0.35
  );
};

// Converts a numerical grade into a letter grade.
const getLetterGrade = (grade) => {
  if (grade >= 93) return "A";
  if (grade >= 90) return "A-";
  if (grade >= 87) return "B+";
  if (grade >= 83) return "B";
  if (grade >= 80) return "B-";
  if (grade >= 77) return "C+";
  if (grade >= 73) return "C";
  if (grade >= 70) return "C-";
  if (grade >= 67) return "D+";
  if (grade >= 63) return "D";
  if (grade >= 60) return "D-";

  return "F";
};

// Returns a CSS class based on the student's grade.
const getGradeClass = (grade) => {
  if (grade >= 90) return "excellent";
  if (grade >= 80) return "good";
  if (grade >= 70) return "average";

  return "needs-improvement";
};

function InstructorGradebook() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("All Courses");

  // Creates the course options used by the course filter.
  const courseOptions = useMemo(() => {
    return [
      "All Courses",
      ...new Set(gradeData.map((student) => student.courseCode)),
    ];
  }, []);

  // Adds the calculated overall grade to each student record.
  const studentsWithGrades = useMemo(() => {
    return gradeData.map((student) => {
      const overallGrade = calculateOverallGrade(student);

      return {
        ...student,
        overallGrade,
        letterGrade: getLetterGrade(overallGrade),
      };
    });
  }, []);

  // Filters students by search text and selected course.
  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase().trim();

    return studentsWithGrades.filter((student) => {
      const matchesSearch =
        student.studentName.toLowerCase().includes(normalizedSearch) ||
        student.studentId.toLowerCase().includes(normalizedSearch) ||
        student.courseCode.toLowerCase().includes(normalizedSearch);

      const matchesCourse =
        selectedCourse === "All Courses" ||
        student.courseCode === selectedCourse;

      return matchesSearch && matchesCourse;
    });
  }, [searchTerm, selectedCourse, studentsWithGrades]);

  const classAverage = Math.round(
    studentsWithGrades.reduce(
      (total, student) => total + student.overallGrade,
      0
    ) / studentsWithGrades.length
  );

  const highestGrade = Math.max(
    ...studentsWithGrades.map((student) => student.overallGrade)
  );

  const passingStudents = studentsWithGrades.filter(
    (student) => student.overallGrade >= 70
  ).length;

  const passingPercentage = Math.round(
    (passingStudents / studentsWithGrades.length) * 100
  );

  // Temporary export behavior until file exporting is connected.
  const handleExportGrades = () => {
    window.alert("Grade exporting will be connected later.");
  };

  // Temporary editing behavior until the backend is connected.
  const handleEditGrade = (student) => {
    window.alert(`Editing grades for ${student.studentName}`);
  };

  return (
    <div className="gradebook-layout">
      {/* Reusable instructor navigation */}
      <InstructorSidebar />

      <main className="gradebook-main-content">
        {/* Page heading */}
        <header className="gradebook-page-header">
          <div>
            <p className="page-label">Instructor Portal</p>
            <h1>Gradebook</h1>
            <p>Review and manage student grades across your courses.</p>
          </div>

          <button
            className="gradebook-primary-button"
            onClick={handleExportGrades}
          >
            <Download size={19} />
            Export Grades
          </button>
        </header>

        {/* Grade summary cards */}
        <section className="gradebook-stat-grid">
          <article className="gradebook-stat-card">
            <div className="gradebook-stat-icon students">
              <Users size={22} />
            </div>

            <div>
              <span>Total Students</span>
              <strong>{studentsWithGrades.length}</strong>
            </div>
          </article>

          <article className="gradebook-stat-card">
            <div className="gradebook-stat-icon average">
              <TrendingUp size={22} />
            </div>

            <div>
              <span>Class Average</span>
              <strong>{classAverage}%</strong>
            </div>
          </article>

          <article className="gradebook-stat-card">
            <div className="gradebook-stat-icon highest">
              <Award size={22} />
            </div>

            <div>
              <span>Highest Grade</span>
              <strong>{highestGrade}%</strong>
            </div>
          </article>

          <article className="gradebook-stat-card">
            <div className="gradebook-stat-icon passing">
              <GraduationCap size={22} />
            </div>

            <div>
              <span>Passing Rate</span>
              <strong>{passingPercentage}%</strong>
            </div>
          </article>
        </section>

        {/* Search and filter controls */}
        <section className="gradebook-filter-section">
          <div className="gradebook-search-box">
            <Search size={19} />

            <input
              type="text"
              placeholder="Search students, IDs, or courses..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <select
            className="gradebook-course-filter"
            value={selectedCourse}
            onChange={(event) => setSelectedCourse(event.target.value)}
            aria-label="Filter gradebook by course"
          >
            {courseOptions.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>
        </section>

        {/* Gradebook table */}
        <section className="gradebook-list-panel">
          <div className="gradebook-list-heading">
            <div>
              <h2>Student Grades</h2>
              <p>
                Showing {filteredStudents.length} of{" "}
                {studentsWithGrades.length} students
              </p>
            </div>
          </div>

          {filteredStudents.length > 0 ? (
            <div className="gradebook-table-wrapper">
              <table className="gradebook-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Assignments</th>
                    <th>Quizzes</th>
                    <th>Project</th>
                    <th>Overall</th>
                    <th>Letter Grade</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <div className="gradebook-student-cell">
                          <div className="gradebook-student-avatar">
                            {student.studentName
                              .split(" ")
                              .map((name) => name[0])
                              .join("")}
                          </div>

                          <div>
                            <strong>{student.studentName}</strong>
                            <span>ID: {student.studentId}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="gradebook-course-cell">
                          <strong>{student.courseCode}</strong>
                          <span>{student.courseName}</span>
                        </div>
                      </td>

                      <td>{student.assignments}%</td>
                      <td>{student.quizzes}%</td>
                      <td>{student.project}%</td>

                      <td>
                        <div className="overall-grade-cell">
                          <strong>{student.overallGrade}%</strong>

                          <div className="overall-grade-progress">
                            <div
                              className={`overall-grade-progress-fill ${getGradeClass(
                                student.overallGrade
                              )}`}
                              style={{
                                width: `${student.overallGrade}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`letter-grade ${getGradeClass(
                            student.overallGrade
                          )}`}
                        >
                          {student.letterGrade}
                        </span>
                      </td>

                      <td>
                        <button
                          className="gradebook-action-button"
                          onClick={() => handleEditGrade(student)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-gradebook-message">
              <BookOpen size={36} />
              <h3>No students found</h3>
              <p>Try changing your search or course filter.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default InstructorGradebook;