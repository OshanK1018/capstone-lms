import { useMemo, useState } from "react";

import {
  Award,
  BookOpen,
  Download,
  GraduationCap,
  Save,
  Search,
  TrendingUp,
  Users,
  X,
} from "lucide-react";

import InstructorSidebar from "./components/InstructorSidebar";

import "./InstructorGradebook.css";

// Temporary course grading setups.
// These will eventually come from the backend.
const courseGradingSetups = {
  "CSCI 510": {
    courseName: "Web Application Development",
    categories: [
      {
        name: "Assignments",
        weight: 10,
      },
      {
        name: "Quizzes",
        weight: 15,
      },
      {
        name: "Projects",
        weight: 25,
      },
      {
        name: "Midterm",
        weight: 20,
      },
      {
        name: "Final Exam",
        weight: 30,
      },
    ],
  },

  "CSCI 633": {
    courseName: "Software Engineering",
    categories: [
      {
        name: "Assignments",
        weight: 20,
      },
      {
        name: "Quizzes",
        weight: 10,
      },
      {
        name: "Projects",
        weight: 30,
      },
      {
        name: "Midterm",
        weight: 15,
      },
      {
        name: "Final Exam",
        weight: 25,
      },
    ],
  },

  "CSCI 721": {
    courseName: "Artificial Intelligence",
    categories: [
      {
        name: "Assignments",
        weight: 20,
      },
      {
        name: "Quizzes",
        weight: 15,
      },
      {
        name: "Projects",
        weight: 25,
      },
      {
        name: "Midterm",
        weight: 15,
      },
      {
        name: "Final Exam",
        weight: 25,
      },
    ],
  },
};

// Temporary student grade data.
const initialGradeData = [
  {
    id: 1,
    studentName: "Ava Martinez",
    studentId: "10024561",
    courseCode: "CSCI 510",
    courseName: "Web Application Development",
    grades: {
      Assignments: 92,
      Quizzes: 88,
      Projects: 95,
      Midterm: 90,
      "Final Exam": 94,
    },
  },
  {
    id: 2,
    studentName: "Liam Johnson",
    studentId: "10024562",
    courseCode: "CSCI 510",
    courseName: "Web Application Development",
    grades: {
      Assignments: 84,
      Quizzes: 79,
      Projects: 90,
      Midterm: 82,
      "Final Exam": 86,
    },
  },
  {
    id: 3,
    studentName: "Sophia Williams",
    studentId: "10024563",
    courseCode: "CSCI 633",
    courseName: "Software Engineering",
    grades: {
      Assignments: 96,
      Quizzes: 91,
      Projects: 94,
      Midterm: 93,
      "Final Exam": 95,
    },
  },
  {
    id: 4,
    studentName: "Noah Brown",
    studentId: "10024564",
    courseCode: "CSCI 633",
    courseName: "Software Engineering",
    grades: {
      Assignments: 76,
      Quizzes: 82,
      Projects: 80,
      Midterm: 78,
      "Final Exam": 81,
    },
  },
  {
    id: 5,
    studentName: "Emma Davis",
    studentId: "10024565",
    courseCode: "CSCI 721",
    courseName: "Artificial Intelligence",
    grades: {
      Assignments: 89,
      Quizzes: 93,
      Projects: 91,
      Midterm: 87,
      "Final Exam": 92,
    },
  },
  {
    id: 6,
    studentName: "Ethan Wilson",
    studentId: "10024566",
    courseCode: "CSCI 721",
    courseName: "Artificial Intelligence",
    grades: {
      Assignments: 68,
      Quizzes: 72,
      Projects: 74,
      Midterm: 70,
      "Final Exam": 73,
    },
  },
];

// Calculates weighted course grade.
const calculateOverallGrade = (student) => {
  const gradingSetup =
    courseGradingSetups[student.courseCode];

  if (!gradingSetup) {
    return 0;
  }

  const total = gradingSetup.categories.reduce(
    (sum, category) => {
      const categoryGrade =
        Number(student.grades[category.name]) || 0;

      return (
        sum +
        categoryGrade *
          (category.weight / 100)
      );
    },
    0
  );

  return Math.round(total);
};

// Converts numerical grade to letter grade.
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

// Returns CSS class based on grade.
const getGradeClass = (grade) => {
  if (grade >= 90) return "excellent";
  if (grade >= 80) return "good";
  if (grade >= 70) return "average";

  return "needs-improvement";
};

function InstructorGradebook() {
  const [gradeData, setGradeData] =
    useState(initialGradeData);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [selectedCourse, setSelectedCourse] =
    useState("All Courses");

  const [selectedStudent, setSelectedStudent] =
    useState(null);

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [saveMessage, setSaveMessage] =
    useState("");

  const courseOptions = useMemo(() => {
    return [
      "All Courses",
      ...Object.keys(courseGradingSetups),
    ];
  }, []);

  const studentsWithGrades = useMemo(() => {
    return gradeData.map((student) => {
      const overallGrade =
        calculateOverallGrade(student);

      return {
        ...student,
        overallGrade,
        letterGrade:
          getLetterGrade(overallGrade),
      };
    });
  }, [gradeData]);

  const filteredStudents = useMemo(() => {
    const normalizedSearch =
      searchTerm.toLowerCase().trim();

    return studentsWithGrades.filter(
      (student) => {
        const matchesSearch =
          student.studentName
            .toLowerCase()
            .includes(normalizedSearch) ||
          student.studentId
            .toLowerCase()
            .includes(normalizedSearch) ||
          student.courseCode
            .toLowerCase()
            .includes(normalizedSearch);

        const matchesCourse =
          selectedCourse === "All Courses" ||
          student.courseCode ===
            selectedCourse;

        return matchesSearch && matchesCourse;
      }
    );
  }, [
    searchTerm,
    selectedCourse,
    studentsWithGrades,
  ]);

  const displayedStudents =
    filteredStudents.length > 0
      ? filteredStudents
      : [];

  const classAverage =
    displayedStudents.length > 0
      ? Math.round(
          displayedStudents.reduce(
            (total, student) =>
              total + student.overallGrade,
            0
          ) / displayedStudents.length
        )
      : 0;

  const highestGrade =
    displayedStudents.length > 0
      ? Math.max(
          ...displayedStudents.map(
            (student) =>
              student.overallGrade
          )
        )
      : 0;

  const passingStudents =
    displayedStudents.filter(
      (student) =>
        student.overallGrade >= 70
    ).length;

  const passingPercentage =
    displayedStudents.length > 0
      ? Math.round(
          (passingStudents /
            displayedStudents.length) *
            100
        )
      : 0;

  const selectedCourseSetup =
    selectedCourse !== "All Courses"
      ? courseGradingSetups[selectedCourse]
      : null;

  const handleEditGrade = (student) => {
    setSelectedStudent({
      ...student,
      grades: {
        ...student.grades,
      },
    });

    setSaveMessage("");

    setShowEditModal(true);
  };

  const handleGradeChange = (
    categoryName,
    value
  ) => {
    let updatedValue = value;

    if (value !== "") {
      updatedValue = Math.min(
        100,
        Math.max(0, Number(value))
      );
    }

    setSelectedStudent(
      (previousStudent) => ({
        ...previousStudent,

        grades: {
          ...previousStudent.grades,

          [categoryName]:
            updatedValue,
        },
      })
    );

    setSaveMessage("");
  };

  const handleSaveGrades = () => {
    setGradeData((previousData) =>
      previousData.map((student) =>
        student.id === selectedStudent.id
          ? {
              ...student,

              grades: {
                ...selectedStudent.grades,
              },
            }
          : student
      )
    );

    setSaveMessage(
      "Student grades saved temporarily."
    );
  };

  const handleExportGrades = () => {
    const studentsToExport =
      selectedCourse === "All Courses"
        ? studentsWithGrades
        : studentsWithGrades.filter(
            (student) =>
              student.courseCode ===
              selectedCourse
          );

    const csvRows = [];

    csvRows.push([
      "Student Name",
      "Student ID",
      "Course",
      "Overall Grade",
      "Letter Grade",
    ]);

    studentsToExport.forEach(
      (student) => {
        csvRows.push([
          student.studentName,
          student.studentId,
          student.courseCode,
          `${student.overallGrade}%`,
          student.letterGrade,
        ]);
      }
    );

    const csvContent = csvRows
      .map((row) =>
        row.map((value) => `"${value}"`).join(",")
      )
      .join("\n");

    const blob = new Blob(
      [csvContent],
      {
        type: "text/csv",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      selectedCourse === "All Courses"
        ? "all-course-grades.csv"
        : `${selectedCourse.replace(
            " ",
            "-"
          )}-grades.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <div className="gradebook-layout">
      <InstructorSidebar />

      <main className="gradebook-main-content">
        <header className="gradebook-page-header">
          <div>
            <p className="page-label">
              Instructor Portal
            </p>

            <h1>Gradebook</h1>

            <p>
              Review and manage student grades
              across your courses.
            </p>
          </div>

          <button
            className="gradebook-primary-button"
            onClick={handleExportGrades}
          >
            <Download size={19} />
            Export Grades
          </button>
        </header>

        <section className="gradebook-stat-grid">
          <article className="gradebook-stat-card">
            <div className="gradebook-stat-icon students">
              <Users size={22} />
            </div>

            <div>
              <span>Total Students</span>

              <strong>
                {displayedStudents.length}
              </strong>
            </div>
          </article>

          <article className="gradebook-stat-card">
            <div className="gradebook-stat-icon average">
              <TrendingUp size={22} />
            </div>

            <div>
              <span>Class Average</span>

              <strong>
                {classAverage}%
              </strong>
            </div>
          </article>

          <article className="gradebook-stat-card">
            <div className="gradebook-stat-icon highest">
              <Award size={22} />
            </div>

            <div>
              <span>Highest Grade</span>

              <strong>
                {highestGrade}%
              </strong>
            </div>
          </article>

          <article className="gradebook-stat-card">
            <div className="gradebook-stat-icon passing">
              <GraduationCap size={22} />
            </div>

            <div>
              <span>Passing Rate</span>

              <strong>
                {passingPercentage}%
              </strong>
            </div>
          </article>
        </section>

        <section className="gradebook-filter-section">
          <div className="gradebook-search-box">
            <Search size={19} />

            <input
              type="text"
              placeholder="Search students, IDs, or courses..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />
          </div>

          <select
            className="gradebook-course-filter"
            value={selectedCourse}
            onChange={(event) =>
              setSelectedCourse(
                event.target.value
              )
            }
          >
            {courseOptions.map(
              (course) => (
                <option
                  key={course}
                  value={course}
                >
                  {course}
                </option>
              )
            )}
          </select>
        </section>

        {selectedCourseSetup && (
          <section className="grade-weight-summary">
            <div className="grade-weight-summary-header">
              <div>
                <h2>
                  Grading Setup
                </h2>

                <p>
                  {
                    selectedCourseSetup.courseName
                  }
                </p>
              </div>

              <strong>
                {selectedCourse}
              </strong>
            </div>

            <div className="grade-weight-list">
              {selectedCourseSetup.categories.map(
                (category) => (
                  <div
                    className="grade-weight-item"
                    key={category.name}
                  >
                    <span>
                      {category.name}
                    </span>

                    <strong>
                      {category.weight}%
                    </strong>
                  </div>
                )
              )}
            </div>
          </section>
        )}

        <section className="gradebook-list-panel">
          <div className="gradebook-list-heading">
            <div>
              <h2>Student Grades</h2>

              <p>
                Showing{" "}
                {filteredStudents.length} of{" "}
                {studentsWithGrades.length}{" "}
                students
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
                    <th>Category Grades</th>
                    <th>Overall</th>
                    <th>Letter Grade</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map(
                    (student) => (
                      <tr key={student.id}>
                        <td>
                          <div className="gradebook-student-cell">
                            <div className="gradebook-student-avatar">
                              {student.studentName
                                .split(" ")
                                .map(
                                  (name) =>
                                    name[0]
                                )
                                .join("")}
                            </div>

                            <div>
                              <strong>
                                {
                                  student.studentName
                                }
                              </strong>

                              <span>
                                ID:{" "}
                                {
                                  student.studentId
                                }
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="gradebook-course-cell">
                            <strong>
                              {
                                student.courseCode
                              }
                            </strong>

                            <span>
                              {
                                student.courseName
                              }
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="grade-category-preview">
                            {courseGradingSetups[
                              student.courseCode
                            ].categories.map(
                              (category) => (
                                <div
                                  key={
                                    category.name
                                  }
                                >
                                  <span>
                                    {
                                      category.name
                                    }
                                  </span>

                                  <strong>
                                    {
                                      student.grades[
                                        category
                                          .name
                                      ]
                                    }
                                    %
                                  </strong>
                                </div>
                              )
                            )}
                          </div>
                        </td>

                        <td>
                          <div className="overall-grade-cell">
                            <strong>
                              {
                                student.overallGrade
                              }
                              %
                            </strong>

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
                            {
                              student.letterGrade
                            }
                          </span>
                        </td>

                        <td>
                          <button
                            className="gradebook-action-button"
                            onClick={() =>
                              handleEditGrade(
                                student
                              )
                            }
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-gradebook-message">
              <BookOpen size={36} />

              <h3>No students found</h3>

              <p>
                Try changing your search or
                course filter.
              </p>
            </div>
          )}
        </section>
      </main>

      {showEditModal &&
        selectedStudent && (
          <div className="gradebook-modal-overlay">
            <section className="gradebook-modal">
              <div className="gradebook-modal-header">
                <div>
                  <p className="page-label">
                    Grade Management
                  </p>

                  <h2>
                    {
                      selectedStudent.studentName
                    }
                  </h2>

                  <p>
                    {
                      selectedStudent.courseCode
                    }{" "}
                    -{" "}
                    {
                      selectedStudent.courseName
                    }
                  </p>
                </div>

                <button
                  className="gradebook-modal-close"
                  onClick={() =>
                    setShowEditModal(false)
                  }
                >
                  <X size={22} />
                </button>
              </div>

              <section className="student-grade-summary">
                <div>
                  <span>Student ID</span>

                  <strong>
                    {
                      selectedStudent.studentId
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Current Overall Grade
                  </span>

                  <strong>
                    {calculateOverallGrade(
                      selectedStudent
                    )}
                    %
                  </strong>
                </div>

                <div>
                  <span>Letter Grade</span>

                  <strong>
                    {getLetterGrade(
                      calculateOverallGrade(
                        selectedStudent
                      )
                    )}
                  </strong>
                </div>
              </section>

              <div className="gradebook-edit-category-list">
                {courseGradingSetups[
                  selectedStudent.courseCode
                ].categories.map(
                  (category) => (
                    <div
                      className="gradebook-edit-category"
                      key={category.name}
                    >
                      <div>
                        <label>
                          {category.name}
                        </label>

                        <span>
                          Weight:{" "}
                          {category.weight}%
                        </span>
                      </div>

                      <div className="gradebook-grade-input">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={
                            selectedStudent
                              .grades[
                              category.name
                            ]
                          }
                          onChange={(event) =>
                            handleGradeChange(
                              category.name,
                              event.target
                                .value
                            )
                          }
                        />

                        <span>%</span>
                      </div>
                    </div>
                  )
                )}
              </div>

              {saveMessage && (
                <div className="gradebook-save-message">
                  {saveMessage}
                </div>
              )}

              <div className="gradebook-modal-actions">
                <button
                  className="gradebook-modal-cancel"
                  onClick={() =>
                    setShowEditModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  className="gradebook-modal-save"
                  onClick={
                    handleSaveGrades
                  }
                >
                  <Save size={17} />
                  Save Grades
                </button>
              </div>
            </section>
          </div>
        )}
    </div>
  );
}

export default InstructorGradebook;