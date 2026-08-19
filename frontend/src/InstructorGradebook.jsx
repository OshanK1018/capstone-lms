import {
  useEffect,
  useMemo,
  useState,
} from "react";

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

import {
  getCurrentUser,
} from "../../backend/authServices.js";

import {
  getCoursesForInstructor,
  getStudentsInCourse,
} from "../../backend/courseServices.js";

import {
  assignCourseGrade,
  getGradesForCourse,
  updateCourseGrade,
} from "../../backend/gradingServices.js";

import "./InstructorGradebook.css";


const defaultGradeCategories = [
  {
    name: "Assignments",
    weight: 20,
  },
  {
    name: "Quizzes",
    weight: 20,
  },
  {
    name: "Projects",
    weight: 20,
  },
  {
    name: "Midterm",
    weight: 20,
  },
  {
    name: "Final Exam",
    weight: 20,
  },
];

function getResponseData(result) {
  return result?.data ?? result;
}

function getCoursesFromResult(result) {
  const data =
    getResponseData(result);

  if (Array.isArray(data)) {
    return data;
  }

  if (
    Array.isArray(data?.courses)
  ) {
    return data.courses;
  }

  return [];
}

function getStudentsFromResult(result) {
  const data =
    getResponseData(result);

  if (Array.isArray(data)) {
    return data;
  }

  if (
    Array.isArray(data?.student_list)
  ) {
    return data.student_list;
  }

  if (
    Array.isArray(data?.students)
  ) {
    return data.students;
  }

  return [];
}


function getGradesFromResult(result) {
  const data =
    getResponseData(result);

  if (Array.isArray(data)) {
    return data;
  }

  if (
    Array.isArray(data?.grades)
  ) {
    return data.grades;
  }

  return [];
}

function normalizeCourse(
  course,
  index
) {
  return {
    ...course,

    id:
      course.id ??
      course.course_id ??
      course.courseID,

    code:
      course.code ??
      course.course_code ??
      course.courseCode ??
      `COURSE ${index + 1}`,

    name:
      course.name ??
      course.title ??
      course.course_name ??
      course.courseName ??
      "Untitled Course",

    students:
      Number(
        course.students ??
          course.student_count ??
          course.total_students ??
          course.seats_taken ??
          0
      ),
  };
}

function normalizeStudent(
  student,
  course,
  index,
  courseGrade = null
) {
  const firstName =
    student.firstName ??
    student.first_name ??
    "";

  const lastName =
    student.lastName ??
    student.last_name ??
    "";

  const combinedName =
    `${firstName} ${lastName}`.trim();

  const studentID =
    student.student_id ??
    student.studentId ??
    student.user_id ??
    student.id ??
    index;

  return {
    id: `${course.id}-${studentID}`,

    backendStudentId:
      studentID,

    studentName:
      student.name ??
      student.fullName ??
      student.full_name ??
      (combinedName || "Student"),

    studentId:
      String(studentID),

    courseId:
      course.id,

    courseCode:
      course.code,

    courseName:
      course.name,

    grades: {
      Assignments: 0,
      Quizzes: 0,
      Projects: 0,
      Midterm: 0,
      "Final Exam": 0,
    },

    savedLetterGrade:
      courseGrade?.letter_grade ??
      student.letter_grade ??
      student.letterGrade ??
      "",

    savedOverallGrade:
      courseGrade?.score !== undefined &&
      courseGrade?.score !== null
        ? Number(courseGrade.score)
        : student.score !== undefined &&
          student.score !== null
        ? Number(student.score)
        : null,

    hasSavedGrade:
      Boolean(courseGrade),

    hasLocalCategoryEdits:
      false,
  };
}

/*
 * Calculates the weighted course grade.
 */
const calculateOverallGrade = (
  student
) => {
  if (
    !student?.hasLocalCategoryEdits &&
    student?.savedOverallGrade !== null &&
    student?.savedOverallGrade !== undefined &&
    !Number.isNaN(
      Number(student.savedOverallGrade)
    )
  ) {
    return Math.round(
      Number(student.savedOverallGrade)
    );
  }

  const total =
    defaultGradeCategories.reduce(
      (sum, category) => {
        const categoryGrade =
          Number(
            student.grades[
              category.name
            ]
          ) || 0;

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

/*
 * Converts numerical grade to letter grade.
 */
const getLetterGrade = (
  grade
) => {
  if (grade >= 90) return "A";
  if (grade >= 80) return "B";
  if (grade >= 70) return "C";
  if (grade >= 60) return "D";

  return "F";
};

/*
 * Returns CSS class based on grade.
 */
const getGradeClass = (
  grade
) => {
  if (grade >= 90) {
    return "excellent";
  }

  if (grade >= 80) {
    return "good";
  }

  if (grade >= 70) {
    return "average";
  }

  return "needs-improvement";
};

function InstructorGradebook() {
  const [courses, setCourses] =
    useState([]);

  const [gradeData, setGradeData] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [pageError, setPageError] =
    useState("");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [
    selectedCourse,
    setSelectedCourse,
  ] = useState("All Courses");

  const [
    selectedStudent,
    setSelectedStudent,
  ] = useState(null);

  const [
    showEditModal,
    setShowEditModal,
  ] = useState(false);

  const [
    saveMessage,
    setSaveMessage,
  ] = useState("");

  /*
   * Load the real instructor,
   * their courses, and students
   * enrolled in those courses.
   */
  useEffect(() => {
    async function loadGradebook() {
      setIsLoading(true);
      setPageError("");

      const userResult =
        await getCurrentUser();

      if (!userResult.success) {
        setPageError(
          userResult.error ||
            "Unable to load the current instructor."
        );

        setIsLoading(false);
        return;
      }

      const user =
        userResult.user ??
        userResult.data?.user ??
        userResult.data;

      const instructorID =
        user?.user_id ??
        user?.id ??
        user?.userId;

      if (!instructorID) {
        setPageError(
          "The logged-in instructor ID could not be found."
        );

        setIsLoading(false);
        return;
      }

      const courseResult =
        await getCoursesForInstructor(
          instructorID
        );

      if (!courseResult.success) {
        setPageError(
          courseResult.error ||
            "Unable to load instructor courses."
        );

        setIsLoading(false);
        return;
      }

      const backendCourses =
        getCoursesFromResult(
          courseResult
        );

      const normalizedCourses =
        backendCourses.map(
          (course, index) =>
            normalizeCourse(
              course,
              index
            )
        );

      setCourses(
        normalizedCourses
      );

      const rosterRequests =
        normalizedCourses.map(
          async (course) => {
            if (!course.id) {
              return [];
            }

            const [
              rosterResult,
              gradeResult,
            ] = await Promise.all([
              getStudentsInCourse(
                course.id
              ),
              getGradesForCourse(
                course.id
              ),
            ]);

            if (
              !rosterResult.success
            ) {
              return [];
            }

            const students =
              getStudentsFromResult(
                rosterResult
              );

            const courseGrades =
              gradeResult.success
                ? getGradesFromResult(
                    gradeResult
                  )
                : [];

            return students.map(
              (student, index) => {
                const studentID =
                  student.student_id ??
                  student.studentId ??
                  student.user_id ??
                  student.id;

                const savedGrade =
                  courseGrades.find(
                    (grade) =>
                      String(
                        grade.student_id
                      ) ===
                      String(studentID)
                  ) ?? null;

                return normalizeStudent(
                  student,
                  course,
                  index,
                  savedGrade
                );
              }
            );
          }
        );

      const rosterGroups =
        await Promise.all(
          rosterRequests
        );

      setGradeData(
        rosterGroups.flat()
      );

      setIsLoading(false);
    }

    loadGradebook();
  }, []);

  const courseOptions =
    useMemo(() => {
      return [
        "All Courses",

        ...courses.map(
          (course) =>
            course.code
        ),
      ];
    }, [courses]);

  const studentsWithGrades =
    useMemo(() => {
      return gradeData.map(
        (student) => {
          const overallGrade =
            calculateOverallGrade(
              student
            );

          return {
            ...student,

            overallGrade,

            letterGrade:
              getLetterGrade(
                overallGrade
              ),
          };
        }
      );
    }, [gradeData]);

  const filteredStudents =
    useMemo(() => {
      const normalizedSearch =
        searchTerm
          .toLowerCase()
          .trim();

      return studentsWithGrades.filter(
        (student) => {
          const matchesSearch =
            student.studentName
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            student.studentId
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            student.courseCode
              .toLowerCase()
              .includes(
                normalizedSearch
              );

          const matchesCourse =
            selectedCourse ===
              "All Courses" ||
            student.courseCode ===
              selectedCourse;

          return (
            matchesSearch &&
            matchesCourse
          );
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
            (
              total,
              student
            ) =>
              total +
              student.overallGrade,
            0
          ) /
            displayedStudents.length
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
        student.overallGrade >=
        70
    ).length;

  const passingPercentage =
    displayedStudents.length > 0
      ? Math.round(
          (passingStudents /
            displayedStudents.length) *
            100
        )
      : 0;

  const selectedCourseInformation =
    selectedCourse !==
    "All Courses"
      ? courses.find(
          (course) =>
            course.code ===
            selectedCourse
        )
      : null;

  const handleEditGrade = (
    student
  ) => {
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
      updatedValue =
        Math.min(
          100,
          Math.max(
            0,
            Number(value)
          )
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

        hasLocalCategoryEdits:
          true,
      })
    );

    setSaveMessage("");
  };

  /*
   * Save the local category values
   * and persist the calculated final
   * letter grade using gradingServices.
   */
  const handleSaveGrades =
    async () => {
      if (!selectedStudent) {
        return;
      }

      const overallGrade =
        calculateOverallGrade(
          selectedStudent
        );

      const letterGrade =
        getLetterGrade(
          overallGrade
        );

      setIsSaving(true);
      setSaveMessage("");

      const saveGrade =
        selectedStudent.hasSavedGrade
          ? updateCourseGrade
          : assignCourseGrade;

      const result =
        await saveGrade(
          Number(
            selectedStudent.backendStudentId
          ),
          Number(
            selectedStudent.courseId
          ),
          letterGrade,
          overallGrade
        );

      setIsSaving(false);

      if (!result.success) {
        setSaveMessage(
          result.error ||
            "Unable to save the course grade."
        );

        return;
      }

      /*
       * Keep the category values in
       * frontend state so the UI updates.
       *
       * The backend persists the final
       * numerical score and letter grade.
       */
      setGradeData(
        (previousData) =>
          previousData.map(
            (student) =>
              student.id ===
              selectedStudent.id
                ? {
                    ...student,

                    grades: {
                      ...selectedStudent.grades,
                    },

                    savedLetterGrade:
                      letterGrade,

                    savedOverallGrade:
                      overallGrade,

                    hasSavedGrade:
                      true,

                    hasLocalCategoryEdits:
                      false,
                  }
                : student
          )
      );

      setSelectedStudent(
        (previousStudent) => ({
          ...previousStudent,

          savedLetterGrade:
            letterGrade,

          savedOverallGrade:
            overallGrade,

          hasSavedGrade:
            true,

          hasLocalCategoryEdits:
            false,
        })
      );

      setSaveMessage(
        `Course grade saved as ${letterGrade}.`
      );
    };

  const handleExportGrades =
    () => {
      const studentsToExport =
        selectedCourse ===
        "All Courses"
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

      const csvContent =
        csvRows
          .map((row) =>
            row
              .map(
                (value) =>
                  `"${value}"`
              )
              .join(",")
          )
          .join("\n");

      const blob =
        new Blob(
          [csvContent],
          {
            type: "text/csv",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = url;

      link.download =
        selectedCourse ===
        "All Courses"
          ? "all-course-grades.csv"
          : `${selectedCourse.replace(
              " ",
              "-"
            )}-grades.csv`;

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

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
              Review and manage
              student grades across
              your courses.
            </p>
          </div>

          <button
            className="gradebook-primary-button"
            onClick={
              handleExportGrades
            }
          >
            <Download
              size={19}
            />

            Export Grades
          </button>
        </header>

        {pageError && (
          <div
            style={{
              margin:
                "20px 0",
              padding:
                "12px 14px",
              border:
                "1px solid #fecaca",
              borderRadius:
                "8px",
              background:
                "#fef2f2",
              color:
                "#b91c1c",
              fontSize:
                "13px",
              fontWeight:
                "600",
            }}
          >
            {pageError}
          </div>
        )}

        <section className="gradebook-stat-grid">
          <article className="gradebook-stat-card">
            <div className="gradebook-stat-icon students">
              <Users size={22} />
            </div>

            <div>
              <span>
                Total Students
              </span>

              <strong>
                {isLoading
                  ? "..."
                  : displayedStudents.length}
              </strong>
            </div>
          </article>

          <article className="gradebook-stat-card">
            <div className="gradebook-stat-icon average">
              <TrendingUp
                size={22}
              />
            </div>

            <div>
              <span>
                Class Average
              </span>

              <strong>
                {isLoading
                  ? "..."
                  : `${classAverage}%`}
              </strong>
            </div>
          </article>

          <article className="gradebook-stat-card">
            <div className="gradebook-stat-icon highest">
              <Award size={22} />
            </div>

            <div>
              <span>
                Highest Grade
              </span>

              <strong>
                {isLoading
                  ? "..."
                  : `${highestGrade}%`}
              </strong>
            </div>
          </article>

          <article className="gradebook-stat-card">
            <div className="gradebook-stat-icon passing">
              <GraduationCap
                size={22}
              />
            </div>

            <div>
              <span>
                Passing Rate
              </span>

              <strong>
                {isLoading
                  ? "..."
                  : `${passingPercentage}%`}
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
              value={
                searchTerm
              }
              onChange={(
                event
              ) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />
          </div>

          <select
            className="gradebook-course-filter"
            value={
              selectedCourse
            }
            onChange={(
              event
            ) =>
              setSelectedCourse(
                event.target.value
              )
            }
          >
            {courseOptions.map(
              (course) => (
                <option
                  key={
                    course
                  }
                  value={
                    course
                  }
                >
                  {course}
                </option>
              )
            )}
          </select>
        </section>

        {selectedCourseInformation && (
          <section className="grade-weight-summary">
            <div className="grade-weight-summary-header">
              <div>
                <h2>
                  Grading Setup
                </h2>

                <p>
                  {
                    selectedCourseInformation.name
                  }
                </p>
              </div>

              <strong>
                {
                  selectedCourseInformation.code
                }
              </strong>
            </div>

            <div className="grade-weight-list">
              {defaultGradeCategories.map(
                (category) => (
                  <div
                    className="grade-weight-item"
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
                        category.weight
                      }
                      %
                    </strong>
                  </div>
                )
              )}
            </div>

            <p
              style={{
                margin:
                  "12px 0 0",
                fontSize:
                  "12px",
                color:
                  "#64748b",
              }}
            >
              Category weights are
              currently managed by the
              frontend because no grading
              category service is connected.
            </p>
          </section>
        )}

        <section className="gradebook-list-panel">
          <div className="gradebook-list-heading">
            <div>
              <h2>
                Student Grades
              </h2>

              <p>
                {isLoading
                  ? "Loading students..."
                  : `Showing ${filteredStudents.length} of ${studentsWithGrades.length} students`}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="empty-gradebook-message">
              <BookOpen
                size={36}
              />

              <h3>
                Loading gradebook...
              </h3>

              <p>
                Retrieving students
                from your courses.
              </p>
            </div>
          ) : filteredStudents.length >
            0 ? (
            <div className="gradebook-table-wrapper">
              <table className="gradebook-table">
                <thead>
                  <tr>
                    <th>
                      Student
                    </th>

                    <th>
                      Course
                    </th>

                    <th>
                      Category Grades
                    </th>

                    <th>
                      Overall
                    </th>

                    <th>
                      Letter Grade
                    </th>

                    <th>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map(
                    (
                      student
                    ) => (
                      <tr
                        key={
                          student.id
                        }
                      >
                        <td>
                          <div className="gradebook-student-cell">
                            <div className="gradebook-student-avatar">
                              {student.studentName
                                .split(
                                  " "
                                )
                                .filter(
                                  Boolean
                                )
                                .map(
                                  (
                                    name
                                  ) =>
                                    name[0]
                                )
                                .join(
                                  ""
                                )
                                .slice(
                                  0,
                                  2
                                )}
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
                            {defaultGradeCategories.map(
                              (
                                category
                              ) => (
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
                                      student
                                        .grades[
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
              <BookOpen
                size={36}
              />

              <h3>
                No students found
              </h3>

              <p>
                Try changing your
                search or course
                filter.
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
                    setShowEditModal(
                      false
                    )
                  }
                >
                  <X size={22} />
                </button>
              </div>

              <section className="student-grade-summary">
                <div>
                  <span>
                    Student ID
                  </span>

                  <strong>
                    {
                      selectedStudent.studentId
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Current Overall
                    Grade
                  </span>

                  <strong>
                    {calculateOverallGrade(
                      selectedStudent
                    )}
                    %
                  </strong>
                </div>

                <div>
                  <span>
                    Letter Grade
                  </span>

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
                {defaultGradeCategories.map(
                  (
                    category
                  ) => (
                    <div
                      className="gradebook-edit-category"
                      key={
                        category.name
                      }
                    >
                      <div>
                        <label>
                          {
                            category.name
                          }
                        </label>

                        <span>
                          Weight:{" "}
                          {
                            category.weight
                          }
                          %
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
                              category
                                .name
                            ]
                          }
                          onChange={(
                            event
                          ) =>
                            handleGradeChange(
                              category.name,
                              event
                                .target
                                .value
                            )
                          }
                        />

                        <span>
                          %
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>

              <p
                style={{
                  margin:
                    "12px 0",
                  fontSize:
                    "12px",
                  color:
                    "#64748b",
                }}
              >
                Category percentages
                are calculated in the
                frontend. Saving sends
                the resulting final
                numerical score and
                letter grade to the
                grading service.
              </p>

              {saveMessage && (
                <div className="gradebook-save-message">
                  {
                    saveMessage
                  }
                </div>
              )}

              <div className="gradebook-modal-actions">
                <button
                  className="gradebook-modal-cancel"
                  onClick={() =>
                    setShowEditModal(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  className="gradebook-modal-save"
                  onClick={
                    handleSaveGrades
                  }
                  disabled={
                    isSaving
                  }
                >
                  <Save
                    size={17}
                  />

                  {isSaving
                    ? "Saving..."
                    : "Save Grades"}
                </button>
              </div>
            </section>
          </div>
        )}
    </div>
  );
}

export default InstructorGradebook;