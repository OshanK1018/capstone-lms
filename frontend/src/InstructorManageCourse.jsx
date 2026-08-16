import { useEffect, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  FileQuestion,
  GraduationCap,
  Megaphone,
  Plus,
  Save,
  Settings,
  Trash2,
  Users,
} from "lucide-react";

import InstructorSidebar from "./components/InstructorSidebar";

import {
  getStudentsInCourse,
} from "../../backend/courseServices.js";

import "./InstructorManageCourse.css";

function normalizeStudent(student, index) {
  const firstName =
    student.firstName ??
    student.first_name ??
    "";

  const lastName =
    student.lastName ??
    student.last_name ??
    "";

  const combinedName = `${firstName} ${lastName}`.trim();

  return {
    ...student,

    id:
      student.id ??
      student.student_id ??
      student.studentId ??
      student.user_id ??
      index,

    studentId:
      student.studentId ??
      student.student_id ??
      student.user_id ??
      "N/A",

    name:
      student.name ??
      student.fullName ??
      student.full_name ??
      combinedName ??
      "Student",

    email:
      student.email ??
      "No email available",

    status:
      student.enrollmentStatus ??
      student.enrollment_status ??
      student.status ??
      "Enrolled",
  };
}

function InstructorManageCourse() {
  const navigate = useNavigate();
  const location = useLocation();
  const { courseId } = useParams();

  const selectedCourse =
    location.state?.course;

  const course = useMemo(() => {
    if (selectedCourse) {
      return selectedCourse;
    }

    return {
      id: courseId,
      code: "Course",
      title: "Course Management",
      description: "",
      semester: "",
      status: "Active",
      students: 0,
      assignments: 0,
      gradeCategories: [],
    };
  }, [selectedCourse, courseId]);

  const [activeTab, setActiveTab] =
    useState("overview");

  const [courseForm, setCourseForm] =
    useState({
      code: course.code || "",
      title: course.title || "",
      description:
        course.description || "",
      semester:
        course.semester || "",
      status:
        course.status || "Active",
    });

  const [
    gradeCategories,
    setGradeCategories,
  ] = useState(
    course.gradeCategories || []
  );

  const [students, setStudents] =
    useState([]);

  const [rosterLoading, setRosterLoading] =
    useState(false);

  const [rosterError, setRosterError] =
    useState("");

  const [saveMessage, setSaveMessage] =
    useState("");

  useEffect(() => {
    async function loadStudents() {
      if (!course.id) {
        setRosterError(
          "A valid course ID is required to load the roster."
        );

        return;
      }

      setRosterLoading(true);
      setRosterError("");

      const result =
        await getStudentsInCourse(
          course.id
        );

      setRosterLoading(false);

      if (!result.success) {
        setRosterError(
          result.error ||
            result.message ||
            "Unable to load course roster."
        );

        return;
      }

      const backendStudents =
        Array.isArray(
          result.student_list
        )
          ? result.student_list
          : [];

      setStudents(
        backendStudents.map(
          (student, index) =>
            normalizeStudent(
              student,
              index
            )
        )
      );
    }

    loadStudents();
  }, [course.id]);

  const totalWeight =
    gradeCategories.reduce(
      (total, category) => {
        return (
          total +
          Number(
            category.weight || 0
          )
        );
      },
      0
    );

  const handleCourseFormChange = (
    event
  ) => {
    const { name, value } =
      event.target;

    setCourseForm(
      (previousForm) => ({
        ...previousForm,
        [name]: value,
      })
    );

    setSaveMessage("");
  };

  const handleCategoryChange = (
    id,
    field,
    value
  ) => {
    setGradeCategories(
      (previousCategories) =>
        previousCategories.map(
          (category) =>
            category.id === id
              ? {
                  ...category,
                  [field]: value,
                }
              : category
        )
    );

    setSaveMessage("");
  };

  const handleAddCategory = () => {
    setGradeCategories(
      (previousCategories) => [
        ...previousCategories,

        {
          id: Date.now(),
          name: "",
          weight: "",
        },
      ]
    );

    setSaveMessage("");
  };

  const handleRemoveCategory = (
    id
  ) => {
    setGradeCategories(
      (previousCategories) =>
        previousCategories.filter(
          (category) =>
            category.id !== id
        )
    );

    setSaveMessage("");
  };

  const handleRemoveStudent = (
    student
  ) => {
    setRosterError(
      `Removing ${student.name} is not connected to the backend yet.`
    );
  };

  const handleSaveCourse = (
    event
  ) => {
    if (event) {
      event.preventDefault();
    }

    if (
      !courseForm.code.trim() ||
      !courseForm.title.trim() ||
      !courseForm.semester
    ) {
      setSaveMessage(
        "Please complete all required course fields."
      );

      return;
    }

    if (
      gradeCategories.length > 0 &&
      totalWeight !== 100
    ) {
      setSaveMessage(
        "Grade category weights must total exactly 100%."
      );

      return;
    }

    setSaveMessage(
      "Course editing is ready for backend update service integration."
    );
  };

  return (
    <div className="instructor-page-layout">
      <InstructorSidebar />

      <main className="manage-course-main">
        <header className="manage-course-header">
          <div>
            <button
              className="back-to-courses-button"
              onClick={() =>
                navigate(
                  "/instructor/courses"
                )
              }
            >
              <ArrowLeft size={17} />
              Back to Courses
            </button>

            <p className="manage-course-label">
              Instructor Portal
            </p>

            <h1>
              {courseForm.code} -{" "}
              {courseForm.title}
            </h1>

            <p>
              Manage course information,
              students, grading,
              assignments, quizzes, and
              announcements.
            </p>
          </div>

          <span className="manage-course-status">
            {courseForm.status}
          </span>
        </header>

        <nav className="manage-course-tabs">
          <button
            className={
              activeTab === "overview"
                ? "manage-tab active"
                : "manage-tab"
            }
            onClick={() =>
              setActiveTab("overview")
            }
          >
            <BookOpen size={17} />
            Overview
          </button>

          <button
            className={
              activeTab === "roster"
                ? "manage-tab active"
                : "manage-tab"
            }
            onClick={() =>
              setActiveTab("roster")
            }
          >
            <Users size={17} />
            Roster
          </button>

          <button
            className={
              activeTab === "grading"
                ? "manage-tab active"
                : "manage-tab"
            }
            onClick={() =>
              setActiveTab("grading")
            }
          >
            <GraduationCap size={17} />
            Grading Setup
          </button>

          <button
            className="manage-tab"
            onClick={() =>
              navigate(
                "/instructor/assignments"
              )
            }
          >
            <ClipboardList size={17} />
            Assignments
          </button>

          <button
            className="manage-tab"
            onClick={() =>
              navigate(
                "/instructor/quizzes"
              )
            }
          >
            <FileQuestion size={17} />
            Quizzes
          </button>

          <button
            className="manage-tab"
            onClick={() =>
              navigate(
                "/instructor/announcements"
              )
            }
          >
            <Megaphone size={17} />
            Announcements
          </button>
        </nav>

        {/* Overview */}
        {activeTab === "overview" && (
          <section className="manage-section">
            <div className="manage-section-heading">
              <div>
                <h2>
                  Course Information
                </h2>

                <p>
                  Update the information
                  displayed for this
                  course.
                </p>
              </div>

              <Settings size={22} />
            </div>

            <form
              className="manage-course-form"
              onSubmit={
                handleSaveCourse
              }
            >
              <div className="manage-form-grid">
                <div className="manage-form-group">
                  <label htmlFor="manageCourseCode">
                    Course Code
                  </label>

                  <input
                    id="manageCourseCode"
                    name="code"
                    type="text"
                    value={
                      courseForm.code
                    }
                    onChange={
                      handleCourseFormChange
                    }
                  />
                </div>

                <div className="manage-form-group">
                  <label htmlFor="manageCourseTitle">
                    Course Title
                  </label>

                  <input
                    id="manageCourseTitle"
                    name="title"
                    type="text"
                    value={
                      courseForm.title
                    }
                    onChange={
                      handleCourseFormChange
                    }
                  />
                </div>

                <div className="manage-form-group">
                  <label htmlFor="manageSemester">
                    Semester
                  </label>

                  <select
                    id="manageSemester"
                    name="semester"
                    value={
                      courseForm.semester
                    }
                    onChange={
                      handleCourseFormChange
                    }
                  >
                    <option value="">
                      Select semester
                    </option>

                    <option value="Fall 2026">
                      Fall 2026
                    </option>

                    <option value="Spring 2027">
                      Spring 2027
                    </option>

                    <option value="Summer 2027">
                      Summer 2027
                    </option>
                  </select>
                </div>

                <div className="manage-form-group">
                  <label htmlFor="manageStatus">
                    Course Status
                  </label>

                  <select
                    id="manageStatus"
                    name="status"
                    value={
                      courseForm.status
                    }
                    onChange={
                      handleCourseFormChange
                    }
                  >
                    <option value="Active">
                      Active
                    </option>

                    <option value="Inactive">
                      Inactive
                    </option>
                  </select>
                </div>
              </div>

              <div className="manage-form-group">
                <label htmlFor="manageDescription">
                  Course Description
                </label>

                <textarea
                  id="manageDescription"
                  name="description"
                  rows="5"
                  value={
                    courseForm.description
                  }
                  onChange={
                    handleCourseFormChange
                  }
                />
              </div>

              {saveMessage && (
                <div className="manage-save-message">
                  {saveMessage}
                </div>
              )}

              <button
                type="submit"
                className="manage-save-button"
              >
                <Save size={17} />
                Save Changes
              </button>
            </form>
          </section>
        )}

        {/* Roster */}
        {activeTab === "roster" && (
          <section className="manage-section">
            <div className="manage-section-heading">
              <div>
                <h2>
                  Course Roster
                </h2>

                <p>
                  {rosterLoading
                    ? "Loading students..."
                    : `${students.length} students currently enrolled.`}
                </p>
              </div>

              <Users size={22} />
            </div>

            {rosterError && (
              <div className="manage-save-message">
                {rosterError}
              </div>
            )}

            <div className="roster-table-container">
              {rosterLoading ? (
                <div className="empty-roster">
                  <Users size={34} />

                  <h3>
                    Loading roster...
                  </h3>

                  <p>
                    Retrieving enrolled
                    students.
                  </p>
                </div>
              ) : students.length > 0 ? (
                <table className="roster-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>
                        Student ID
                      </th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {students.map(
                      (student) => (
                        <tr
                          key={
                            student.id
                          }
                        >
                          <td>
                            <strong>
                              {
                                student.name
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              student.studentId
                            }
                          </td>

                          <td>
                            {
                              student.email
                            }
                          </td>

                          <td>
                            <span className="roster-status">
                              {
                                student.status
                              }
                            </span>
                          </td>

                          <td>
                            <button
                              className="remove-student-button"
                              onClick={() =>
                                handleRemoveStudent(
                                  student
                                )
                              }
                            >
                              <Trash2
                                size={
                                  16
                                }
                              />

                              Remove
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              ) : (
                <div className="empty-roster">
                  <Users size={34} />

                  <h3>
                    No students enrolled
                  </h3>

                  <p>
                    Students who enroll
                    in this course will
                    appear here.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Grading Setup */}
        {activeTab === "grading" && (
          <section className="manage-section">
            <div className="manage-section-heading">
              <div>
                <h2>
                  Grading Setup
                </h2>

                <p>
                  Edit the categories used
                  to calculate the final
                  course grade.
                </p>
              </div>

              <GraduationCap size={22} />
            </div>

            <div className="manage-grading-list">
              {gradeCategories.map(
                (category) => (
                  <div
                    className="manage-grade-row"
                    key={
                      category.id
                    }
                  >
                    <div>
                      <label>
                        Category
                      </label>

                      <input
                        type="text"
                        value={
                          category.name
                        }
                        placeholder="Category name"
                        onChange={(
                          event
                        ) =>
                          handleCategoryChange(
                            category.id,
                            "name",
                            event
                              .target
                              .value
                          )
                        }
                      />
                    </div>

                    <div>
                      <label>
                        Weight
                      </label>

                      <div className="manage-weight-input">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={
                            category.weight
                          }
                          onChange={(
                            event
                          ) =>
                            handleCategoryChange(
                              category.id,
                              "weight",
                              event
                                .target
                                .value
                            )
                          }
                        />

                        <span>%</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="manage-remove-category"
                      onClick={() =>
                        handleRemoveCategory(
                          category.id
                        )
                      }
                    >
                      <Trash2
                        size={17}
                      />
                    </button>
                  </div>
                )
              )}
            </div>

            <button
              className="manage-add-category"
              onClick={
                handleAddCategory
              }
            >
              <Plus size={17} />
              Add Category
            </button>

            <div
              className={
                totalWeight === 100
                  ? "manage-grade-total complete"
                  : "manage-grade-total"
              }
            >
              <span>
                Total Weight
              </span>

              <strong>
                {totalWeight}% / 100%
              </strong>
            </div>

            {saveMessage && (
              <div className="manage-save-message">
                {saveMessage}
              </div>
            )}

            <button
              className="manage-save-button"
              onClick={
                handleSaveCourse
              }
            >
              <Save size={17} />
              Save Grading Setup
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

export default InstructorManageCourse;