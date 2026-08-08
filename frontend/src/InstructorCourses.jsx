import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  BookOpen,
  Plus,
  Search,
  Users,
  ClipboardList,
  X,
  Trash2,
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
    description:
      "Introduction to modern web application development.",
    semester: "Fall 2026",
    gradeCategories: [
      { id: 1, name: "Assignments", weight: 40 },
      { id: 2, name: "Quizzes", weight: 20 },
      { id: 3, name: "Projects", weight: 40 },
    ],
  },
  {
    id: 2,
    code: "CSCI 633",
    title: "Software Engineering",
    students: 28,
    assignments: 4,
    status: "Active",
    color: "#7c3aed",
    description:
      "Software development processes, design, and teamwork.",
    semester: "Fall 2026",
    gradeCategories: [
      { id: 1, name: "Assignments", weight: 30 },
      { id: 2, name: "Midterm", weight: 30 },
      { id: 3, name: "Final", weight: 40 },
    ],
  },
  {
    id: 3,
    code: "CSCI 721",
    title: "Artificial Intelligence",
    students: 24,
    assignments: 5,
    status: "Active",
    color: "#059669",
    description:
      "Introduction to artificial intelligence concepts.",
    semester: "Fall 2026",
    gradeCategories: [
      { id: 1, name: "Assignments", weight: 25 },
      { id: 2, name: "Quizzes", weight: 25 },
      { id: 3, name: "Final", weight: 50 },
    ],
  },
];

function InstructorCourses() {
  const navigate = useNavigate();
  const location = useLocation();

  const [courses, setCourses] = useState(initialCourses);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateCourse, setShowCreateCourse] =
    useState(false);
  const [formError, setFormError] = useState("");

  const [courseForm, setCourseForm] = useState({
    code: "",
    title: "",
    description: "",
    semester: "",
  });

  const [gradeCategories, setGradeCategories] = useState([
    {
      id: Date.now(),
      name: "Assignments",
      weight: "",
    },
  ]);

  const selectedCourse = location.state?.selectedCourse;

  const filteredCourses = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return courses;
    }

    return courses.filter((course) => {
      return (
        course.code
          .toLowerCase()
          .includes(normalizedSearch) ||
        course.title
          .toLowerCase()
          .includes(normalizedSearch)
      );
    });
  }, [searchTerm, courses]);

  const totalWeight = gradeCategories.reduce(
    (total, category) => {
      return total + Number(category.weight || 0);
    },
    0
  );

  const handleCourseFormChange = (event) => {
    const { name, value } = event.target;

    setCourseForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  const handleCategoryChange = (
    id,
    field,
    value
  ) => {
    setGradeCategories((previousCategories) =>
      previousCategories.map((category) =>
        category.id === id
          ? {
              ...category,
              [field]: value,
            }
          : category
      )
    );
  };

  const handleAddCategory = () => {
    setGradeCategories((previousCategories) => [
      ...previousCategories,
      {
        id: Date.now(),
        name: "",
        weight: "",
      },
    ]);
  };

  const handleRemoveCategory = (id) => {
    if (gradeCategories.length === 1) {
      return;
    }

    setGradeCategories((previousCategories) =>
      previousCategories.filter(
        (category) => category.id !== id
      )
    );
  };

  const resetCourseForm = () => {
    setCourseForm({
      code: "",
      title: "",
      description: "",
      semester: "",
    });

    setGradeCategories([
      {
        id: Date.now(),
        name: "Assignments",
        weight: "",
      },
    ]);

    setFormError("");
  };

  const handleCloseCreateCourse = () => {
    setShowCreateCourse(false);

    resetCourseForm();
  };

  const handleCreateCourse = (event) => {
    event.preventDefault();

    if (
      !courseForm.code.trim() ||
      !courseForm.title.trim() ||
      !courseForm.semester.trim()
    ) {
      setFormError(
        "Please complete all required course fields."
      );

      return;
    }

    const hasEmptyCategory =
      gradeCategories.some(
        (category) =>
          !category.name.trim() ||
          category.weight === "" ||
          Number(category.weight) <= 0
      );

    if (hasEmptyCategory) {
      setFormError(
        "Please enter a name and valid weight for every grade category."
      );

      return;
    }

    if (totalWeight !== 100) {
      setFormError(
        "Grade category weights must total exactly 100%."
      );

      return;
    }

    const newCourse = {
      id: Date.now(),
      code: courseForm.code.trim(),
      title: courseForm.title.trim(),
      description:
        courseForm.description.trim(),
      semester: courseForm.semester,
      students: 0,
      assignments: 0,
      status: "Active",
      color: "#2563eb",
      gradeCategories: gradeCategories.map(
        (category) => ({
          ...category,
          weight: Number(category.weight),
        })
      ),
    };

    setCourses((previousCourses) => [
      ...previousCourses,
      newCourse,
    ]);

    setShowCreateCourse(false);

    resetCourseForm();
  };

  const handleManageCourse = (course) => {
    navigate(
      `/instructor/courses/${course.id}`,
      {
        state: {
          course,
        },
      }
    );
  };

  return (
    <div className="instructor-page-layout">
      <InstructorSidebar />

      <main className="courses-main-content">
        <header className="courses-page-header">
          <div>
            <p className="page-label">
              Instructor Portal
            </p>

            <h1>My Courses</h1>

            <p>
              View and manage all courses assigned
              to you.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() =>
              setShowCreateCourse(true)
            }
          >
            <Plus size={18} />
            Create Course
          </button>
        </header>

        {selectedCourse && (
          <section className="selected-course-notice">
            <strong>Selected course:</strong>

            <span>
              {selectedCourse.code} -{" "}
              {selectedCourse.title}
            </span>
          </section>
        )}

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

        <section className="all-courses-section">
          <div className="all-courses-header">
            <div>
              <h2>All Courses</h2>

              <p>
                {filteredCourses.length} courses found
              </p>
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
                      backgroundColor:
                        course.color,
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

                        <span>
                          {course.students} students
                        </span>
                      </div>

                      <div>
                        <ClipboardList
                          size={18}
                        />

                        <span>
                          {course.assignments}{" "}
                          assignments
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
                Try searching with a different
                course code or title.
              </p>
            </div>
          )}
        </section>
      </main>

      {showCreateCourse && (
        <div className="course-modal-overlay">
          <section className="course-modal">
            <div className="course-modal-header">
              <div>
                <p className="page-label">
                  Course Management
                </p>

                <h2>Create Course</h2>
              </div>

              <button
                type="button"
                className="course-modal-close"
                onClick={
                  handleCloseCreateCourse
                }
              >
                <X size={22} />
              </button>
            </div>

            <form
              className="create-course-form"
              onSubmit={handleCreateCourse}
            >
              <div className="course-form-grid">
                <div className="course-form-group">
                  <label htmlFor="courseCode">
                    Course Code *
                  </label>

                  <input
                    id="courseCode"
                    name="code"
                    type="text"
                    placeholder="Example: CSCI 510"
                    value={courseForm.code}
                    onChange={
                      handleCourseFormChange
                    }
                  />
                </div>

                <div className="course-form-group">
                  <label htmlFor="courseTitle">
                    Course Title *
                  </label>

                  <input
                    id="courseTitle"
                    name="title"
                    type="text"
                    placeholder="Example: Web Application Development"
                    value={courseForm.title}
                    onChange={
                      handleCourseFormChange
                    }
                  />
                </div>
              </div>

              <div className="course-form-group">
                <label htmlFor="semester">
                  Semester *
                </label>

                <select
                  id="semester"
                  name="semester"
                  value={courseForm.semester}
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

              <div className="course-form-group">
                <label htmlFor="courseDescription">
                  Course Description
                </label>

                <textarea
                  id="courseDescription"
                  name="description"
                  rows="4"
                  placeholder="Enter a short description of the course"
                  value={
                    courseForm.description
                  }
                  onChange={
                    handleCourseFormChange
                  }
                />
              </div>

              <section className="grading-section">
                <div className="grading-section-header">
                  <div>
                    <h3>Grade Categories</h3>

                    <p>
                      Add the categories used to
                      calculate the final course
                      grade.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="add-category-button"
                    onClick={
                      handleAddCategory
                    }
                  >
                    <Plus size={17} />

                    Add Category
                  </button>
                </div>

                <div className="grade-category-list">
                  {gradeCategories.map(
                    (category) => (
                      <div
                        className="grade-category-row"
                        key={category.id}
                      >
                        <div className="category-name-field">
                          <label>
                            Category
                          </label>

                          <input
                            type="text"
                            placeholder="Assignments, Quizzes, Final..."
                            value={
                              category.name
                            }
                            onChange={(
                              event
                            ) =>
                              handleCategoryChange(
                                category.id,
                                "name",
                                event.target
                                  .value
                              )
                            }
                          />
                        </div>

                        <div className="category-weight-field">
                          <label>Weight</label>

                          <div className="weight-input-container">
                            <input
                              type="number"
                              min="1"
                              max="100"
                              placeholder="0"
                              value={
                                category.weight
                              }
                              onChange={(
                                event
                              ) =>
                                handleCategoryChange(
                                  category.id,
                                  "weight",
                                  event.target
                                    .value
                                )
                              }
                            />

                            <span>%</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="remove-category-button"
                          onClick={() =>
                            handleRemoveCategory(
                              category.id
                            )
                          }
                          disabled={
                            gradeCategories.length ===
                            1
                          }
                        >
                          <Trash2
                            size={18}
                          />
                        </button>
                      </div>
                    )
                  )}
                </div>

                <div
                  className={
                    totalWeight === 100
                      ? "grade-total grade-total-complete"
                      : "grade-total"
                  }
                >
                  <span>Total Weight</span>

                  <strong>
                    {totalWeight}% / 100%
                  </strong>
                </div>
              </section>

              {formError && (
                <div className="course-form-error">
                  {formError}
                </div>
              )}

              <div className="course-form-actions">
                <button
                  type="button"
                  className="course-cancel-button"
                  onClick={
                    handleCloseCreateCourse
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="course-create-button"
                >
                  <Plus size={18} />

                  Create Course
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default InstructorCourses;